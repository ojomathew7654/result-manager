"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./result.module.css";
import { useSession } from "next-auth/react";
import UkpSecondary from "@/components/report/upksecondary/page";
import UkpJss from "@/components/report/upkjsclass/page";
import SolidRock from "@/components/report/solidrock/page";
import JayRose from "@/components/report/jayrose/page";
import NewCambridge from "@/components/report/newcambridge/page";
import CrystalBrainsSchool from "@/components/report/CrystalBrainsSchool/page";
import SeedOfGlory from "@/components/report/seedofglory/page";
import Spinner from "@/components/Spinner/Spinner";
import BeidaBasic from "@/components/report/BeidaBasic/page";

const StudentResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchSchool();
  }, [session]);

  const fetchStudentData = async (
    selectedTerm,
    academicYear,
    selectedClass,
  ) => {
    if (!selectedTerm || !academicYear || !selectedClass) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/result/${encodedAcademicYear}-${session.schoolId}-${selectedTerm}-${selectedClass}`,
      );
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(selectedTerm, academicYear, selectedClass);
  };

  const handleTermChange = async (e) => {
    setSelectedTerm(e.target.value);
    await fetchStudentData(e.target.value, academicYear, selectedClass);
  };

  const handleClassChange = async (e) => {
    setSelectedClass(e.target.value);
    await fetchStudentData(selectedTerm, academicYear, e.target.value);
  };

  const generateStudentProps = (entry) => ({
    student: entry.student,
    attendanceList: entry.student.attendanceList.find(
      (a) => a.termType === selectedTerm,
    ),
    school,
    subjects: entry.subjects,
    subjectScores: entry.subjectScores,
    subjectPosition: entry.subjectPosition,
    totalStudents: entry.totalStudents,
    psychomotor:
      entry.student.traitRatings.filter((tr) => tr.type === "Psychomotor") ||
      [],
    effectiveTraits:
      entry.student.traitRatings.filter((tr) => tr.type === "Effective") || [],
    formTeacherRemark: entry.student.formTeacherRemark || "",
    headOfSchoolRemark: entry.student.headOfSchoolRemark || "",
    formTeacherName: entry.student.formTeacherName || "",
    selectedTerm,
  });

  return (
    <>
      <div className={styles.eachStudent}>
        <div className={styles.selectContainer}>
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
            {/* <option value="2024/2025">2024/2025</option> */}
            <option value="2026/2027">2026/2027</option>
          </select>

          <select value={selectedClass} onChange={handleClassChange}>
            <option value="" disabled>
              Select class
            </option>
            {school?.classes &&
              [...school.classes]
                .sort((a, b) => a.localeCompare(b))
                .map((classItem) => (
                  <option key={classItem} value={classItem}>
                    {classItem.toUpperCase()}
                  </option>
                ))}
          </select>
        </div>

        {loading ? (
          <h1 className="waitH1">
            <Spinner /> Getting result please wait...
          </h1>
        ) : (
          <>
            {school && (
              <>
                {/* {school.name === "THE UKP SCHOOLS" &&
                  students.map((entry, index) =>
                    entry.student?.level?.startsWith("s") ? (
                      <UkpSecondary
                        key={entry.student.id || index}
                        {...generateStudentProps(entry)}
                      />
                    ) : (
                      <UkpJss
                        key={entry.student.id || index}
                        {...generateStudentProps(entry)}
                      />
                    )
                  )} */}

                {school.name === "THE UKP SCHOOLS" &&
                  students.map((entry, index) => (
                    <UkpSecondary
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}

                {school.name === "SOLID ROCK ACADEMY" &&
                  students.map((entry, index) => (
                    <SolidRock
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}

                {school.name === "SEED OF GLORY" &&
                  students.map((entry, index) => (
                    <SeedOfGlory
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}

                {school.name === "New Cambridge" &&
                  students.map((entry, index) => (
                    <NewCambridge
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}

                {school.name === "CRYSTAL BRAINS SCHOOL" &&
                  students.map((entry, index) => (
                    <CrystalBrainsSchool
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}

                {school.name === "Jayrose fruitful aca.." &&
                  students.map((entry, index) => (
                    <JayRose
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}

                {school.name === "Beida Basic School" &&
                  students.map((entry, index) => (
                    <BeidaBasic
                      key={entry.student.id || index}
                      {...generateStudentProps(entry)}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default StudentResult;
