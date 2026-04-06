"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div style={{ marginBottom: 20 }}>
        <span>👋 {session.user?.name}</span>
        <button
          onClick={() => signOut()}
          style={{ marginLeft: 10 }}
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn("google")}>
      使用 Google 登入
    </button>
  );
}