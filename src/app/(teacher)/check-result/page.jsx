"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import Class from "@/components/Class";

const Page = () => {
  const { status: sessionStatus } = useSession();

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-400">Loading result manager...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Score Entry & Management"
        subtitle="Select academic year, term, class, and subject to record or update student scores."
      />
      <Class />
    </div>
  );
};

export default Page;
