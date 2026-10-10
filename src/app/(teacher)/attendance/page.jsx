"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ManualAttendance from "./ManualAttendance";
import Spinner from "@/components/Spinner/Spinner";

const AttendanceRegister = () => {
  const { data: session, status: sessionStatus } = useSession();

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
    <div className="mx-auto max-w-6xl p-6">
      <ManualAttendance session={session} />
    </div>
  );
};

export default AttendanceRegister;
