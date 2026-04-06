import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("🔥 DEBUG: Google SignIn triggered for", user.email);
      // 這裡維持 return true，確保前端能拿到 session，資料庫寫入交給 character API
      return true;
    },
  },
});

export { handler as GET, handler as POST };