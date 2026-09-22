"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, School, ShieldCheck } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/Spinner/Spinner";

const EditUser = ({ params }) => {
  const { userId } = params;
  const [user, setUser] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get(`/api/users/${userId}`);
        setUser(data);
        setSelectedClasses(data.classes || []);
        setSelectedSubjects(data.subjects || []);
        setTeacherClasses(data.teacherOf || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        const sortedClasses = data.classes ? [...data.classes].sort() : [];
        const sortedSubjects = data.subjects ? [...data.subjects].sort() : [];
        setSchoolClasses(sortedClasses || []);
        setSchoolSubjects(sortedSubjects || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };
    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.role !== "ADMIN") {
      signOut({ redirect: false }).then(() => router.push("/"));
    }
  }, [sessionStatus, session, router]);

  if (sessionStatus === "loading" || !user) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  if (sessionStatus !== "authenticated") router.push("/");

  const addClass = async () => {
    setLoadingClass(true);
    try {
      const { data } = await axios.patch(`/api/teacher/addclass/${userId}`, {
        classesToAdd: selectedClasses,
      });
      alert(data.message || "Classes updated successfully.");
    } catch (err) {
      alert("Error Adding Class");
      console.error(err);
    } finally {
      setLoadingClass(false);
    }
  };

  const addSubject = async () => {
    setLoadingSubject(true);
    try {
      const { data } = await axios.patch(`/api/teacher/addsubject/${userId}`, {
        subjectsToAdd: selectedSubjects,
      });
      alert(data.message || "Subjects updated successfully.");
    } catch (err) {
      alert("Error Adding Subject");
      console.error(err);
    } finally {
      setLoadingSubject(false);
    }
  };

  const addTeacherClasses = async () => {
    setLoadingAttendance(true);
    try {
      const { data } = await axios.put(`/api/teacher/addclass/${userId}`, {
        classesToAdd: teacherClasses,
      });
      alert(data.message || "Attendance permissions updated successfully.");
    } catch (err) {
      alert("Error Adding Classes");
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleClassChange = (classItem) => {
    setSelectedClasses((prev) =>
      prev.includes(classItem) ? prev.filter((c) => c !== classItem) : [...prev, classItem]
    );
  };

  const handleTeacherClassChange = (classItem) => {
    setTeacherClasses((prev) =>
      prev.includes(classItem) ? prev.filter((c) => c !== classItem) : [...prev, classItem]
    );
  };

  return (
    <div>
      <PageHeader
        title={`Assign Classes & Subjects – ${user.name || user.username}`}
        subtitle="Teachers can only record scores and view data for their assigned classes and subjects."
        action={
          <Button as={Link} href="/admin/assign-class" variant="outline" icon={ArrowLeft}>
            Back to List
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Section 1: Subjects */}
        <Card className="flex flex-col">
          <CardHeader
            title="Assigned Subjects"
            subtitle="Select subjects this teacher will teach."
          />
          <CardBody className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                Available Subjects
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-ink-100 p-3">
                {schoolSubjects.map((subject) => (
                  <label
                    key={`subject-${subject}`}
                    htmlFor={`subject-${subject}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`subject-${subject}`}
                      value={subject}
                      checked={selectedSubjects.includes(subject)}
                      onChange={() => handleSubjectChange(subject)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-ink-800">{subject}</span>
                  </label>
                ))}
                {!schoolSubjects.length && (
                  <p className="text-xs text-ink-400">No subjects configured.</p>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Selected ({selectedSubjects.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubjects.map((subj) => (
                    <Badge key={subj} tone="brand">
                      {subj}
                    </Badge>
                  ))}
                  {!selectedSubjects.length && (
                    <span className="text-xs text-ink-400">None selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-ink-100">
              <Button
                disabled={loadingSubject}
                onClick={addSubject}
                icon={BookOpen}
                className="w-full"
              >
                {loadingSubject ? "Saving..." : "Save Subjects"}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Section 2: Teaching Classes */}
        <Card className="flex flex-col">
          <CardHeader
            title="Teaching Classes"
            subtitle="Select classes where this teacher conducts lessons."
          />
          <CardBody className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                Available Classes
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-ink-100 p-3">
                {schoolClasses.map((classItem) => (
                  <label
                    key={`class-${classItem}`}
                    htmlFor={`class-${classItem}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`class-${classItem}`}
                      value={classItem}
                      checked={selectedClasses.includes(classItem)}
                      onChange={() => handleClassChange(classItem)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-ink-800">
                      {classItem.toUpperCase()}
                    </span>
                  </label>
                ))}
                {!schoolClasses.length && (
                  <p className="text-xs text-ink-400">No classes configured.</p>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Selected ({selectedClasses.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClasses.map((cls) => (
                    <Badge key={cls} tone="amber">
                      {cls.toUpperCase()}
                    </Badge>
                  ))}
                  {!selectedClasses.length && (
                    <span className="text-xs text-ink-400">None selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-ink-100">
              <Button
                disabled={loadingClass}
                onClick={addClass}
                icon={School}
                className="w-full"
              >
                {loadingClass ? "Saving..." : "Save Classes"}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Section 3: Attendance Permissions */}
        <Card className="flex flex-col">
          <CardHeader
            title="Form Teacher Attendance"
            subtitle="Classes where this teacher can mark attendance registers."
          />
          <CardBody className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                Form Classes
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-ink-100 p-3">
                {schoolClasses.map((classItem) => (
                  <label
                    key={`teacherclass-${classItem}`}
                    htmlFor={`teacherclass-${classItem}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`teacherclass-${classItem}`}
                      value={classItem}
                      checked={teacherClasses.includes(classItem)}
                      onChange={() => handleTeacherClassChange(classItem)}
                      className="h-4 w-4 rounded border-ink-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-ink-800">
                      {classItem.toUpperCase()}
                    </span>
                  </label>
                ))}
                {!schoolClasses.length && (
                  <p className="text-xs text-ink-400">No classes configured.</p>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Selected ({teacherClasses.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {teacherClasses.map((cls) => (
                    <Badge key={cls} tone="success">
                      {cls.toUpperCase()}
                    </Badge>
                  ))}
                  {!teacherClasses.length && (
                    <span className="text-xs text-ink-400">None selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-ink-100">
              <Button
                disabled={loadingAttendance}
                onClick={addTeacherClasses}
                icon={ShieldCheck}
                className="w-full"
              >
                {loadingAttendance ? "Saving..." : "Save Attendance Permissions"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default EditUser;

