"use client";

import StudentTopNav from "@/components/layout/StudentTopNav";

import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/student/login");

  return (
    <div className="min-h-screen bg-paper">
      {!isLoginPage ? (
        <>
          <StudentTopNav />
          <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            {children}
          </main>
        </>
      ) : (
       <div> {children} </div>
      )}
    </div>
  );
}
