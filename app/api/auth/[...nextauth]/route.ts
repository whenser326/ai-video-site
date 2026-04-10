import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
      // 這裡維持 return true，確保前端能拿到 session，資庫寫入交給 character API
      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };