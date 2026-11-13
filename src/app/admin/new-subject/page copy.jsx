"use client";
import React, { useEffect, useState } from "react";
import styles from "./newSubject.module.css";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import AlertDialog from "@/components/others/AlertDialog";
import Spinner from "@/components/Spinner/Spinner";

const NewSubject = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [editedSubjectName, setEditedSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const { data: session, status: sessionStatus } = useSession();
  const [alertMessage, setAlertMessage] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [openAlert, setOpenAlert] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  const handleAcademicYearChange = (event) => {
    setAcademicYear(event.target.value);
  };

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchoolClasses(data.classes.sort() || []);
        setSchoolSubjects(data.subjects.sort() || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setEditedSubjectName(subject);
  };

  const saveEditedSubject = async () => {
    const trimmedEditedSubjectName = editedSubjectName.trim();
    if (!trimmedEditedSubjectName) {
      setAlertMessage("Please enter a valid subject name.");
      setOpenAlert(true);
      return;
    }
    setLoading(true);
    try {
      const updatedSubjects = schoolSubjects.map((subject) =>
        subject === editingSubject ? trimmedEditedSubjectName : subject,
      );
      const { data } = await axios.patch(`/api/school/${session.schoolId}`, {
        subjects: updatedSubjects,
      });
      setAlertMessage(data.message);
      setOpenAlert(true);
      setSchoolSubjects(updatedSubjects);
      setEditingSubject(null);
      setEditedSubjectName("");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const createSubject = async (e) => {
    e.preventDefault();
    const trimmedNewSubject = newSubject.trim();
    if (!trimmedNewSubject) {
      setAlertMessage("Please enter a valid subject name.");
      setOpenAlert(true);
      return;
    }
    const subjectExists = schoolSubjects.some(
      (subject) => subject.toLowerCase() === trimmedNewSubject.toLowerCase(),
    );
    if (subjectExists) {
      setAlertMessage("Subject already exists.");
      setOpenAlert(true);
      return;
    }
    setLoading(true);
    try {
      const updatedSubjects = [...schoolSubjects, trimmedNewSubject];
      const { data } = await axios.patch(`/api/school/${session.schoolId}`, {
        subjects: updatedSubjects,
      });
      setAlertMessage(data.message);
      setOpenAlert(true);
      setSchoolSubjects(updatedSubjects);
      setNewSubject("");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async () => {
    if (!academicYear || !selectedClass || !selectedSubject) {
      setAlertMessage(
        "Please select from academicYear, Class, Subject, and Term.",
      );
      setOpenAlert(true);
      return;
    }
    setLoading(true);
    try {
      const className = selectedClass.split("-");
      const { data } = await axios.post("/api/subject", {
        className: className[0],
        variant: className[1],
        subjectName: selectedSubject,
        schoolId: session.schoolId,
        academicYear: academicYear,
      });
      setAlertMessage(data.message);
      setOpenAlert(true);
    } catch (error) {
      console.error("Error adding subject:", error);
    } finally {
      setLoading(false);
    }
  };
  const editSubject = async () => {
    const trimmedNewSubject = newSubject.trim();
    if (
      !academicYear ||
      !selectedClass ||
      !selectedSubject ||
      !trimmedNewSubject
    ) {
      setAlertMessage(
        "Please enter new subject, select from academicYear, Class and old Subject.",
      );
      setOpenAlert(true);
      return;
    }
    setLoading(true);
    try {
      const className = selectedClass.split("-");
      const { data } = await axios.put("/api/subject", {
        className: className[0],
        variant: className[1],
        schoolId: session.schoolId,
        academicYear: academicYear,
        currentSubjectName: selectedSubject,
        newSubjectName: trimmedNewSubject,
      });
      setAlertMessage(data.message);
      setOpenAlert(true);
    } catch (error) {
      console.error("Error adding subject:", error);
    } finally {
      setLoading(false);
    }
  };
  const removeSubject = async () => {
    if (!academicYear || !selectedClass || !selectedSubject) {
      setAlertMessage(
        "Please select from academicYear, Class, Subject, and Term.",
      );
      setOpenAlert(true);
      return;
    }
    setLoading(true);
    try {
      const className = selectedClass.split("-");
      const { data } = await axios.delete("/api/subject", {
        data: {
          className: className[0],
          variant: className[1],
          subjectName: selectedSubject,
          schoolId: session.schoolId,
          academicYear: academicYear,
        },
      });
      setAlertMessage(data.message);
      setOpenAlert(true);
    } catch (error) {
      console.error("Error removing subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (subjectName) => {
    if (!confirm(`Are you sure you want to delete ${subjectName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.delete(
        `/api/school/subject/${session.schoolId}-${subjectName}`,
        {
          data: { schoolId: session.schoolId, subjectName },
        },
      );
      setAlertMessage(data.message);
      setOpenAlert(true);
      setSchoolSubjects(
        schoolSubjects.filter((subject) => subject !== subjectName),
      );
    } catch (err) {
      console.log(err);
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
        Select academicYear, class and subject that you want to add or remove.
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
          {loading ? "please wait.." : "Create Subject"}{" "}
        </button>
      </div>

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

        <select value={selectedClass} onChange={handleClassChange}>
          <option value="" disabled>
            Select class
          </option>
          {schoolClasses.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem.toUpperCase()}
            </option>
          ))}
        </select>
        <select value={selectedSubject} onChange={handleSubjectChange}>
          <option disabled value="">
            Select subject
          </option>
          {schoolSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <div className={styles.buttonContainer}>
          <button
            className={loading ? styles.disabled : ""}
            disabled={loading}
            onClick={addSubject}
          >
            {loading ? "please wait..." : "Add Subject"}
          </button>
          <button
            className={loading ? styles.disabled : ""}
            disabled={loading}
            onClick={removeSubject}
          >
            {loading ? "please wait..." : "Remove Subject"}
          </button>
          <button
            className={loading ? styles.disabled : ""}
            disabled={loading}
            onClick={editSubject}
          >
            {loading ? "please wait..." : "Edit Subject"}
          </button>
        </div>
      </div>

      <div className={styles.subjects}>
        <h2>All School Subjects will appear below.</h2>
        <h2>You created ({schoolSubjects?.length}) subjects</h2>
        <ul>
          {schoolSubjects.map((subject) => (
            <li key={subject}>
              {editingSubject === subject ? (
                <input
                  autoFocus
                  value={editedSubjectName}
                  onChange={(e) => setEditedSubjectName(e.target.value)}
                />
              ) : (
                subject
              )}
              <span>
                {editingSubject === subject ? (
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
                      onClick={() => setEditingSubject(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex" }}>
                    <button
                      className={styles.edit}
                      onClick={() => handleEditSubject(subject)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => deleteSubject(subject)}
                    >
                      Delete
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
