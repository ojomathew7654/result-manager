"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { GraduationCap, School, ShieldCheck, UserCheck, Users } from "lucide-react";
import GenderPieChart from "@/components/GenderChart";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const initialCount = {
  primaryStudents: 0,
  secondaryStudents: 0,
  totalStudents: 0,
  totalUsers: 0,
  totalAdmins: 0,
  totalMaleStudents: 0,
  totalFemaleStudents: 0,
  totalMaleUsers: 0,
  totalFemaleUsers: 0,
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || session?.role !== "ADMIN") return;

    let active = true;
    const cacheKey = `admin-count-${session.schoolId}`;
    const cachedCount = localStorage.getItem(cacheKey);

    if (cachedCount) {
      setCount(JSON.parse(cachedCount));
      setLoading(false);
    }

    axios
      .get(`/api/student/count/${session.schoolId}`, { timeout: 30000 })
      .then(({ data }) => {
        if (!active) return;
        setCount(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        console.error("Failed to fetch dashboard data:", requestError);
        setError(cachedCount ? "Showing saved figures. Live refresh failed." : "Unable to load dashboard figures.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, status]);

  const stats = [
    { label: "Primary students", value: count.primaryStudents, icon: GraduationCap, tone: "brand", href: "/admin/primary" },
    { label: "Secondary students", value: count.secondaryStudents, icon: School, tone: "amber", href: "/admin/secondary" },
    { label: "Total students", value: count.totalStudents, icon: Users, tone: "emerald", href: "/admin/primary" },
    { label: "Teachers", value: count.totalUsers, icon: UserCheck, tone: "ink", href: "/admin/teachers" },
    { label: "Admins", value: count.totalAdmins, icon: ShieldCheck, tone: "rose", href: "/admin/users" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A snapshot of your school this term." />

      {error ? <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <a key={stat.label} href={stat.href} className="block transition-transform hover:-translate-y-0.5">
            <StatCard {...stat} value={loading ? "..." : stat.value} />
          </a>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Students" subtitle="Split by gender, all classes" />
          <CardBody>
            <GenderPieChart maleCount={count.totalMaleStudents} femaleCount={count.totalFemaleStudents} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Staff" subtitle="Teachers and admins" />
          <CardBody>
            <GenderPieChart maleCount={count.totalMaleUsers} femaleCount={count.totalFemaleUsers} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
