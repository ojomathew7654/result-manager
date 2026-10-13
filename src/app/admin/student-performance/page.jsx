"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./student-performance.module.css";
import axios from "axios";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner/Spinner";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";

const StudentPerformance = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState({});
  const [levelAndVariant, setLevelAndVariant] = useState(null);
  const contentToPrint = useRef(null);

  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    content: () => contentToPrint.current,
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data || {});
        setSchoolClasses(data.classes.sort() || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  const getTermlyPerformance = async () => {
    if (!academicYear || !selectedClass || !termType) {
      alert("Please select academicYear, term and Class");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get("/api/student/performance", {
        params: {
          selectedClass,
          schoolId: session.schoolId,
          termType,
          academicYear,
        },
      });

      // Save level and variant
      const levelAndVariant = data.map(({ level, variant }) => ({
        level,
        variant,
      }));
      setLevelAndVariant(levelAndVariant[0]);

      // Remove level and variant from each student object
      const sanitizedStudents = data.map(({ level, variant, ...rest }) => rest);
      const sortedStudents = sanitizedStudents.sort(
        (a, b) => a.position - b.position,
      );
      setStudents(sortedStudents);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const getYeralyPerformance = async () => {
    if (!academicYear || !selectedClass) {
      alert("Please select academicYear and Class");
      return;
    }
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const [level, variant] = selectedClass.split("-");
      const { data } = await axios.get(
        `/api/student/performance/yearly/${encodedAcademicYear}-${session?.schoolId}-${level}-${variant}`,
      );
      setYearlyData(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
  };

  const handleTermChange = async (event) => {
    const termType = event.target.value;
    setTermType(termType);
  };
  const handleClassChange = async (e) => {
    const selectedClass = e.target.value;
    setSelectedClass(selectedClass);
  };

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");
  const subjectKeys = Array.from(
    new Set(
      students.flatMap((student) =>
        Object.keys(student).filter(
          (key) =>
            !["surname", "name", "totalScore", "average", "position"].includes(
              key,
            ),
        ),
      ),
    ),
  );
  const PaddedCell = ({ value }) => <>&nbsp;{value ?? "-"}&nbsp;</>;

  return (
    <div className={styles.container}>
      <h1>Student Performance</h1>
      <div className={styles.selectContainer}>
        <select value={termType} onChange={handleTermChange}>
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
          <option value="2025/2026">2025/2026</option>
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

      <h2 className={styles.sectionHeader}>
        {levelAndVariant?.level} {levelAndVariant?.variant} Broadsheet
      </h2>

      <div>
        <button disabled={loading} onClick={getTermlyPerformance}>
          {loading ? "Please wait..." : "Get Broadsheet"}
        </button>
      </div>

      {students?.length > 0 && (
        <>
          <div className={styles.tableWrapper} ref={contentToPrint}>
            <header className={styles.header}>
              <div className={styles.logo}>
                <div className={styles.imageContainer}>
                  <Image
                    src={school?.logo}
                    alt="logo"
                    height={110}
                    width={130}
                  />
                </div>
              </div>
              <div className={styles.headerContents}>
                <h4>{school?.fullName && school.fullName.toUpperCase()}</h4>
                {school.name == "CRYSTAL BRAINS SCHOOL" && (
                  <h5>BRISTISH AND MONTESSORI</h5>
                )}
                <span>
                  MOTTO: {school?.motto && school.motto.toUpperCase()}
                </span>
                <h4 className={styles.term}>
                  {`${levelAndVariant?.level?.toUpperCase()}${
                    levelAndVariant?.variant
                      ? " - " + levelAndVariant.variant.toUpperCase()
                      : ""
                  } Broadsheet – ${termType} Term, 2025/2026 Academic Session`}
                </h4>
              </div>
            </header>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={styles}>#</th>
                  <th style={styles}>Surname</th>
                  <th style={styles}>Name</th>
                  {subjectKeys.map((subject) => {
                    const trimmedSubject = subject.trim();
                    const normalized = trimmedSubject.toLowerCase();
                    const isMath =
                      normalized === "mathematics" || normalized === "math";
                    const displaySubject = isMath ? "MATH" : trimmedSubject;

                    const subjectLines = displaySubject.split(/\s+/);

                    return (
                      <th key={subject} style={styles} title={trimmedSubject}>
                        <div style={{ lineHeight: "1.2", textAlign: "center" }}>
                          {subjectLines.map((word, idx) => (
                            <React.Fragment key={idx}>
                              {word.toUpperCase()}
                              {idx !== subjectLines.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </div>
                      </th>
                    );
                  })}

                  <th style={styles}>Total</th>
                  <th style={styles}>Avg</th>
                  <th style={styles}>Position</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td style={styles}>
                      <PaddedCell value={index + 1} />
                    </td>
                    <td style={styles}>
                      <PaddedCell value={student.surname} />
                    </td>
                    <td style={styles}>{student.name}</td>

                    {subjectKeys.map((subject) => (
                      <td key={subject} style={styles}>
                        <PaddedCell value={student[subject]} />
                      </td>
                    ))}

                    <td style={styles}>
                      <PaddedCell value={student.totalScore} />
                    </td>
                    <td style={styles}>
                      <PaddedCell
                        value={`${Number(student.average).toFixed(2)}%`}
                      />
                    </td>
                    <td style={styles}>
                      <PaddedCell value={student.position} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.printButton}>
            <button onClick={handlePrint}>Print</button>
          </div>
        </>
      )}

      {/* Yearly Position Table */}
      <h2 className={styles.sectionHeader}>Academic year positions</h2>
      <div>
        <button disabled={loading} onClick={getYeralyPerformance}>
          {loading ? "Please wait..." : "Get Academic Postion"}
        </button>
      </div>
      <div className={styles.tableWrapper}>
        {yearlyData.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Level</th>
                <th>Surname</th>
                <th>Name</th>
                <th>First Term</th>
                <th>Second Term</th>
                <th>Third Term</th>
                <th>Total Score</th>
                <th>Average</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((student, index) => (
                <tr key={index}>
                  <td>
                    <PaddedCell value={index + 1} />
                  </td>

                  <td>
                    {" "}
                    <PaddedCell value={student.level?.toUpperCase()} />
                  </td>
                  <td>
                    {" "}
                    <PaddedCell value={student.surname} />
                  </td>
                  <td>
                    {" "}
                    <PaddedCell value={student.name} />
                  </td>
                  <td>
                    {" "}
                    <PaddedCell value={student.termlyScores.FIRST} />
                  </td>
                  <td>
                    {" "}
                    <PaddedCell value={student.termlyScores.SECOND} />
                  </td>
                  <td>
                    {" "}
                    <PaddedCell value={student.termlyScores.THIRD} />
                  </td>
                  <td>
                    {" "}
                    <PaddedCell value={student.termlyScores.TOTAL} />
                  </td>
                  <td>
                    <PaddedCell value={Number(student.average).toFixed(2)} />
                  </td>

                  <td>{student.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentPerformance;
