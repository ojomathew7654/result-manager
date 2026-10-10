"use client";

import { useEffect, useState } from "react";
import axios from "axios";
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

export default function StudentEditForm({ studentId, redirectPath, title }) {
  const [student, setStudent] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [levels, setLevels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");

  useEffect(() => {
    axios.get(`/api/student/${studentId}`).then(({ data }) => {
      setStudent(data);
      setImageUrl(data.image || "");
    });
  }, [studentId]);

  useEffect(() => {
    if (!student?.schoolId) return;
    axios.get(`/api/school/${student.schoolId}`).then(({ data }) => {
      const classes = data.classes || [];
      setLevels([...new Set(classes.map((value) => value.split("-")[0]))]);
      setVariants([...new Set(classes.map((value) => value.split("-")[1] || "").filter(Boolean))]);
    });
  }, [student?.schoolId]);

  function updateField(event) {
    const { name, value } = event.target;
    const nextValue = name === "username" || name === "password" ? value.replace(/\s/g, "") : value;
    setStudent((current) => ({ ...current, [name]: nextValue }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      let uploadedImageUrl = imageUrl;
      if (files.length > 0) {
        const compressedFiles = await Promise.all(files.map(async (file) => {
          let compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
          while (compressed.size > 1024 * 1024) {
            compressed = await imageCompression(compressed, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
          }
          return compressed;
        }));
        const uploaded = await startUpload(compressedFiles);
        if (!uploaded?.length) throw new Error("Image upload failed");
        uploadedImageUrl = uploaded[0].url;
      }

      const { data } = await axios.patch(`/api/student/${studentId}`, {
        newData: { ...student, image: uploadedImageUrl },
      });
      alert(data.message);
      window.location.href = redirectPath;
    } catch (error) {
      console.error(error);
      alert("Error when updating student");
    } finally {
      setLoading(false);
    }
  }

  if (!student) {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500"><Spinner /> Loading student...</div>;
  }

  return (
    <div>
      <PageHeader title={title} subtitle="Update student credentials, class placement, and profile information." action={<Button as="a" href={redirectPath} variant="outline" icon={ArrowLeft}>Back</Button>} />
      <Card className="max-w-4xl">
        <CardBody>
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <Field label="Username" htmlFor="username"><Input id="username" name="username" value={student.username || ""} onChange={updateField} required /></Field>
            <Field label="Password" htmlFor="password"><Input id="password" name="password" value={student.password || ""} onChange={updateField} required /></Field>
            <Field label="First name" htmlFor="name"><Input id="name" name="name" value={student.name || ""} onChange={updateField} required /></Field>
            <Field label="Surname" htmlFor="surname"><Input id="surname" name="surname" value={student.surname || ""} onChange={updateField} required /></Field>
            <Field label="Age" htmlFor="age"><Input id="age" name="age" value={student.age || ""} onChange={updateField} /></Field>
            <Field label="Registration number" htmlFor="registrationNo"><Input id="registrationNo" name="registrationNo" value={student.registrationNo || ""} onChange={updateField} /></Field>
            <Field label="Level" htmlFor="level"><Select id="level" name="level" value={student.level || ""} onChange={updateField} required><option value="" disabled>Select level</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</Select></Field>
            <Field label="Variant" htmlFor="variant"><Select id="variant" name="variant" value={student.variant || (variants.length ? "" : "no-variant")} onChange={updateField}><option value="" disabled>Select variant</option>{variants.length ? variants.map((variant) => <option key={variant} value={variant}>{variant}</option>) : <option value="no-variant">No variant available</option>}</Select></Field>
            <Field label="Gender" htmlFor="gender"><Select id="gender" name="gender" value={(student.gender || "").toLowerCase()} onChange={updateField} required><option value="" disabled>Select gender</option><option value="male">Male</option><option value="female">Female</option></Select></Field>
            <div className="sm:col-span-2"><p className="mb-1.5 text-sm font-medium text-ink-700">Student image</p><FileUploader imageUrl={imageUrl} onFieldChange={setImageUrl} setFiles={setFiles} /></div>
            <Button type="submit" disabled={loading} icon={Save} className="sm:col-span-2 sm:justify-self-start">{loading ? "Updating..." : "Save changes"}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
