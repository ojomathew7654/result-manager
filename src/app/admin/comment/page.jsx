"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Spinner from "@/components/Spinner/Spinner";

export default function StudentRemarks() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (session?.schoolId) axios.get(`/api/school/${session.schoolId}`).then(({ data }) => setSchoolClasses((data.classes || []).sort())); }, [session?.schoolId]);
  useEffect(() => {
    if (!session?.schoolId || !academicYear || !selectedClass) return;
    setLoading(true);
    axios.get(`/api/student/class/FIRST-${session.schoolId}-${encodeURIComponent(academicYear)}-${selectedClass}`).then(({ data }) => setStudents([...data].sort((a, b) => (a.surname || "").localeCompare(b.surname || "")))).catch((error) => console.error(error)).finally(() => setLoading(false));
  }, [academicYear, selectedClass, session?.schoolId]);

  if (status === "loading") return <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500"><Spinner /> Please wait...</div>;
  if (status !== "authenticated") redirect("/");

  return <div><PageHeader title="Student remarks" subtitle="Select a class to add teacher and head-of-school remarks." /><Card className="mb-5"><CardBody className="grid gap-4 sm:grid-cols-2"><Field label="Academic year" htmlFor="academicYear"><Select id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}><option value="">Select academic year</option><option value="2025/2026">2025/2026</option></Select></Field><Field label="Class" htmlFor="class"><Select id="class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">Select class</option>{schoolClasses.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field></CardBody></Card><Card><CardBody className="overflow-x-auto p-0"><table className="min-w-full text-left text-sm"><thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500"><tr>{["No", "Surname", "Name", "Level", "Variant", "Action"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-ink-100">{loading ? <tr><td colSpan="6" className="px-5 py-10 text-center text-ink-400">Loading students...</td></tr> : students.map((student, index) => <tr key={student.id}><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3">{student.surname}</td><td className="px-4 py-3">{student.name}</td><td className="px-4 py-3">{student.level}</td><td className="px-4 py-3">{student.variant || "—"}</td><td className="px-4 py-3"><Link href={`/admin/comment/${student.id}`} className="font-medium text-brand-700 hover:text-brand-900">Add remark</Link></td></tr>)}</tbody></table>{!loading && !students.length && academicYear && selectedClass ? <p className="p-6 text-center text-ink-400">No students found.</p> : null}</CardBody></Card></div>;
}
