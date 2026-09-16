"use client";

import Link from "next/link";
import { Menu, Bell, LogOut } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function Topbar({ onMenuClick, name = "Admin", role = "Administrator" }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink-100 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="hidden text-sm text-ink-400 lg:block">
        2025/2026 academic session &middot; First term
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-600">
          <Bell size={18} />
        </button>
        <div className="h-6 w-px bg-ink-100" />
        <div className="flex items-center gap-2.5">
          <Avatar name={name} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-ink-900">{name}</p>
            <p className="text-xs text-ink-400">{role}</p>
          </div>
        </div>
        <Link
          href="/login/users"
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 hover:border-rose-300 hover:text-rose-500"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Log out</span>
        </Link>
      </div>
    </header>
  );
}
