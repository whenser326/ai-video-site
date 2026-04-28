// [DNA_PATCH_START] 新建檔案 app/api/admin/delete-users/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { adminEmail, emails } = await req.json();

    if (adminEmail !== 'whenser@gmail.com') {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: '沒有指定要刪除的帳號' }, { status: 400 });
    }

    // 刪除 profiles 表
    await supabase.from('profiles').delete().in('email', emails);
    // 刪除 user_generations 表
    await supabase.from('user_generations').delete().in('user_email', emails);
    // 刪除 saved_characters 表
    await supabase.from('saved_characters').delete().in('user_email', emails);
    // 刪除 checkin_logs 表
    await supabase.from('checkin_logs').delete().in('email', emails);

    // 刪除 Supabase Auth 用戶
    let deleted = 0;
    for (const email of emails) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const target = users?.users?.find(u => u.email === email);
      if (target) {
        await supabase.auth.admin.deleteUser(target.id);
        deleted++;
      } else {
        deleted++; // profiles 已刪，算成功
      }
    }

    console.log(`🗑️ 管理員 ${adminEmail} 刪除了 ${deleted} 個帳號：${emails.join(', ')}`);

    return NextResponse.json({ ok: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// [DNA_PATCH_END]