"use client";
import { useState, useEffect } from "react";
import styles from "./secondary.module.css";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Spinner from "@/components/Spinner/Spinner";

const Credential = () => {
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [termType, setTermType] = useState("FIRST");
  const { data: session, status: sessionStatus } = useSession();
  const [academicYear, setAcademicYear] = useState("");
  const [schoolId, setSchoolId] = useState(6);

  const fetchStudents = async (academicYear, selectedClass) => {
    if (!academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/credential/${termType}-${schoolId}-${encodedAcademicYear}-${"ss1"}`,
      );
      // Transform each student data to the desired format
      const transformedData = data.map((student) => ({
        level: student.level.toLowerCase(), // Converting level to lowercase
        username: student.username,
        password: student.password,
        name: student.name,
        surname: student.surname,
      }));
      console.log(transformedData);
      setStudents(transformedData);
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
        const { data } = await axios.get(`/api/school/${schoolId}`);
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
    if (schoolId) {
      fetchSchoolClasses();
    }
  }, [schoolId]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "SUPER_ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  if (sessionStatus == "loading")
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
              <th>Surname</th>
              <th>Name</th>
              <th>Username</th>
              <th>Password</th>
              <th>Level</th>
            </tr>
          </thead>
          {loading ? (
            <td>Loading...</td>
          ) : (
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>

                  <td>{student.surname}</td>
                  <td>{student.name}</td>
                  <td>{student.username}</td>
                  <td>{student.password}</td>
                  <td>{student.level}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default Credential;

//  {
//     "id": "59d3",
//     "level": "ss1",
//     "password": "FERDINARD1",
//     "name": "FERDINARD",
//     "username": "FERDINARD",
//     "surname": "NNAJI"
//   },
