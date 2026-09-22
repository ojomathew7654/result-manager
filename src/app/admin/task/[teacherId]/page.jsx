"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import TaskComponent from "@/components/taskComponent/TaskComponent";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner/Spinner";

const EditUser = ({ params }) => {
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
        const sortedSubjects = data.subjects ? data.subjects.sort() : [];
        setSchool(data);
        const teacherExistingTask = await axios.get(
          `/api/assignments/${teacherId}`
        );
        console.log(teacherExistingTask);
        setAssignments(teacherExistingTask.data);
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

  if (sessionStatus == "loading" || loading)
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  if (assignments.length === 0) {
    return (
      <h1 className="waitH1">
        This teacher has not been giving any online task.
      </h1>
    );
  }
  return (
    <div>
      <TaskComponent
        teacherPage={false}
        adminPage={true}
        assignments={assignments}
        school={school}
      />
    </div>
  );
};

export default EditUser;
