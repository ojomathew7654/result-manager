"use client";
import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";

import SolidRock from "@/components/report/solidrock/page";
import UkpSecondary from "@/components/report/upksecondary/page";
import styles from "./StudentReult.module.css";
import JayRose from "@/components/report/jayrose/page";
import NewCambridge from "@/components/report/newcambridge/page";
import UkpJss from "@/components/report/upkjsclass/page";
import CrystalBrainsSchool from "@/components/report/CrystalBrainsSchool/page";
import SeedOfGlory from "@/components/report/seedofglory/page";
import Spinner from "@/components/Spinner/Spinner";
import BeidaBasic from "@/components/report/BeidaBasic/page";

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
    (result) => result.termType === selectedTerm && result.available,
  );
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
            <Spinner /> Getting result please wait...
          </h1>
        ) : !selectedTerm || !academicYear ? (
          <h2 className="waitH1">Please select both term and academic year.</h2>
        ) : !isResultAvailable ? (
          <h2 className="waitH1">
            Oop!!! Your result has not been released by your school.
          </h2>
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
    </>
  );
};

export default EachStudentResult;
