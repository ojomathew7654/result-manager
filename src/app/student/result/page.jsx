"use client";
import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";

import SolidRock from "@/components/report/solidrock/page";
import UkpSecondary from "@/components/report/upksecondary/page";
import JayRose from "@/components/report/jayrose/page";
import NewCambridge from "@/components/report/newcambridge/page";
import UkpJss from "@/components/report/upkjsclass/page";
import CrystalBrainsSchool from "@/components/report/CrystalBrainsSchool/page";
import SeedOfGlory from "@/components/report/seedofglory/page";
import Spinner from "@/components/Spinner/Spinner";
import BeidaBasic from "@/components/report/BeidaBasic/page";
import { ArrowLeft, CalendarDays, GraduationCap, Lock } from "lucide-react";

const EachStudentResult = () => {
  const [student, setStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [subjectScores, setSubjectScores] = useState({});
  const [subjectPosition, setSubjectPosition] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [totalStudents, setTotalStudents] = useState("");
  const [formTeacherName, setFormTeacherName] = useState("");
  const [psychomotor, setPsychomotor] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [effectiveTraits, setEffectiveTraits] = useState([]);
  const [formTeacherRemark, setFormTeacherRemark] = useState("");
  const [headOfSchoolRemark, setHeadOfSchoolRemark] = useState("");
  const router = useRouter();

  const fetchStudentData = async (selectedTerm, academicYear) => {
    const storedData = JSON.parse(localStorage.getItem("studentData")) || [];
    const studentId = storedData.id;
    if (!studentId) {
      redirect("/");
    }
    if (!selectedTerm || !studentId || !academicYear) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/school/${storedData.schoolId}`);

      setSchoolName(res.data.name);
      const encodedAcademicYear = encodeURIComponent(academicYear);

      const { data } = await axios.get(
        `/api/result/ukp/${encodedAcademicYear}-${studentId}-${selectedTerm}`
      );
      setSubjectPosition(data.subjectPosition);
      const filteredAttendance = data.student.attendanceList.find(
        (attendance) => attendance.termType === selectedTerm
      );
      setAttendanceList(filteredAttendance);
      setSchool(data.student.school);

      setSubjectScores(data.subjectScores);
      setStudent(data.student);
      setSubjects(data.subjects);
      setAttendance(data.attendance);
      setTotalStudents(data.totalStudents);
      setFormTeacherRemark(data.student.formTeacherRemark || "");
      setHeadOfSchoolRemark(data.student.headOfSchoolRemark || "");
      setFormTeacherName(data.student.formTeacherName || "");
      setPsychomotor(
        data.student.traitRatings.filter((tr) => tr.type === "Psychomotor") ||
          []
      );
      setEffectiveTraits(
        data.student.traitRatings.filter((tr) => tr.type === "Effective") || []
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(selectedTerm, academicYear);
  };
  const logOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("studentData");
    router.push("/");
  };
  const handleTermChange = async (event) => {
    const selectedTerm = event.target.value;
    setSelectedTerm(selectedTerm);
    await fetchStudentData(selectedTerm, academicYear);
  };

  const isResultAvailable = student.resultAvailability?.some(
    (result) => result.termType === selectedTerm && result.available
  );
  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button type="button" onClick={() => router.back()} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-brand-700">
              <ArrowLeft size={16} /> Go back
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <GraduationCap size={20} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink-900">My result</h1>
                <p className="text-sm text-ink-400">Your official result, straight from your school.</p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card sm:w-auto sm:flex-row sm:items-end">
            <label className="flex min-w-36 flex-col gap-1.5 text-sm font-medium text-ink-700" htmlFor="termSelect">
              <span className="flex items-center gap-2"><CalendarDays size={15} className="text-brand-600" /> Term</span>
              <select id="termSelect" value={selectedTerm} onChange={handleTermChange} className="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option value="" disabled>
              Select Term
            </option>
            <option value="FIRST">First Term</option>
            <option value="SECOND">Second Term</option>
            <option value="THIRD">Third Term</option>
              </select>
            </label>
            <label className="flex min-w-40 flex-col gap-1.5 text-sm font-medium text-ink-700" htmlFor="academicYearSelect">
              <span>Academic year</span>
              <select id="academicYearSelect" value={academicYear} onChange={handleAcademicYearChange} className="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option value="" disabled>
              Select academic year
            </option>
            <option value="2025/2026">2025/2026</option>
              </select>
            </label>
          </div>
        </header>

        {loading ? (
          <h2 className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-lg font-medium text-ink-600 shadow-card">
            <Spinner /> Getting result please wait...
          </h2>
        ) : !selectedTerm || !academicYear ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-ink-100 bg-white px-6 text-center text-lg font-medium text-ink-600 shadow-card">Please select both term and academic year.</div>
        ) : !isResultAvailable ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white px-6 text-center shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Lock size={20} /></div>
            <h2 className="font-medium text-ink-900">Your result has not been released yet.</h2>
            <p className="text-sm text-ink-400">Check back after your school publishes this term&apos;s result.</p>
          </div>
        ) : (
          <>
            {schoolName && (
              <>
                {schoolName === "THE UKP SCHOOLS" &&
                  (student?.level?.startsWith("s") ? (
                    <UkpSecondary
                      student={student}
                      attendanceList={attendanceList}
                      school={school}
                      subjects={subjects}
                      subjectScores={subjectScores}
                      subjectPosition={subjectPosition}
                      attendance={attendance}
                      totalStudents={totalStudents}
                      psychomotor={psychomotor}
                      effectiveTraits={effectiveTraits}
                      formTeacherRemark={formTeacherRemark}
                      headOfSchoolRemark={headOfSchoolRemark}
                      formTeacherName={formTeacherName}
                      selectedTerm={selectedTerm}
                    />
                  ) : (
                    <UkpJss
                      student={student}
                      attendanceList={attendanceList}
                      school={school}
                      subjects={subjects}
                      subjectScores={subjectScores}
                      subjectPosition={subjectPosition}
                      attendance={attendance}
                      totalStudents={totalStudents}
                      psychomotor={psychomotor}
                      effectiveTraits={effectiveTraits}
                      formTeacherRemark={formTeacherRemark}
                      headOfSchoolRemark={headOfSchoolRemark}
                      formTeacherName={formTeacherName}
                      selectedTerm={selectedTerm}
                    />
                  ))}

                {schoolName === "SOLID ROCK ACADEMY" && (
                  <SolidRock
                    student={student}
                    attendanceList={attendanceList}
                    school={school}
                    subjects={subjects}
                    subjectScores={subjectScores}
                    subjectPosition={subjectPosition}
                    totalStudents={totalStudents}
                    psychomotor={psychomotor}
                    effectiveTraits={effectiveTraits}
                    formTeacherRemark={formTeacherRemark}
                    headOfSchoolRemark={headOfSchoolRemark}
                    formTeacherName={formTeacherName}
                    selectedTerm={selectedTerm}
                  />
                )}

                {schoolName === "CRYSTAL BRAINS SCHOOL" && (
                  <CrystalBrainsSchool
                    student={student}
                    attendanceList={attendanceList}
                    school={school}
                    subjects={subjects}
                    subjectScores={subjectScores}
                    subjectPosition={subjectPosition}
                    totalStudents={totalStudents}
                    psychomotor={psychomotor}
                    effectiveTraits={effectiveTraits}
                    formTeacherRemark={formTeacherRemark}
                    headOfSchoolRemark={headOfSchoolRemark}
                    formTeacherName={formTeacherName}
                    selectedTerm={selectedTerm}
                  />
                )}

                {schoolName === "New Cambridge" && (
                  <NewCambridge
                    student={student}
                    attendanceList={attendanceList}
                    school={school}
                    subjects={subjects}
                    subjectScores={subjectScores}
                    subjectPosition={subjectPosition}
                    totalStudents={totalStudents}
                    psychomotor={psychomotor}
                    effectiveTraits={effectiveTraits}
                    formTeacherRemark={formTeacherRemark}
                    headOfSchoolRemark={headOfSchoolRemark}
                    formTeacherName={formTeacherName}
                    selectedTerm={selectedTerm}
                  />
                )}

                {schoolName === "Jayrose fruitful aca.." && (
                  <JayRose
                    student={student}
                    attendanceList={attendanceList}
                    school={school}
                    subjects={subjects}
                    subjectScores={subjectScores}
                    psychomotor={psychomotor}
                    effectiveTraits={effectiveTraits}
                    formTeacherRemark={formTeacherRemark}
                    headOfSchoolRemark={headOfSchoolRemark}
                    formTeacherName={formTeacherName}
                    selectedTerm={selectedTerm}
                  />
                )}
                {schoolName === "SEED OF GLORY" && (
                  <SeedOfGlory
                    student={student}
                    attendanceList={attendanceList}
                    school={school}
                    subjects={subjects}
                    subjectScores={subjectScores}
                    subjectPosition={subjectPosition}
                    attendance={attendance}
                    totalStudents={totalStudents}
                    psychomotor={psychomotor}
                    effectiveTraits={effectiveTraits}
                    formTeacherRemark={formTeacherRemark}
                    headOfSchoolRemark={headOfSchoolRemark}
                    formTeacherName={formTeacherName}
                    selectedTerm={selectedTerm}
                  />
                )}
                {schoolName === "Beida Basic School" && (
                  <BeidaBasic
                    student={student}
                    attendanceList={attendanceList}
                    school={school}
                    subjects={subjects}
                    subjectScores={subjectScores}
                    psychomotor={psychomotor}
                    effectiveTraits={effectiveTraits}
                    formTeacherRemark={formTeacherRemark}
                    headOfSchoolRemark={headOfSchoolRemark}
                    formTeacherName={formTeacherName}
                    selectedTerm={selectedTerm}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default EachStudentResult;
