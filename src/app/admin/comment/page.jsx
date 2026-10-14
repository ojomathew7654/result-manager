"use client";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./remark.module.css";
import Spinner from "@/components/Spinner/Spinner";

const AllTeacherStudents = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [schoolClasses, setSchoolClasses] = useState([]);

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchoolClasses(data.classes.sort() || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

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

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

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
      <h1>{"Student's"} Remark</h1>
      <div>
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
            {schoolClasses?.map((classItem) => (
              <option key={classItem} value={classItem}>
                {classItem}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading && <h2>Please wait...</h2>}
      <div className={styles.tableContainer}>
        {students.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Surname</th>
                <th>Name</th>
                <th>Level</th>
                <th>Variant</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.surname}</td>
                  <td>{student.name}</td>
                  <td>{student.level}</td>
                  <td>{student.variant}</td>
                  <td>
                    <button>
                      <Link
                        className={styles.link}
                        href={`/admin/comment/${student.id}`}
                      >
                        Remark
                      </Link>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading &&
          academicYear &&
          selectedClass && <h1>No students found.</h1>
        )}
      </div>
    </div>
  );
};

export default AllTeacherStudents;
