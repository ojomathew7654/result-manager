"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";
import { ArrowLeft, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const AllUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/teacher/${session.schoolId}`);
        setUsers(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session?.schoolId]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const { data } = await axios.delete(`/api/users/${userId}`);
    alert(data.message);
    setUsers(users.filter((user) => user.id !== userId));
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  if (sessionStatus == "loading" || loading == true)
    return (
      <h1 className="waitH1">
        {" "}
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const sortedUsers = users?.sort((a, b) => {
    const nameA = a.name.toLowerCase().trim();
    const nameB = b.name.toLowerCase().trim();

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  return (
    <div>
      <PageHeader dark={false} title="Teachers" subtitle="Manage teaching staff in your school." action={<Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>Dashboard</Button>} />
      <Card>
        <CardBody className="overflow-x-auto p-0">
        {users.length > 0 ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th>No</th>
                <th>Image</th>
                <th>Name</th>
                <th>Role</th>
                <th>Gender</th>
                <th>Added on</th>
                <th>Action</th>
              </tr>
            </thead>
            {loading ? <tbody><tr><td colSpan="7" className="px-5 py-10 text-center text-ink-400">Loading teachers...</td></tr></tbody> : (
              <tbody className="divide-y divide-ink-100">
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td className="px-4 py-3">
                      <Image
                        src={user.imageUrl || "/img/noAvatar.png"}
                        alt="img"
                        width={45}
                        height={45}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{user.gender}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
                      {new Date(user.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <Link className="mr-3 font-medium text-brand-700 hover:text-brand-900" href={`/admin/teachers/${user.id}`}>Edit</Link>
                      <button className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-800" onClick={() => handleDeleteUser(user.id)}><Trash2 size={14} />Delete</button>
                    </td>
                  </tr>
                ))}
                  </tbody>
            )}
          </table>
        ) : (
              <p className="p-8 text-center text-ink-400">No teachers found.</p>
        )}
            </CardBody>
          </Card>
    </div>
  );
};

export default AllUser;
