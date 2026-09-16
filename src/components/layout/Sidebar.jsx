"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { GraduationCap, X } from "lucide-react";
import { adminNav } from "@/lib/navigation";

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile scrim */}
      {open ? (
        <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={onClose} />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink-900 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-ink-900">
              <GraduationCap size={20} strokeWidth={2.25} />
            </div>
            <div>
              <p className="font-display text-sm font-semibold leading-tight text-white">Beida Basic</p>
              <p className="text-xs text-ink-300">Result Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-6">
          {adminNav.map((item, index) =>
            item.section ? (
              <p
                key={`section-${index}`}
                className="mt-5 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400 first:mt-1"
              >
                {item.section}
              </p>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-brand-600 text-white"
                    : "text-ink-200 hover:bg-ink-800 hover:text-white"
                )}
              >
                <item.icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            )
          )}
        </nav>
      </aside>
    </>
  );
}
