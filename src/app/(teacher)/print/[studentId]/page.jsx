"use client";

import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UkpSecondary from "@/components/report/upksecondary/page";
import UkpJss from "@/components/report/upkjsclass/page";
import SolidRock from "@/components/report/solidrock/page";
import JayRose from "@/components/report/jayrose/page";
import NewCambridge from "@/components/report/newcambridge/page";
import CrystalBrainsSchool from "@/components/report/CrystalBrainsSchool/page";
import Spinner from "@/components/Spinner/Spinner";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { ArrowLeft, Printer } from "lucide-react";

const EachStudentResult = ({ params }) => {
  const { studentId } = params;
  const router = useRouter();
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
  const { data: session } = useSession();

  const fetchStudentData = async (term, yr) => {
    if (!term || !studentId || !yr || !session?.schoolId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/school/${session.schoolId}`);
      setSchoolName(res.data.name);
      const encodedAcademicYear = encodeURIComponent(yr);

      const { data } = await axios.get(
        `/api/result/ukp/${encodedAcademicYear}-${studentId}-${term}`
      );
      setSubjectPosition(data.subjectPosition || {});
      const filteredAttendance = (data.student?.attendanceList || []).find(
        (att) => att.termType === term
      );
      setAttendanceList(filteredAttendance || {});
      setSchool(data.student?.school || {});
      setSubjectScores(data.subjectScores || {});
      setStudent(data.student || {});
      setSubjects(data.subjects || []);
      setAttendance(data.attendance || []);
      setTotalStudents(data.totalStudents || "");
      setFormTeacherRemark(data.student?.formTeacherRemark || "");
      setHeadOfSchoolRemark(data.student?.headOfSchoolRemark || "");
      setFormTeacherName(data.student?.formTeacherName || "");
      setPsychomotor(
        (data.student?.traitRatings || []).filter((tr) => tr.type === "Psychomotor")
      );
      setEffectiveTraits(
        (data.student?.traitRatings || []).filter((tr) => tr.type === "Effective")
      );
    } catch (err) {
      console.error("Error fetching result for print:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const yr = event.target.value;
    setAcademicYear(yr);
    await fetchStudentData(selectedTerm, yr);
  };

  const handleTermChange = async (event) => {
    const term = event.target.value;
    setSelectedTerm(term);
    await fetchStudentData(term, academicYear);
  };

  return (
    <div className="space-y-6">
      {/* Print Controls Header Bar */}
      <Card className="print:hidden">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" icon={ArrowLeft} onClick={() => router.back()}>
              Go Back
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => window.print()}
              disabled={loading || !schoolName}
            >
              Print Result
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              id="termSelect"
              value={selectedTerm}
              onChange={handleTermChange}
              className="w-40 text-xs"
            >
              <option value="" disabled>
                Select Term
              </option>
              <option value="FIRST">First Term</option>
              <option value="SECOND">Second Term</option>
              <option value="THIRD">Third Term</option>
            </Select>

            <Select
              id="academicYearSelect"
              value={academicYear}
              onChange={handleAcademicYearChange}
              className="w-44 text-xs"
            >
              <option value="" disabled>
                Select academic year
              </option>
              <option value="2025/2026">2025/2026</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white print:hidden">
          <Spinner />
          <p className="text-sm font-medium text-ink-300">Getting student report card result...</p>
        </div>
      ) : (
        /* Report Template Container */
        <div>
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
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EachStudentResult;
