"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, UserCheck } from "lucide-react";

import TaskComponent from "@/components/taskComponent/TaskComponent";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const TeacherTaskPage = ({ params }) => {
  const { teacherId } = params;
  const { data: session, status: sessionStatus } = useSession();
  const [school, setSchool] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data);
        const teacherExistingTask = await axios.get(
          `/api/assignments/${teacherId}`
        );
        setAssignments(teacherExistingTask.data || []);
      } catch (error) {
        console.error("Error fetching school data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.schoolId) {
      fetchSchoolData();
    }
  }, [session, teacherId]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-500">Loading teacher assignments...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/task">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Teachers
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Teacher Assignments"
        subtitle="View and inspect online tasks created by this teacher."
      />

      {assignments.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-ink-400">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-ink-300" />
            <h3 className="text-base font-semibold text-ink-800">No Assignments Found</h3>
            <p className="mt-1 text-sm text-ink-500">
              This teacher has not assigned any online tasks yet.
            </p>
          </CardBody>
        </Card>
      ) : (
        <TaskComponent
          teacherPage={false}
          adminPage={true}
          assignments={assignments}
          school={school}
        />
      )}
    </div>
  );
};

export default TeacherTaskPage;
