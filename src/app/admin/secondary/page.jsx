"use client";
import { useState, useEffect } from "react";
import styles from "./secondary.module.css";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [termType, setTermType] = useState("FIRST");
  const { data: session, status: sessionStatus } = useSession();
  const [academicYear, setAcademicYear] = useState("");

  const fetchStudents = async (academicYear, selectedClass) => {
    if (!selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/class/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`,
      );
      setStudents(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    setAcademicYear(event.target.value);
    if (selectedClass) {
      await fetchStudents(event.target.value, selectedClass);
    }
  };

  const handleClassChange = async (event) => {
    const newSelectedClass = event.target.value;
    setSelectedClass(newSelectedClass);
    await fetchStudents(academicYear, newSelectedClass);
  };

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        const secondarySchool = [];
        data.classes.forEach((c) => {
          if (c.length > 1 && c[1].toLowerCase() === "s") {
            secondarySchool.push(c);
          }
        });
        const sortedClasses = secondarySchool ? secondarySchool.sort() : [];
        setSchoolClasses(sortedClasses);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };
    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);
  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("are you sure to delete student?")) return;
    const { data } = await axios.delete(`/api/student/${studentId}`);
    alert(data.message);
    setStudents(students.filter((student) => student.id !== studentId));
  };

  students?.sort((a, b) => {
    if (a.surname.toLowerCase() < b.surname.toLowerCase()) {
      return -1;
    }
    if (a.surname.toLowerCase() > b.surname.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  return (
    <div className={styles.allUser}>
      <h1>Secondary School Students.</h1>

      <div className={styles.selectContainer}>
        <select
          id="academicYearSelect"
          value={academicYear}
          onChange={handleAcademicYearChange}
        >
          <option value="" disabled>
            Select academy year
          </option>
          <option value="2026/2027">2026/2027</option>
        </select>
        <select
          id="class-select"
          value={selectedClass}
          onChange={handleClassChange}
        >
          <option value="" disabled>
            Select Class
          </option>
          {schoolClasses.map((className) => (
            <option key={className} value={className}>
              {className.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        {" "}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No</th>
              <th>Image</th>
              <th>Surname</th>
              <th>Name</th>
              <th>Level</th>
              <th>Variant</th>
              <th>Action</th>
            </tr>
          </thead>
          {loading ? (
            <h3>Loading...</h3>
          ) : (
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td className={styles.user}>
                    <img
                      src={student.image || "/img/noAvatar.png"}
                      alt="img"
                      width={45}
                      height={45}
                      className={styles.studentImg}
                    />
                  </td>
                  <td>{student.surname}</td>
                  <td>{student.name}</td>
                  <td>{student.level}</td>
                  <td>{student.variant}</td>
                  <td>
                    <button>
                      <Link
                        className={styles.link}
                        href={`/admin/secondary/${student.id}`}
                      >
                        Edit
                      </Link>
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default AllStudents;
