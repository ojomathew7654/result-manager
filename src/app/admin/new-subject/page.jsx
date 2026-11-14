"use client";
import { useEffect, useState } from "react";
import styles from "./newSubject.module.css";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import AlertDialog from "@/components/others/AlertDialog";
import Spinner from "@/components/Spinner/Spinner";

const apiMessage = (err, fallback) => err?.response?.data?.message || fallback;
const byName = (a, b) => a.name.localeCompare(b.name);

const NewSubject = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolSubjects, setSchoolSubjects] = useState([]); // [{ id, name }]
  const [schoolClasses, setSchoolClasses] = useState([]);
  const { data: session, status: sessionStatus } = useSession();
  const [alertMessage, setAlertMessage] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [openAlert, setOpenAlert] = useState(false);

  const showAlert = (message) => {
    setAlertMessage(message);
    setOpenAlert(true);
  };

  useEffect(() => {
    if (sessionStatus === "authenticated" && session.role !== "ADMIN") {
      signOut({ callbackUrl: "/" });
    }
  }, [sessionStatus, session]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [school, subjects] = await Promise.all([
          axios.get(`/api/school/${session.schoolId}`),
          axios.get(`/api/school/subject/${session.schoolId}`),
        ]);
        setSchoolClasses(school.data.classes?.sort() || []);
        setSchoolSubjects((subjects.data.subjects || []).sort(byName));
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };
    if (session?.schoolId) fetchData();
  }, [session]);

  const createSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      showAlert("Please enter a valid subject name.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/school/subject/create", {
        schoolId: session.schoolId,
        name: newSubject,
      });
      setSchoolSubjects((prev) => [...prev, data.subject].sort(byName));
      setNewSubject("");
      showAlert(data.message);
    } catch (err) {
      showAlert(apiMessage(err, "Failed to create subject."));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (subject) => {
    setEditingId(subject.id);
    setEditedName(subject.name);
  };

  // Renaming changes ONE row. Every student and teacher linked to it
  // picks up the new name automatically.
  const saveEditedSubject = async () => {
    if (!editedName.trim()) {
      showAlert("Please enter a valid subject name.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/school/subject/${editingId}`, {
        name: editedName,
      });
      setSchoolSubjects((prev) =>
        prev.map((s) => (s.id === editingId ? data.subject : s)).sort(byName),
      );
      setEditingId(null);
      setEditedName("");
      showAlert(data.message);
    } catch (err) {
      showAlert(apiMessage(err, "Failed to rename subject."));
    } finally {
      setLoading(false);
    }
  };

  const classPayload = () => {
    const [className, variant] = selectedClass.split("-");
    return {
      className,
      variant,
      subjectId: Number(selectedSubjectId),
      schoolId: session.schoolId,
      academicYear,
    };
  };

  const addSubjectToClass = async () => {
    if (!academicYear || !selectedClass || !selectedSubjectId) {
      showAlert("Please select academic year, class and subject.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/subject", classPayload());
      showAlert(data.message);
    } catch (err) {
      showAlert(apiMessage(err, "Error adding subject to class."));
    } finally {
      setLoading(false);
    }
  };

  const removeSubjectFromClass = async () => {
    if (!academicYear || !selectedClass || !selectedSubjectId) {
      showAlert("Please select academic year, class and subject.");
      return;
    }
    if (
      !confirm(
        "Removing this subject from the class also deletes the students' scores for it. Continue?",
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.delete("/api/subject", {
        data: classPayload(),
      });
      showAlert(data.message);
    } catch (err) {
      showAlert(apiMessage(err, "Error removing subject from class."));
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className={styles.newSubject}>
      <h1>
        This is where you add or remove subjects to/from a particular class.
      </h1>
      <h2>
        Select academic year, class and subject that you want to add or remove.
      </h2>

      {openAlert && (
        <AlertDialog message={alertMessage} setOpenAlert={setOpenAlert} />
      )}

      <div className={styles.inputContainer}>
        <input
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          type="text"
          placeholder="Enter new subject"
        />
        <button
          disabled={loading}
          className={loading ? styles.disabled : ""}
          onClick={createSubject}
        >
          {loading ? "please wait.." : "Create Subject"}
        </button>
      </div>

      <div className={styles.selectContainer}>
        <select
          id="academicYearSelect"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
        >
          <option value="" disabled>
            Select academic year
          </option>
          <option value="2026/2027">2026/2027</option>
        </select>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="" disabled>
            Select class
          </option>
          {schoolClasses.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
        >
          <option disabled value="">
            Select subject
          </option>
          {schoolSubjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <div className={styles.buttonContainer}>
          <button
            className={loading ? styles.disabled : ""}
            disabled={loading}
            onClick={addSubjectToClass}
          >
            {loading ? "please wait..." : "Add Subject"}
          </button>
          <button
            className={loading ? styles.disabled : ""}
            disabled={loading}
            onClick={removeSubjectFromClass}
          >
            {loading ? "please wait..." : "Remove Subject"}
          </button>
        </div>
      </div>

      <div className={styles.subjects}>
        <h2>All School Subjects will appear below.</h2>
        <h2>You created ({schoolSubjects.length}) subjects</h2>
        <ul>
          {schoolSubjects.map((subject) => (
            <li key={subject.id}>
              {editingId === subject.id ? (
                <input
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              ) : (
                subject.name
              )}
              <span>
                {editingId === subject.id ? (
                  <div style={{ display: "flex" }}>
                    <button
                      disabled={loading}
                      className={styles.save}
                      onClick={saveEditedSubject}
                    >
                      {loading ? "wait..." : "Save"}
                    </button>{" "}
                    <button
                      disabled={loading}
                      className={styles.save}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex" }}>
                    <button
                      className={styles.edit}
                      onClick={() => startEditing(subject)}
                    >
                      Rename
                    </button>
                  </div>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NewSubject;
