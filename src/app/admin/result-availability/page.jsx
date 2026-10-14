"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./result-availability.module.css";
import Spinner from "@/components/Spinner/Spinner";

const ResultAvailability = () => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [schoolClasses, setSchoolClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selectedStudents, setSelectedStudents] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState("");

  const handleTermChange = (event) => {
    setSelectedTerm(event.target.value);
  };

  useEffect(() => {
    if (selectedTerm && academicYear && selectedClass) {
      fetchStudents(academicYear, selectedClass);
    }
  }, [selectedTerm, academicYear, selectedClass]);

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

  const fetchStudents = async (academicYear, selectedClass) => {
    if (!selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/class/FIRST-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`,
      );
      console.log(data);
      setStudents(data);

      const selected = {};
      data.forEach((student) => {
        // Check if the current student's resultAvailability matches the selected term
        const termAvailability = student.resultAvailability.find(
          (availability) =>
            availability.termType === selectedTerm &&
            availability.available === true,
        );

        // Set the availability in selectedStudents for each student
        selected[student.id] = termAvailability
          ? termAvailability.available
          : false;
      });
      setSelectedStudents(selected);
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

  const handleToggleStudentAvailability = (studentId) => {
    setSelectedStudents((prevSelected) => ({
      ...prevSelected,
      [studentId]: !prevSelected[studentId],
    }));
  };

  const handleBulkUpdate = async () => {
    if (!selectedTerm) {
      alert("Please select a term before updating.");
      return;
    }

    setLoading(true);

    try {
      const updates = Object.entries(selectedStudents).map(
        ([studentId, availability]) => ({
          studentId,
          termType: selectedTerm,
          isAvailable: availability,
        }),
      );
      await axios.put("/api/student/class/6", { updates });
      alert("Result availability updated successfully.");
    } catch (error) {
      console.error("Error updating result availability:", error);
      alert("Failed to update result availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        router.push("/");
      }
    }
  }, [sessionStatus, session, router]);

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") router.push("/");

  students?.sort((a, b) =>
    a.surname < b.surname ? -1 : a.surname > b.surname ? 1 : 0,
  );

  return (
    <div className={styles.container}>
      <h1>This is where you makes student results available.</h1>
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

        <select
          id="term-select"
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
      </div>

      <>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Surname</th>
                <th>Name</th>
                <th>Result Availability</th>
              </tr>
            </thead>
            {selectedTerm && (
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.surname}</td>
                    <td>{student.name}</td>
                    <td>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedStudents[student.id]}
                          onChange={() =>
                            handleToggleStudentAvailability(student.id)
                          }
                        />
                        {selectedStudents[student.id]
                          ? "Available"
                          : "Not Available"}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {students.length > 0 && (
          <div className={styles.buttonContainer}>
            <button
              onClick={handleBulkUpdate}
              className={loading && styles.disabled}
              disabled={loading}
            >
              {loading ? "please wait..." : " Update All Selected"}
            </button>
          </div>
        )}
      </>
    </div>
  );
};

export default ResultAvailability;
