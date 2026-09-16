"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

export default function ResultAvailability() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (session?.role && session.role !== "ADMIN") signOut({ redirect: false }).then(() => router.push("/")); }, [router, session]);
  useEffect(() => { if (session?.schoolId) axios.get(`/api/school/${session.schoolId}`).then(({ data }) => setSchoolClasses((data.classes || []).sort())); }, [session?.schoolId]);
  useEffect(() => {
    if (!session?.schoolId || !selectedTerm || !academicYear || !selectedClass) return;
    setLoading(true);
    const year = encodeURIComponent(academicYear);
    axios.get(`/api/student/class/FIRST-${session.schoolId}-${year}-${selectedClass}`).then(({ data }) => {
      setStudents(data);
      setSelectedStudents(Object.fromEntries(data.map((student) => [student.id, Boolean(student.resultAvailability?.some((item) => item.termType === selectedTerm && item.available))])));
    }).catch((error) => console.error("Failed to fetch students:", error)).finally(() => setLoading(false));
  }, [academicYear, selectedClass, selectedTerm, session?.schoolId]);

  async function handleBulkUpdate() {
    if (!selectedTerm) return alert("Please select a term before updating.");
    setLoading(true);
    try { await axios.put("/api/student/class/6", { updates: Object.entries(selectedStudents).map(([studentId, availability]) => ({ studentId, termType: selectedTerm, isAvailable: availability })) }); alert("Result availability updated successfully."); }
    catch (error) { console.error(error); alert("Failed to update result availability."); }
    finally { setLoading(false); }
  }

  if (status === "loading") return <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500"><Spinner /> Please wait...</div>;
  if (status !== "authenticated") router.push("/");

  return <div><PageHeader title="Result availability" subtitle="Choose which students can view published results." /><Card className="mb-5"><CardBody className="grid gap-4 sm:grid-cols-3"><Field label="Academic year" htmlFor="academicYear"><Select id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}><option value="">Select academic year</option><option value="2025/2026">2025/2026</option></Select></Field><Field label="Class" htmlFor="class"><Select id="class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">Select class</option>{schoolClasses.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field><Field label="Term" htmlFor="term"><Select id="term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}><option value="">Select term</option><option value="FIRST">First Term</option><option value="SECOND">Second Term</option><option value="THIRD">Third Term</option></Select></Field></CardBody></Card><Card><CardBody className="overflow-x-auto p-0"><table className="min-w-full text-left text-sm"><thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Surname</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Availability</th></tr></thead><tbody className="divide-y divide-ink-100">{loading ? <tr><td colSpan="4" className="px-5 py-10 text-center text-ink-400">Loading students...</td></tr> : students.map((student, index) => <tr key={student.id}><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3">{student.surname}</td><td className="px-4 py-3">{student.name}</td><td className="px-4 py-3"><label className="inline-flex items-center gap-2 text-sm text-ink-600"><input type="checkbox" checked={Boolean(selectedStudents[student.id])} onChange={() => setSelectedStudents((current) => ({ ...current, [student.id]: !current[student.id] }))} />{selectedStudents[student.id] ? "Available" : "Not available"}</label></td></tr>)}</tbody></table>{students.length > 0 ? <div className="p-5"><Button type="button" onClick={handleBulkUpdate} disabled={loading}>{loading ? "Updating..." : "Update selected"}</Button></div> : null}</CardBody></Card></div>;
}
