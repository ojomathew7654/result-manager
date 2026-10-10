"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import axios from "axios";
import { ArrowLeft, Trash2 } from "lucide-react";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.schoolId) return;

    let active = true;
    setLoading(true);

    axios
      .get(`/api/users/get/${session.schoolId}`)
      .then(({ data }) => {
        if (active) setUsers(data);
      })
      .catch((error) => {
        console.error("Failed to fetch school admins:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.role !== "ADMIN") {
      signOut({ redirect: false }).then(() => redirect("/"));
    }
  }, [session, sessionStatus]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    redirect("/");
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const { data } = await axios.delete(`/api/users/${userId}`);
      alert(data.message);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("There was an error deleting the user:", error);
      alert("Unable to delete this user.");
    }
  }

  const sortedUsers = [...users].sort((firstUser, secondUser) =>
    (firstUser.username || "").localeCompare(secondUser.username || "")
  );

  return (
    <div>
      <PageHeader
        dark={false}
        title="School admins"
        subtitle="Manage administrator access for your school."
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
                <th className="px-4 py-3">Added on</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-ink-400">
                    Loading admins...
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
                        alt={user.name || "Admin"}
                        width={45}
                        height={45}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{user.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-600">{user.role || "—"}</td>
                    <td className="px-4 py-3 text-ink-600">{user.gender?.toUpperCase() || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString("en-GB") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        className="mr-3 font-medium text-brand-700 hover:text-brand-900"
                        href={`/admin/users/${user.id}`}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-800"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!sortedUsers.length && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-ink-400">
                      No administrators found.
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
}
