"use client";
import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <GlobalHeader />;
}