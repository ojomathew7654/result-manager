"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import styles from "../result.module.css";
import { useSession } from "next-auth/react";
import UkpSecondary from "@/components/report/upksecondary/page";
import UkpJss from "@/components/report/upkjsclass/page";
import SolidRock from "@/components/report/solidrock/page";
import JayRose from "@/components/report/jayrose/page";
import NewCambridge from "@/components/report/newcambridge/page";
import { useRouter } from "next/navigation";
import CrystalBrainsSchool from "@/components/report/CrystalBrainsSchool/page";
import Spinner from "@/components/Spinner/Spinner";

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
  const { data: session, status: sessionStatus } = useSession();
  function hasMoreThanOneS(str) {
    return str.split("s").length - 1 > 1;
  }
  const fetchStudentData = async (selectedTerm, academicYear) => {
    if (!selectedTerm || !studentId || !academicYear) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/school/${session.schoolId}`);
      setSchoolName(res.data.name);
      const encodedAcademicYear = encodeURIComponent(academicYear);

      const { data } = await axios.get(
        `/api/result/ukp/${encodedAcademicYear}-${studentId}-${selectedTerm}`,
      );
      setSubjectPosition(data.subjectPosition);
      const filteredAttendance = data.student.attendanceList.find(
        (attendance) => attendance.termType === selectedTerm,
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
          [],
      );
      setEffectiveTraits(
        data.student.traitRatings.filter((tr) => tr.type === "Effective") || [],
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

  const handleTermChange = async (event) => {
    const selectedTerm = event.target.value;
    setSelectedTerm(selectedTerm);
    await fetchStudentData(selectedTerm, academicYear);
  };

  return (
    <>
      <div className={styles.eachStudent}>
        <div className={styles.selectContainer}>
          <button className={styles.back} onClick={() => router.back()}>
            Go Back
          </button>
          <select
            id="termSelect"
            value={selectedTerm}
            onChange={handleTermChange}
          >
            <option value="" disabled>
              Select Term
            </option>
            <option value="FIRST">First Term</option>
            <option value="SECOND">Second Term</option>
            <option value="THIRD">Third Term</option>
          </select>

          <select
            id="academicYearSelect"
            value={academicYear}
            onChange={handleAcademicYearChange}
          >
            <option value="" disabled>
              Select academic year
            </option>
            <option value="2026/2027">2026/2027</option>
          </select>
        </div>

        {loading ? (
          <h1 className="waitH1">
            <Spinner />
            <Spinner /> Getting result please wait...
          </h1>
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
          </>
        )}
      </div>
    </>
  );
};

export default EachStudentResult;
