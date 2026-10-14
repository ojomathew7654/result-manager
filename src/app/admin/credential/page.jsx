"use client";
import styles from "./credential.module.css";
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";

const StudentCredential = () => {
  const contentToPrint = useRef(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    content: () => contentToPrint.current,
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  const [students, setStudents] = useState({ div1: [], div2: [] });

  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();

  const [academicYear, setAcademicYear] = useState("");

  const fetchStudents = async (academicYear) => {
    if (!academicYear) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/student?schoolId=${session.schoolId}&academicYear=${academicYear}`,
      );

      // Sort students by level
      const sortedStudents = [...data].sort((a, b) =>
        a.level.localeCompare(b.level),
      );

      // Distribute students evenly across div1 and div2
      const div1 = [];
      const div2 = [];

      sortedStudents.forEach((student, index) => {
        if (index % 2 === 0) {
          div1.push(student);
        } else {
          div2.push(student);
        }
      });

      setStudents({ div1, div2 });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    setAcademicYear(event.target.value);
    await fetchStudents(event.target.value);
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);
  if (sessionStatus === "loading" || loading)
    return (
      <h1 className="waitH1">
        <Spinner />
        Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className={styles.Container}>
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
      </div>
      <div className={styles.printoutContainer}>
        <div className={styles.reportCard} ref={contentToPrint}>
          {students.div1.length > 0 && <h2>All Students login details </h2>}
          {!loading && (
            <div className={styles.wrapper}>
              <div className={styles.div1}>
                {students.div1.map((student, index) => (
                  <nav key={index}>
                    <span>
                      <h4>Portal link: </h4>
                      <p>result-manager.ascodeelevate.com</p>
                    </span>
                    <div>
                      <p>
                        <h4>Class</h4> <h5>{student.level}</h5>
                      </p>
                      <p>
                        <h4>Name</h4> <h5>{student.name}</h5>
                      </p>
                      <p>
                        <h4>Username</h4> <h5>{student.username}</h5>
                      </p>
                      <p>
                        <h4>Password</h4> <h5>{student.password}</h5>
                      </p>
                    </div>
                  </nav>
                ))}
              </div>
              <div className={styles.div2}>
                {students.div2.map((student, index) => (
                  <nav key={index}>
                    <span>
                      <h4>Portal link: </h4>
                      <p>result-manager.ascodeelevate.com</p>
                    </span>
                    <div>
                      <p>
                        <h4>Class</h4> <h5>{student.level}</h5>
                      </p>
                      <p>
                        <h4>Name</h4> <h5>{student.name}</h5>
                      </p>
                      <p>
                        <h4>Username</h4> <h5>{student.username}</h5>
                      </p>
                      <p>
                        <h4>Password</h4> <h5>{student.password}</h5>
                      </p>
                    </div>
                  </nav>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.printButton}>
        <button onClick={handlePrint}>Print</button>
      </div>
    </div>
  );
};

export default StudentCredential;
