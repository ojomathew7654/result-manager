"use client";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import styles from "./result.module.css";
import Spinner from "@/components/Spinner/Spinner";

const AllTeacherStudents = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");

  const fetchStudentData = async (selectedClass, academicYear) => {
    if (!selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/class/${"FIRST"}-${
          session.schoolId
        }-${encodedAcademicYear}-${selectedClass}`,
      );
      console.log(data);
      setStudents(data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(selectedClass, academicYear);
  };

  const handleClassChange = async (e) => {
    const selectedClass = e.target.value;
    setSelectedClass(selectedClass);
    await fetchStudentData(selectedClass, academicYear);
  };

  if (sessionStatus == "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");
  console.log(students);
  students?.sort((a, b) => {
    const surnameA = a.surname.toLowerCase().trim(); // Remove extra spaces
    const surnameB = b.surname.toLowerCase().trim(); // Remove extra spaces

    if (surnameA < surnameB) {
      return -1;
    }
    if (surnameA > surnameB) {
      return 1;
    }
    return 0;
  });
  return (
    <div className={styles.result}>
      <div className={styles.selectContainer}>
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
        <select value={selectedClass} onChange={handleClassChange}>
          <option value="">Select class</option>
          {session.teacherOf?.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.tableContainer}>
        {students.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Surname</th>
                <th>Name</th>
                <th>Username</th>
                <th>Level</th>
                <th>Variant</th>
                <th>Action</th>
              </tr>
            </thead>
            {loading ? (
              <h3>Loading...</h3>
            ) : (
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.surname}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>{student.level}</td>
                    <td>{student.variant}</td>
                    <td className={styles.linktd}>
                      <button>
                        <Link
                          className={styles.link}
                          href={`/print/${student.id}`}
                        >
                          Print Result
                        </Link>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}

        {students.length === 0 && !loading ? (
          <h1>No students found.</h1>
        ) : loading == true ? (
          <h1>Getting student...</h1>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default AllTeacherStudents;
