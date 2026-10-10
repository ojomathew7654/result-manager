"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, ChevronUp, GraduationCap, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { adminNav } from "@/lib/navigation";

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [school, setSchool] = useState({});

  const [studentsOpen, setStudentsOpen] = useState(
    pathname.startsWith("/admin/primary") || pathname.startsWith("/admin/secondary")
  );

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data || {});
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolData();
    }
  }, [session]);

  const schoolDisplayName = school.name || school.fullName || "School Portal";
  const currentYear = new Date().getFullYear();

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
            {school?.logo ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-ink-700 bg-ink-800">
                <Image
                  src={school.logo}
                  alt={`${schoolDisplayName} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-ink-900 shrink-0">
                <GraduationCap size={20} strokeWidth={2.25} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold leading-tight text-white truncate uppercase">
                {schoolDisplayName}
              </p>
              <p className="text-xs text-ink-300">Result Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-6">
          {adminNav.map((item, index) => {
            if (item.section) {
              return (
                <p
                  key={`section-${index}`}
                  className="mt-5 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400 first:mt-1"
                >
                  {item.section}
                </p>
              );
            }

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => setStudentsOpen((value) => !value)}
                    className={clsx(
                      "mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      studentsOpen ? "bg-ink-800 text-white" : "text-ink-200 hover:bg-ink-800 hover:text-white"
                    )}
                  >
                    <item.icon size={17} strokeWidth={2} />
                    <span className="flex-1">{item.label}</span>
                    {studentsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {studentsOpen ? (
                    <div className="mb-2 ml-7 border-l border-ink-700 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={clsx(
                            "mb-0.5 block rounded-lg px-3 py-2 text-sm transition-colors",
                            pathname.startsWith(child.href) ? "bg-brand-600 text-white" : "text-ink-300 hover:bg-ink-800 hover:text-white"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-brand-600 text-white" : "text-ink-200 hover:bg-ink-800 hover:text-white"
                )}
              >
                <item.icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Trademark */}
        <div className="border-t border-ink-800 px-5 py-4 text-xs text-ink-400 shrink-0">
          <p className="font-medium text-ink-300">
            Powered by <span className="text-amber-400 font-semibold">AS Code Elevate</span>
          </p>
          <p className="text-[11px] text-ink-400/80 mt-0.5">
            Made by AS Code Elevate &copy; {currentYear}
          </p>
        </div>
      </aside>
    </>
  );
}
