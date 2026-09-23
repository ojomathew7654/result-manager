"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Spinner from "@/components/Spinner/Spinner";

function formatHeader(header) {
  return header.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ReviewResult() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.schoolId) return;
    axios.get(`/api/school/${session.schoolId}`).then(({ data }) => setSchoolClasses((data.classes || []).sort()));
  }, [session?.schoolId]);

  useEffect(() => {
    if (!session?.schoolId || !selectedClass || !academicYear || !selectedTerm) return;
    setLoading(true);
    axios.get(`/api/result/review?selectedClass=${selectedClass}&schoolId=${session.schoolId}&academicYear=${academicYear}&selectedTerm=${selectedTerm}`)
      .then(({ data }) => setStudents(data))
      .catch((error) => console.error("Error fetching review data:", error))
      .finally(() => setLoading(false));
  }, [academicYear, selectedClass, selectedTerm, session?.schoolId]);

  if (status === "loading") return <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500"><Spinner /> Please wait...</div>;
  if (status !== "authenticated") redirect("/");

  return (
    <div>
      <PageHeader dark={false} title="Review results" subtitle="Inspect submitted student results before publishing." />
      <Card className="mb-5"><CardBody className="grid gap-4 sm:grid-cols-3">
        <Field label="Academic year" htmlFor="academicYear"><Select id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}><option value="">Select academic year</option><option value="2025/2026">2025/2026</option></Select></Field>
        <Field label="Class" htmlFor="class"><Select id="class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">Select class</option>{schoolClasses.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
        <Field label="Term" htmlFor="term"><Select id="term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}><option value="">Select term</option><option value="FIRST">First Term</option><option value="SECOND">Second Term</option><option value="THIRD">Third Term</option></Select></Field>
      </CardBody></Card>

      {loading ? <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-ink-500 shadow-card"><Spinner /> Loading results...</div> : students.map((student) => (
        <Card key={student.id} className="mb-5"><CardBody>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">{student.name} {student.surname}</h2>
          <div className="mb-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase text-ink-500"><tr>{["Gender", "Age", "Level", "Form teacher", "Teacher comment", "Head comment"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody><tr className="divide-x divide-ink-100"><td className="px-4 py-3">{student.gender}</td><td className="px-4 py-3">{student.age}</td><td className="px-4 py-3">{student.level}</td><td className="px-4 py-3">{student.formTeacherName}</td><td className="px-4 py-3">{student.formTeacherRemark}</td><td className="px-4 py-3">{student.headOfSchoolRemark}</td></tr></tbody></table></div>
          {student.terms.map((term) => { const keys = ["subjectName", ...Object.keys(term.subjects[0] || {}).filter((key) => !["id", "termId", "subjectName"].includes(key) && term.subjects.some((subject) => subject[key] !== null && subject[key] !== undefined))]; return <div key={term.id} className="mb-5"><h3 className="mb-2 font-medium text-ink-800">{term.termType} term</h3><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase text-ink-500"><tr><th className="px-4 py-3">No</th>{keys.map((key) => <th key={key} className="px-4 py-3">{key === "subjectName" ? "Subject" : formatHeader(key)}</th>)}<th className="px-4 py-3">Total</th></tr></thead><tbody className="divide-y divide-ink-100">{term.subjects.map((subject, index) => { const total = keys.filter((key) => typeof subject[key] === "number" || subject[key] === null).reduce((sum, key) => sum + (subject[key] || 0), 0); return <tr key={subject.id}><td className="px-4 py-3">{index + 1}</td>{keys.map((key) => <td key={key} className="px-4 py-3">{subject[key] ?? 0}</td>)}<td className="px-4 py-3 font-medium">{total || "-"}</td></tr>; })}</tbody></table></div></div>; })}
        </CardBody></Card>
      ))}
    </div>
  );
}
