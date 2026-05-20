import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_MILESTONES = [
  { count: 1, credits: 5 },
  { count: 3, credits: 15 },
  { count: 5, credits: 30 },
];

// 讀取里程碑設定（含 fallback）
async function getMilestones() {
  const rows = await Promise.all([
    supabase.from("admin_settings").select("value").eq("key", "referral_milestone_1").single(),
    supabase.from("admin_settings").select("value").eq("key", "referral_milestone_2").single(),
    supabase.from("admin_settings").select("value").eq("key", "referral_milestone_3").single(),
  ]);

  return rows.map((r, i) => {
    try {
      const parsed = JSON.parse(r.data?.value || "");
      if (parsed.count && parsed.credits) return parsed;
    } catch {}
    return DEFAULT_MILESTONES[i];
  });
}

// GET：查詢目前進度
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = session.user.email;

  const [milestones, referralCount, claimedRows] = await Promise.all([
    getMilestones(),
    // 計算成功推薦人數（referral_logs 中 referrer_email = email 的不重複 referred_email）
    supabase
      .from("referral_logs")
      .select("referred_email", { count: "exact" })
      .eq("referrer_email", email),
    // 查已發放的里程碑
    supabase
      .from("referral_milestone_logs")
      .select("milestone_index")
      .eq("email", email),
  ]);

  const count = referralCount.count ?? 0;
  const claimed = new Set((claimedRows.data ?? []).map((r: any) => r.milestone_index));

  const result = milestones.map((m, i) => ({
    index: i + 1,
    count: m.count,
    credits: m.credits,
    claimed: claimed.has(i + 1),
    reached: count >= m.count,
  }));

  return NextResponse.json({ referralCount: count, milestones: result });
}