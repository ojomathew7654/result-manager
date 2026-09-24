"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";
import {
  FileSpreadsheet,
  CalendarCheck,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Eye,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { href: "/check-result", label: "Result Entry", icon: FileSpreadsheet },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/comment", label: "Comments", icon: MessageSquare },
  { href: "/task", label: "Tasks", icon: BookOpen },
  { href: "/student-performance", label: "Performance", icon: TrendingUp },
  { href: "/review", label: "Review Result", icon: Eye },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [school, setSchool] = useState({});
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!session?.schoolId) return;
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data || {});
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };
    fetchSchoolData();
  }, [session]);

  const logOut = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    await signOut({ callbackUrl: "/" });
  };

  const hideNavbar = pathname.includes("/print/");
  if (hideNavbar) return null;

  const schoolDisplayName = school.name || school.fullName || "School Portal";
  const currentYear = new Date().getFullYear();

  return (
    <header className="sticky top-0 z-40 w-full bg-ink-900 border-b border-ink-800 text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: School Logo & Title */}
        <div className="flex items-center gap-3">
          {school?.logo ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-ink-700 bg-ink-800 shrink-0">
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
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-tight text-white truncate uppercase max-w-[180px] sm:max-w-xs">
              {schoolDisplayName}
            </p>
            <p className="text-xs text-ink-300">Teacher Portal</p>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-600 text-white shadow-soft font-semibold"
                    : "text-ink-200 hover:bg-ink-800 hover:text-white"
                )}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-800/80 px-3 py-1.5 text-xs text-white hover:bg-ink-800 transition-colors"
            >
              {session?.imageUrl ? (
                <div className="relative h-6 w-6 overflow-hidden rounded-full border border-ink-600">
                  <Image
                    src={session.imageUrl}
                    alt={session.name || "Teacher"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white uppercase">
                  {session?.name ? session.name.charAt(0) : "T"}
                </div>
              )}
              <span className="font-medium max-w-[120px] truncate uppercase">
                {session?.name || "Teacher"}
              </span>
              <ChevronDown size={14} className="text-ink-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-ink-700 bg-ink-900 p-2 shadow-card z-50">
                <div className="px-3 py-2 border-b border-ink-800">
                  <p className="text-xs font-semibold text-white uppercase truncate">
                    {session?.name}
                  </p>
                  <p className="text-[10px] text-ink-400">Teacher Account</p>
                </div>
                <button
                  onClick={logOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-ink-200 hover:bg-ink-800 hover:text-white"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-800 bg-ink-900 px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-ink-800 px-1">
            <div className="flex items-center gap-2.5">
              {session?.imageUrl ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-ink-600">
                  <Image
                    src={session.imageUrl}
                    alt={session.name || "Teacher"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white uppercase">
                  {session?.name ? session.name.charAt(0) : "T"}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white uppercase truncate">
                  {session?.name}
                </p>
                <p className="text-[10px] text-amber-400 font-medium">Teacher</p>
              </div>
            </div>
            <button
              onClick={logOut}
              className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-lg"
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-600 text-white font-semibold"
                      : "text-ink-200 hover:bg-ink-800 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-ink-800 text-[11px] text-ink-400 text-center">
            Made by AS Code Elevate &copy; {currentYear}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
