"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Spinner from "@/components/Spinner/Spinner";
import { GraduationCap, Mail, MapPin, Phone, User } from "lucide-react";

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const storedData =
          JSON.parse(localStorage.getItem("studentData")) || [];
        if (!storedData.id) {
          router.push("/");
          return;
        }
        setStudent(storedData);
        const cacheKey = `school-${storedData.schoolId}`;
        const cachedSchool = localStorage.getItem(cacheKey);
        if (cachedSchool) {
          setSchool(JSON.parse(cachedSchool));
        }

        const schoolRes = await axios.get(`/api/school/${storedData.schoolId}`, {
          timeout: 8000,
        });
        if (!schoolRes.data) {
          throw new Error("School information was not found.");
        }
        setSchool(schoolRes.data);
        localStorage.setItem(cacheKey, JSON.stringify(schoolRes.data));
      } catch (err) {
        console.log(err);
        setError("Unable to load school information. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading && !school) {
    return (
      <h1 className="flex min-h-screen items-center justify-center gap-4 bg-paper text-xl text-ink-600">
        <Spinner /> Loading...
      </h1>
    );
  }

  if (!student || (!school && error)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-xl font-semibold text-ink-900">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-ink-500">{error || "Please sign in again to continue."}</p>
          <button type="button" onClick={() => router.push("/")} className="mt-5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            Return to login
          </button>
        </div>
      </main>
    );
  }

  const studentName = `${student.surname || ""} ${student.name || ""}`.trim();
  const registrationNumber = student.registrationNo || "—";
  const level = student.level || "—";
  const academicYear = student.academicYear || "—";
  const isSecondary = level.toLowerCase().startsWith("j") || level.toLowerCase().startsWith("s");

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
      {error ? <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Showing saved school information. Live refresh failed.</p> : null}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
              {school.logo ? (
                <Image src={school.logo} alt={school.name || "School logo"} width={44} height={44} className="h-full w-full object-contain" />
              ) : (
                <GraduationCap size={22} className="text-brand-700" />
              )}
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-ink-900">{school.fullName || school.name}</p>
              <p className="text-xs text-ink-400">Student dashboard</p>
            </div>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{academicYear}</span>
        </header>

        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-white">
              {school.logo ? (
                <Image src={school.logo} alt={school.name || "School logo"} width={64} height={64} className="h-full w-full object-contain" />
              ) : (
                <GraduationCap size={28} className="text-brand-700" />
              )}
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold text-ink-900">{school.fullName || school.name}</h1>
            <p className="mt-1 text-sm italic text-ink-400">{school.motto}</p>
          </div>

          <div className="mt-7 flex flex-col items-center gap-4 rounded-xl bg-ink-50 p-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-white">
              <Image src={student.image || "/img/noAvatar.png"} width={80} height={80} alt={studentName || "Student"} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-ink-900">{studentName}</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-ink-500">
                <div><dt className="inline text-ink-400">Reg no: </dt><dd className="inline">{registrationNumber}</dd></div>
                <div><dt className="inline text-ink-400">Level: </dt><dd className="inline">{level}</dd></div>
                <div><dt className="inline text-ink-400">Gender: </dt><dd className="inline">{student.gender || "—"}</dd></div>
                <div><dt className="inline text-ink-400">Age: </dt><dd className="inline">{student.age || "—"}</dd></div>
                <div className="col-span-2"><dt className="inline text-ink-400">Academic year: </dt><dd className="inline">{academicYear}</dd></div>
              </dl>
            </div>
          </div>

          <div className="mt-6 border-t border-ink-100 pt-5 text-sm text-ink-600">
            <h3 className="mb-3 font-medium text-ink-900">Contact information</h3>
            <div className="space-y-2">
              <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />{school.address || "—"}</p>
              <p className="flex items-start gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-brand-600" />{school.contactEmail || "—"}</p>
              <p className="flex items-start gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-brand-600" />{school.phoneNumber || "—"}</p>
            </div>
            <p className="mt-4 flex items-center gap-2 text-ink-400"><User size={16} />{isSecondary ? "Principal:" : school.name === "CRYSTAL BRAINS SCHOOL" ? "Head mistress:" : "Head master:"} {isSecondary ? school.principal : school.headmaster}</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
