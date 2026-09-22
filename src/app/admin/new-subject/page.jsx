"use client";

import React, { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import { BookOpen, Plus, Pencil, Trash2, Check, X, SlidersHorizontal, BookPlus, AlertCircle } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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
        setSchoolClasses(data.classes?.sort() || []);
        setSchoolSubjects(data.subjects?.sort() || []);
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
        subject === editingSubject ? trimmedEditedSubjectName : subject
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
      (subject) => subject.toLowerCase() === trimmedNewSubject.toLowerCase()
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
        "Please select from academicYear, Class, Subject, and Term."
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
        "Please enter new subject, select from academicYear, Class and old Subject."
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
        "Please select from academicYear, Class, Subject, and Term."
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
        }
      );
      setAlertMessage(data.message);
      setOpenAlert(true);
      setSchoolSubjects(
        schoolSubjects.filter((subject) => subject !== subjectName)
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-500">Please wait...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Subject Management"
        subtitle="Create global subjects for your school or manage subject allocations per class."
      />

      {openAlert && (
        <AlertDialog message={alertMessage} setOpenAlert={setOpenAlert} />
      )}

      {/* Grid for Create Global Subject and Class Subject Allocations */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Create Global Subject */}
        <Card>
          <CardHeader
            title="Create New Subject"
            subtitle="Add a subject to your school's global list"
          />
          <CardBody className="space-y-4">
            <form onSubmit={createSubject} className="space-y-4">
              <Field label="Subject Name">
                <Input
                  icon={BookOpen}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  type="text"
                  placeholder="e.g. Mathematics, English Language"
                />
              </Field>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                icon={Plus}
                className="w-full"
              >
                {loading ? "Processing..." : "Create Subject"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Card 2: Manage Class Allocations */}
        <Card>
          <CardHeader
            title="Class Subject Allocation"
            subtitle="Add, edit, or remove subjects for a specific class"
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Academic Year">
                <Select
                  id="academicYearSelect"
                  value={academicYear}
                  onChange={handleAcademicYearChange}
                >
                  <option value="" disabled>
                    Select academic year
                  </option>
                  <option value="2025/2026">2025/2026</option>
                </Select>
              </Field>

              <Field label="Class">
                <Select value={selectedClass} onChange={handleClassChange}>
                  <option value="" disabled>
                    Select class
                  </option>
                  {schoolClasses.map((classItem) => (
                    <option key={classItem} value={classItem}>
                      {classItem.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Subject">
                <Select value={selectedSubject} onChange={handleSubjectChange}>
                  <option disabled value="">
                    Select subject
                  </option>
                  {schoolSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                disabled={loading}
                variant="primary"
                size="sm"
                icon={BookPlus}
                onClick={addSubject}
                className="flex-1"
              >
                {loading ? "Wait..." : "Add to Class"}
              </Button>

              <Button
                disabled={loading}
                variant="outline"
                size="sm"
                icon={Pencil}
                onClick={editSubject}
                className="flex-1"
              >
                {loading ? "Wait..." : "Update Class Subj"}
              </Button>

              <Button
                disabled={loading}
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={removeSubject}
                className="flex-1"
              >
                {loading ? "Wait..." : "Remove"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Card 3: Global Subjects Directory */}
      <Card>
        <CardHeader
          title="School Subjects Directory"
          subtitle={`Total Created Subjects: ${schoolSubjects?.length || 0}`}
        />
        <CardBody>
          {schoolSubjects.length === 0 ? (
            <div className="py-8 text-center text-ink-400">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-ink-300" />
              <p className="text-sm">No subjects created yet. Use the form above to add your first subject.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {schoolSubjects.map((subject) => (
                <div
                  key={subject}
                  className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/50 p-3 transition-colors hover:border-ink-200"
                >
                  {editingSubject === subject ? (
                    <div className="flex w-full items-center gap-2">
                      <Input
                        autoFocus
                        value={editedSubjectName}
                        onChange={(e) => setEditedSubjectName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        disabled={loading}
                        variant="primary"
                        size="sm"
                        onClick={saveEditedSubject}
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        disabled={loading}
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSubject(null)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-brand-600" />
                        <span className="font-medium text-ink-800">{subject}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditSubject(subject)}
                          className="rounded p-1 text-ink-400 hover:bg-ink-200/50 hover:text-brand-600"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteSubject(subject)}
                          className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default NewSubject;
