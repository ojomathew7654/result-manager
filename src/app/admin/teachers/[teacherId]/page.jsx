"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { useUploadThing } from "@/utils/uploadthing";
import { ArrowLeft, Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";
import { FileUploader } from "@/utils/FileUploader/FileUploader";

export default function EditTeacher({ params }) {
  const [user, setUser] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { startUpload } = useUploadThing("imageUploader");

  useEffect(() => {
    axios.get(`/api/users/${params.teacherId}`).then(({ data }) => {
      setUser(data);
      setImageUrl(data.imageUrl || "");
    });
  }, [params.teacherId]);

  function updateField(event) {
    const { name, value } = event.target;
    setUser((current) => ({ ...current, [name]: name === "username" || name === "password" ? value.replace(/\s/g, "") : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      let uploadedImageUrl = imageUrl;
      if (files.length) {
        const compressed = await Promise.all(files.map((file) => imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true })));
        const uploaded = await startUpload(compressed);
        if (!uploaded?.length) throw new Error("Image upload failed");
        uploadedImageUrl = uploaded[0].url;
      }
      const fields = { username: user.username, password: user.password, role: user.role, name: user.name, gender: user.gender, classes: user.classes || [], subjects: user.subjects || [], imageUrl: uploadedImageUrl };
      const { data } = await axios.patch(`/api/users/${params.teacherId}`, { otherFields: fields, newClasses: fields.classes, newSubjects: fields.subjects });
      if (files.length) await axios.post("/api/img", { username: user.username, imageUrl: uploadedImageUrl });
      alert(data.message);
      router.push("/admin/teachers");
    } catch (error) {
      console.error(error);
      alert("Error when updating teacher");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500"><Spinner /> Loading teacher...</div>;

  return (
    <div>
      <PageHeader title="Edit teacher" subtitle={`Update ${user.name || "teacher"}'s account details.`} action={<Button as="a" href="/admin/teachers" variant="outline" icon={ArrowLeft}>Back</Button>} />
      <Card className="max-w-3xl"><CardBody><form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <Field label="Username" htmlFor="username"><Input id="username" name="username" value={user.username || ""} onChange={updateField} required /></Field>
        <Field label="Password" htmlFor="password"><Input id="password" name="password" value={user.password || ""} onChange={updateField} required /></Field>
        <Field label="Name" htmlFor="name"><Input id="name" name="name" value={user.name || ""} onChange={updateField} required /></Field>
        <Field label="Role" htmlFor="role"><Select id="role" name="role" value={user.role || "USER"} onChange={updateField}><option value="USER">Teacher</option><option value="ACCOUNTANT">Accountant</option><option value="ADMIN">Admin</option></Select></Field>
        <Field label="Gender" htmlFor="gender"><Select id="gender" name="gender" value={user.gender || ""} onChange={updateField}><option value="" disabled>Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
        <div className="sm:col-span-2"><p className="mb-1.5 text-sm font-medium text-ink-700">Profile image</p><FileUploader imageUrl={imageUrl} onFieldChange={setImageUrl} setFiles={setFiles} /></div>
        <Button type="submit" disabled={loading} icon={Save} className="sm:col-span-2 sm:justify-self-start">{loading ? "Updating..." : "Save changes"}</Button>
      </form></CardBody></Card>
    </div>
  );
}
