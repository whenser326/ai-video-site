import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST 投稿角色
export async function POST(req: Request) {
  const body = await req.json();
  const { characterId, name, image_url, description, voice_id, tags, visibility, userEmail } = body;

  if (!userEmail) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  if (!name || !image_url) {
    return NextResponse.json({ error: "名稱和圖片為必填" }, { status: 400 });
  }

  if (!["anonymous", "public"].includes(visibility)) {
    return NextResponse.json({ error: "visibility 參數錯誤" }, { status: 400 });
  }

  // 寫入 public_characters
  const { data: inserted, error } = await supabase
    .from("public_characters")
    .insert({
      original_character_id: characterId || null,
      user_email: userEmail,
      name,
      image_url,
      description: description || "",
      voice_id: voice_id || null,
      tags: tags || [],
      visibility,
      status: "pending",
      is_active: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 通知管理員（寫入 feedback_messages）
  const visibilityLabel = visibility === "anonymous" ? "匿名公開" : "公開分享";
  await supabase.from("feedback_messages").insert({
    user_email: userEmail,
    subject: `📬 新角色投稿：${name}`,
    content: `公開方式：${visibilityLabel}\n角色描述：${description || "無"}\n投稿ID：${inserted.id}\n請至後台 /admin/gallery 待審核分頁審核。`,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, id: inserted.id });
}

// GET 查詢用戶自己的投稿狀態
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("public_characters")
    .select("id, name, image_url, visibility, status, reject_reason, created_at")
    .eq("user_email", session.user.email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

// PATCH 後台審核（核准 / 退件）
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, action, reject_reason, adminEmail } = body;

  if (adminEmail !== "whenser@gmail.com") {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "參數錯誤" }, { status: 400 });
  }

  // 取得投稿資料（用於通知用戶）
  const { data: item } = await supabase
    .from("public_characters")
    .select("user_email, name, image_url, description, tags, gender")
    .eq("id", id)
    .single();

  if (action === "approve") {
    await supabase
      .from("public_characters")
      .update({ status: "approved", is_active: true })
      .eq("id", id);

    // 複製到 public_gallery 讓前台顯示
    if (item) {
      await supabase.from("public_gallery").insert({
        name: item.name,
        image_url: item.image_url,
        story: item.description || "",
        story_type: "short",
        personality_tags: item.tags || [],
        gender: item.gender || "",
        age: 25,
        like_count_min: 10,
        like_count_max: 50,
        chat_count_min: 5,
        chat_count_max: 30,
        is_featured: false,
        is_active: true,
        sort_order: 999,
        actual_chat_count: 0,
      });
    }

    // 通知用戶核准
    if (item) {
      await supabase.from("feedback_messages").insert({
        user_email: item.user_email,
        subject: `✅ 角色投稿審核通過`,
        content: `你的角色「${item.name}」已審核通過，上架到角色探索頁！`,
        admin_reply: "🎉 恭喜！你的角色已成功上架，其他用戶現在可以探索並和你的角色聊天。感謝你的投稿！",
        status: "replied",
        is_read_by_user: false,
        created_at: new Date().toISOString(),
      });
    }
  } else {
    await supabase
      .from("public_characters")
      .update({ status: "rejected", is_active: false, reject_reason: reject_reason || "不符合上架規範" })
      .eq("id", id);

    // 通知用戶退件 + 原因
    if (item) {
      await supabase.from("feedback_messages").insert({
        user_email: item.user_email,
        subject: `❌ 角色投稿審核未通過`,
        content: `你的角色「${item.name}」審核未通過。`,
        admin_reply: reject_reason || "不符合上架規範，請修改後重新投稿。",
        status: "replied",
        is_read_by_user: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ success: true });
}