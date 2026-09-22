"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const AllUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/teacher/${session.schoolId}`);
        if (active) setUsers(data || []);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (session?.schoolId) {
      fetchUsers();
    }
    return () => {
      active = false;
    };
  }, [session?.schoolId]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.role !== "ADMIN") {
      signOut({ redirect: false }).then(() => redirect("/"));
    }
  }, [sessionStatus, session]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  const sortedUsers = [...users].sort((a, b) => {
    const nameA = (a.name || "").toLowerCase().trim();
    const nameB = (b.name || "").toLowerCase().trim();
    return nameA.localeCompare(nameB);
  });

  return (
    <div>
      <PageHeader
        title="Assign Class & Subject"
        subtitle="Select a teacher to configure their assigned subjects, teaching classes, and form teacher permissions."
        action={
          <Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>
            Dashboard
          </Button>
        }
      />

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-ink-400">
                    Loading teachers...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-ink-100">
                {sortedUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 text-ink-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Image
                        src={user.imageUrl || "/img/noAvatar.png"}
                        alt={user.name || "Teacher"}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{user.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-600">{user.role || "—"}</td>
                    <td className="px-4 py-3 text-ink-600">{user.gender || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button
                        as={Link}
                        href={`/admin/assign-class/${user.id}`}
                        variant="secondary"
                        size="sm"
                        icon={UserCheck}
                      >
                        Assign Class
                      </Button>
                    </td>
                  </tr>
                ))}
                {!sortedUsers.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-ink-400">
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </CardBody>
      </Card>
    </div>
  );
};

export default AllUser;

