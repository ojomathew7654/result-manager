"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner/Spinner";
import styles from "./moveStudents.module.css";

const MoveStudents = () => {
  const { data: session } = useSession();
  const [levels, setLevels] = useState([]);
  const [variants, setVariants] = useState([]);

  const [academicYear, setAcademicYear] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [variant, setVariant] = useState("");

  const [nextAcademicYear, setNextAcademicYear] = useState("");
  const [nextLevel, setNextLevel] = useState("");
  const [nextVariant, setNextVariant] = useState("");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState("");

  // === FETCH SCHOOL LEVELS & VARIANTS ===
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);

        const extractedLevels = [
          ...new Set(data.classes.map((cls) => cls.split("-")[0])),
        ];

        const extractedVariants = [
          ...new Set(
            data.classes
              .map((cls) => cls.split("-")[1] || "")
              .filter((variant) => variant),
          ),
        ];

        setLevels(extractedLevels);
        setVariants(extractedVariants);
      } catch (err) {
        console.error("Error fetching school:", err);
        setMessage("Failed to load school data.");
      }
    };

    if (session?.schoolId) fetchSchool();
  }, [session]);

  // === FETCH STUDENTS ===
  const fetchStudents = async () => {
    if (!academicYear || !selectedLevel) {
      setMessage("Please select level and academic year first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const variantParam = variant || "";

      const { data } = await axios.get(
        `/api/move_students/${session.schoolId}-${selectedLevel}-${variantParam}-${encodedAcademicYear}`,
      );

      setStudents(data);
      setMessage(
        data.length > 0
          ? `${data.length} students found for ${selectedLevel} ${
              variant || ""
            }`
          : "No students found for the selected level and variant.",
      );
    } catch (err) {
      console.error("Fetch students error:", err);
      setMessage("Error fetching students.");
    } finally {
      setLoading(false);
    }
  };

  // === PROMOTE STUDENTS ===
  const promoteStudents = async () => {
    if (!nextLevel || !nextAcademicYear) {
      setMessage("Please select next level and academic year.");
      return;
    }

    if (students.length === 0) {
      setMessage("No students to promote.");
      return;
    }

    // Prevent same level/year promotion
    if (academicYear === nextAcademicYear && selectedLevel === nextLevel) {
      setMessage(
        "Next level and academic year must be different from the current ones.",
      );
      return;
    }

    setPromoting(true);
    setMessage("");

    try {
      const body = {
        schoolId: session.schoolId,

        // Current student information
        level: selectedLevel,
        variant: variant,
        academicYear: academicYear,

        // Destination information
        nextLevel: nextLevel,
        nextVariant: nextVariant, // ✅ Add this
        nextAcademicYear: nextAcademicYear,
      };

      const res = await axios.put("/api/move_students", body);
      setMessage(res.data.message || "Students promoted successfully.");
      setStudents([]);
    } catch (err) {
      console.error("Promote students error:", err);
      setMessage(
        err.response?.data?.error || "Error occurred while promoting students.",
      );
    } finally {
      setPromoting(false);
    }
  };

  // === RENDER ===
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Move Students to Next Level</h1>

      {/* === FETCH STUDENTS SECTION === */}
      <div className={styles.filters}>
        <select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
        >
          <option value="">Select Academic Year</option>
          <option value="2025/2026">2025/2026</option>
          <option value="2026/2027">2026/2027</option>
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">Select Level</option>
          {levels.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl.toUpperCase()}
            </option>
          ))}
        </select>

        <select value={variant} onChange={(e) => setVariant(e.target.value)}>
          <option value="">Select Variant (optional)</option>
          {variants.map((v) => (
            <option key={v} value={v}>
              {v.toUpperCase()}
            </option>
          ))}
        </select>

        <button onClick={fetchStudents} disabled={loading || promoting}>
          {loading ? "Loading..." : "Get Students"}
        </button>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      {/* === STUDENT LIST === */}
      {loading ? (
        <div className={styles.loading}>
          <Spinner /> Fetching students...
        </div>
      ) : (
        students.length > 0 && (
          <div className={styles.list}>
            <h3>Students Found ({students.length})</h3>
            <ul>
              {students.map((s) => (
                <li key={s.id}>
                  {s.name} {s.surname} ({s.level})
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      {/* === PROMOTION SECTION === */}
      {students.length > 0 && (
        <div className={styles.promoteSection}>
          <h3>Promote Students</h3>

          <div className={styles.nextSelectors}>
            <select
              value={nextAcademicYear}
              onChange={(e) => setNextAcademicYear(e.target.value)}
            >
              <option value="">Select Next Academic Year</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>

            <select
              value={nextLevel}
              onChange={(e) => setNextLevel(e.target.value)}
            >
              <option value="">Select Next Level</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={nextVariant}
              onChange={(e) => setNextVariant(e.target.value)}
            >
              <option value="">Select Next Variant (optional)</option>
              {variants.map((v) => (
                <option key={v} value={v}>
                  {v.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              className={styles.promoteBtn}
              onClick={promoteStudents}
              disabled={promoting}
            >
              {promoting ? "Promoting..." : "Promote to Next Level"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoveStudents;
