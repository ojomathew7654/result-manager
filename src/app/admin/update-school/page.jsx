"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./updateSchool.module.css";
import { useSession, signOut } from "next-auth/react";
import { format, parse, parseISO } from "date-fns";
import Spinner from "@/components/Spinner/Spinner";

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

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
      alert(data.message);
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
    <div className={styles.container}>
      <h2>Edit School Information</h2>
      <form onSubmit={handleSubmit} className={styles.schoolForm}>
        <div className={styles.formGroup}>
          <label htmlFor="principal">Principal Name</label>
          <input
            type="text"
            id="principal"
            name="principal"
            value={formData.principal}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="headmaster">Headmaster Name</label>
          <input
            type="text"
            id="headmaster"
            name="headmaster"
            value={formData.headmaster}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="contactEmail">Contact Email</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="motto">Motto</label>
          <input
            type="text"
            id="motto"
            name="motto"
            value={formData.motto}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="termType">Select Current Term</label>
          <select
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
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="termBegins">Term Begins</label>{" "}
          <input
            type="date"
            id="termBegins"
            name="termBegins"
            value={formData.termBegins}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="termEnds">Term Ended</label>
          <input
            type="date"
            id="termEnds"
            name="termEnds"
            value={formData.termEnds}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="nextTermBegin">Next Term Begins</label>
          <input
            type="date"
            id="nextTermBegin"
            name="nextTermBegin"
            value={formData.nextTermBegin}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Select Input Fields</label>
          <div className={styles.checkboxItems}>
            {checkboxItems.map((item) => (
              <div key={item}>
                <input
                  type="checkbox"
                  id={item}
                  name={item}
                  checked={formData.input.includes(item)}
                  onChange={handleChange}
                />
                <label htmlFor={item}>{item}</label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update School"}
        </button>
      </form>
    </div>
  );
};

export default UpdateSchool;
