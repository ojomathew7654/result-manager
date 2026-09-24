"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AdminShell({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.role !== "ADMIN") {
      signOut({ redirect: false }).then(() => router.push("/"));
    }
    if (status === "unauthenticated") router.push("/");
  }, [router, session, status]);

  if (status === "loading" || status === "unauthenticated" || session?.role !== "ADMIN") {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-ink-500">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
