"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { format, parse, parseISO } from "date-fns";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useSonner } from "@/lib/useSonner";


const UpdateSchool = () => {
  const defaultTerms = [
    {
      id: "1",
      termType: "FIRST",
      termBegins: "",
      termEnds: "",
      nextTermBegin: "",
    },
    {
      id: "2",
      termType: "SECOND",
      termBegins: "",
      termEnds: "",
      nextTermBegin: "",
    },
    {
      id: "3",
      termType: "THIRD",
      termBegins: "",
      termEnds: "",
      nextTermBegin: "",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [termDates, setTermDates] = useState(defaultTerms);
  const [formData, setFormData] = useState({
    principal: "",
    headmaster: "",
    address: "",
    contactEmail: "",
    motto: "",
    phoneNumber: "",
    input: [],
    termType: "FIRST",
    termBegins: "",
    termEnds: "",
    nextTermBegin: "",
  });

  const { data: session, status: sessionStatus } = useSession();
    const { customSonner } = useSonner();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ✅ Handle checkboxes
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        input: checked
          ? [...prev.input, name] // add
          : prev.input.filter((item) => item !== name), // remove
      }));
      return;
    }

    // ✅ Handle term switching
    if (name === "termType") {
      const selectedTerm = termDates.find((term) => term.termType === value);
      setFormData({
        ...formData,
        termType: value,
        termBegins: selectedTerm?.termBegins
          ? format(new Date(selectedTerm.termBegins), "yyyy-MM-dd")
          : "",
        termEnds: selectedTerm?.termEnds
          ? format(new Date(selectedTerm.termEnds), "yyyy-MM-dd")
          : "",
        nextTermBegin: selectedTerm?.nextTermBegin
          ? format(new Date(selectedTerm.nextTermBegin), "yyyy-MM-dd")
          : "",
      });
      return;
    }

    // ✅ Default input handling
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        const fetchedTerms = data.termDates || [];
        const mergedTerms = defaultTerms.map((defaultTerm) => {
          const existingTerm = fetchedTerms.find(
            (term) => term.termType === defaultTerm.termType,
          );
          return existingTerm
            ? { ...defaultTerm, ...existingTerm }
            : defaultTerm;
        });
        setTermDates(mergedTerms);
        const currentTerm =
          mergedTerms.find((term) => term.termType === formData.termType) ||
          mergedTerms[0];

        setFormData((prev) => ({
          ...prev,
          principal: data.principal || "",
          headmaster: data.headmaster || "",
          address: data.address || "",
          contactEmail: data.contactEmail || "",
          motto: data.motto || "",
          phoneNumber: data.phoneNumber || "",
          input: data.input || [],
          termType: currentTerm.termType || "FIRST",
          termBegins: currentTerm.termBegins
            ? format(new Date(currentTerm.termBegins), "yyyy-MM-dd")
            : "",
          termEnds: currentTerm.termEnds
            ? format(new Date(currentTerm.termEnds), "yyyy-MM-dd")
            : "",
          nextTermBegin: currentTerm.nextTermBegin
            ? format(new Date(currentTerm.nextTermBegin), "yyyy-MM-dd")
            : "",
        }));
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };

    if (session) {
      fetchSchoolData();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedNextTermBegin = formData.nextTermBegin
        ? format(parseISO(formData.nextTermBegin), "EEE, MMM d, yyyy")
        : "";
      const formattedTermBegin = formData.termBegins
        ? format(parseISO(formData.termBegins), "EEE, MMM d, yyyy")
        : "";
      const formattedTermEnds = formData.termEnds
        ? format(parseISO(formData.termEnds), "EEE, MMM d, yyyy")
        : "";

      const updatedData = {
        ...formData,
        termBegins: formattedTermBegin,
        termEnds: formattedTermEnds,
        nextTermBegin: formattedNextTermBegin,
      };

      const { data } = await axios.patch(
        `/api/school/${session.schoolId}`,
        updatedData,
      );
      customSonner({
        type: "success",
        text: data.message,
      });
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkboxItems = [
    "firstCA",
    "secondCA",
    "thirdCA",
    "fourthCA",
    "fifthCA",
    "sixthCA",
    "assignment",
    "project",
    "affective",
    "rt",
    "note",
    "exam",
  ];

  return (
    <div>
      <PageHeader title="Update school" subtitle="Keep your school profile and term settings current." />
      <Card className="max-w-3xl"> 
        <CardBody>
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
            <Field label="Principal name" htmlFor="principal">
              <Input
            type="text"
            id="principal"
            name="principal"
            value={formData.principal}
            onChange={handleChange}
              />
            </Field>
            <Field label="Headmaster name" htmlFor="headmaster">
              <Input
            type="text"
            id="headmaster"
            name="headmaster"
            value={formData.headmaster}
            onChange={handleChange}
              />
            </Field>
            <Field label="Address" htmlFor="address" className="lg:col-span-2">
              <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
              />
            </Field>
            <Field label="Contact email" htmlFor="contactEmail">
              <Input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
              />
            </Field>
            <Field label="Phone number" htmlFor="phoneNumber">
              <Input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
              />
            </Field>
            <Field label="Motto" htmlFor="motto" className="lg:col-span-2">
              <Input
            type="text"
            id="motto"
            name="motto"
            value={formData.motto}
            onChange={handleChange}
              />
            </Field>
            <Field label="Current term" htmlFor="termType">
              <Select
            id="termType"
            name="termType"
            value={formData.termType}
            onChange={handleChange}
              >
            <option value="" disabled>
              Select Term
            </option>
            {termDates.map((term) => (
              <option key={term.id} value={term.termType}>
                {term.termType.charAt(0).toUpperCase() +
                  term.termType.slice(1).toLowerCase()}{" "}
                Term
              </option>
            ))}
              </Select>
            </Field>
            <Field label="Term begins" htmlFor="termBegins">
              <Input
            type="date"
            id="termBegins"
            name="termBegins"
            value={formData.termBegins}
            onChange={handleChange}
              />
            </Field>
            <Field label="Term ends" htmlFor="termEnds">
              <Input
            type="date"
            id="termEnds"
            name="termEnds"
            value={formData.termEnds}
            onChange={handleChange}
              />
            </Field>
            <Field label="Next term begins" htmlFor="nextTermBegin">
              <Input
            type="date"
            id="nextTermBegin"
            name="nextTermBegin"
            value={formData.nextTermBegin}
            onChange={handleChange}
              />
            </Field>
            <fieldset className="lg:col-span-2">
              <legend className="mb-2 text-sm font-medium text-ink-700">Select input fields</legend>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-ink-100 bg-ink-50 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {checkboxItems.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  id={item}
                  name={item}
                  checked={formData.input.includes(item)}
                  onChange={handleChange}
                />
                <span>{item}</span>
              </label>
            ))}
              </div>
            </fieldset>

            <Button type="submit" disabled={loading} className="lg:col-span-2 lg:justify-self-start">
              {loading ? "Updating..." : "Update school"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default UpdateSchool;
