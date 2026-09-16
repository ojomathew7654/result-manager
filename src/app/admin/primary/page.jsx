"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const AllStudents = () => {
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

  const [academicYear, setAcademicYear] = useState("");

  const fetchStudents = async (academicYear, selectedClass) => {
    if (!selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/class/${"FIRST"}-${
          session.schoolId
        }-${encodedAcademicYear}-${selectedClass}`
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

        const primarySchool = [];
        const secondarySchool = [];

        data.classes.forEach((c) => {
          if (c.length > 1 && c[1].toLowerCase() === "s") {
            secondarySchool.push(c);
          } else {
            primarySchool.push(c);
          }
        });
        setSchoolClasses(primarySchool);
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
        <Spinner />
        Please wait...
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
    <div>
      <PageHeader title="Primary students" subtitle="Browse and manage students in primary classes." action={<Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>Dashboard</Button>} />
      <Card className="mb-5">
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select id="academicYearSelect" value={academicYear} onChange={handleAcademicYearChange}>
          <option value="" disabled>
            Select academy year
          </option>
          {/* <option value="2024/2025">2024/2025</option> */}
          <option value="2025/2026">2025/2026</option>
          </Select>
          <Select id="class-select" value={selectedClass} onChange={handleClassChange}>
          <option value="" disabled>
            Select Class
          </option>
          {schoolClasses.map((className) => (
            <option key={className} value={className}>
              {className.toUpperCase()}
            </option>
          ))}
          </Select>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th>No</th>
              <th>Surname</th>
              <th>Name</th>
              <th>Level</th>
              <th>Variant</th>
              <th>Action</th>
            </tr>
          </thead>
            {loading ? <tbody><tr><td colSpan="6" className="px-5 py-10 text-center text-ink-400">Loading students...</td></tr></tbody> : (
              <tbody className="divide-y divide-ink-100">
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.surname}</td>
                  <td>{student.name}</td>
                  <td>{student.level}</td>
                  <td>{student.variant}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link className="mr-3 font-medium text-brand-700 hover:text-brand-900" href={`/admin/primary/${student.id}`}>Edit</Link>
                    <button className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-800" onClick={() => handleDeleteStudent(student.id)}><Trash2 size={14} />Delete</button>
                  </td>
                </tr>
              ))}
                </tbody>
              )}
            </table>
          </CardBody>
        </Card>
    </div>
  );
};

export default AllStudents;
