// [DNA_PATCH_START] 完整 auth-route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: any }) {
      console.log("🔴 DEBUG: Google SignIn triggered for", user.email);

      if (user.email) {
        const [localPart, domain] = user.email.split('@');
        if (domain === 'gmail.com') {
          const normalized = localPart.split('+')[0].replace(/\./g, '') + '@' + domain;
          // 無論是否正規化，都查一次重複（防止完全相同email重複註冊）
          const { data: existing } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', normalized)
            .maybeSingle();
          if (existing && existing.email !== user.email) {
            console.log(`❌ 拒絕重複帳號: ${user.email} → 已存在 ${normalized}`);
            return false;
          }
        }
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
// [DNA_PATCH_END]