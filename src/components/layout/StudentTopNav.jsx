"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import { GraduationCap, LogOut } from "lucide-react";
import { studentNav } from "@/lib/navigation";

export default function StudentTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const student = JSON.parse(localStorage.getItem("studentData") || "{}");
        if (!student.schoolId) return;

        const cacheKey = `school-${student.schoolId}`;
        const cachedSchool = localStorage.getItem(cacheKey);
        if (cachedSchool) setSchool(JSON.parse(cachedSchool));

        const { data } = await axios.get(`/api/school/${student.schoolId}`, {
          timeout: 8000,
        });
        if (!data) throw new Error("School information was not found.");

        setSchool(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error("Unable to load school information for student navigation:", error);
      }
    };

    fetchSchool();
  }, []);

  const logOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("studentData");
    router.push("/");
  };

  const schoolDisplayName = school?.fullName || school?.name || "School Portal";

  return (
    <header className="sticky top-0 z-20 bg-ink-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-white">
          <div
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg",
              school?.logo ? "bg-white" : "bg-amber-400 text-ink-900"
            )}
          >
            {school?.logo ? (
              <Image
                src={school.logo}
                alt={`${schoolDisplayName} logo`}
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            ) : (
              <GraduationCap size={16} strokeWidth={2.25} />
            )}
          </div>
          <span className="hidden font-display text-sm font-semibold sm:inline">{schoolDisplayName}</span>
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
