"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { GraduationCap, LogOut } from "lucide-react";
import { studentNav } from "@/lib/navigation";

export default function StudentTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("studentData");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-ink-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-ink-900">
            <GraduationCap size={16} strokeWidth={2.25} />
          </div>
          <span className="hidden font-display text-sm font-semibold sm:inline">Beida Basic School</span>
        </div>

        <nav className="flex items-center gap-1 rounded-full bg-ink-800/70 p-1">
          {studentNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
                pathname === item.href ? "bg-amber-400 text-ink-900" : "text-ink-200 hover:text-white"
              )}
            >
              <item.icon size={15} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={logOut}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-200 hover:text-white"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
