"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner/Spinner";
import styles from "./Payment.module.css";

const feeOptions = [
  "Previous term outstanding",
  "After school care",
  "Uniform (Primary)",
  "Uniform (Secondary)",
  "Sport wear (Primary)",
  "Wednesday wear (Primary)",
  "Wednesday wear (Secondary)",
  "Friday wear",
  "Cardigan",
  "Bowtie/Tie (Primary)",
  "Bowtie/Tie (Secondary)",
  "Discount",
  "Hijab",
  "Cap",
  "Blazers",
  "Track Suit",
  "Club",
  "School bus",
  "Tuition fee",
  "Tuition fee (JS1 - JS2)",
  "Tuition fee (JS3)",
  "Tuition fee (SS1 - SS2)",
  "Tuition fee (SS3)",
  "Tuition fee (Reception 1)",
  "Tuition fee (Reception 2)",
  "Tuition fee (Nursery1)",
  "Tuition fee (Nursery2)",
  "Tuition fee (Grade1 - Grade4)",
  "Tuition fee (Grade5)",
  "School lesson (Reception 1 - Grade4)",
  "School lesson (Grade5)",
  "School lesson (JS1 - SS3)",
  "Tuition fee (JS1 - JS2) 3rd term",
  "Tuition fee (JS3) 3rd term",
  "Tuition fee (SS1 - SS2) 3rd term",
  "Tuition fee (SS3) 3rd term",
  "Tuition fee (Reception 1) 3rd term",
  "Tuition fee (Reception 2) 3rd term",
  "Tuition fee (Nursery1) 3rd term",
  "Tuition fee (Nursery2) 3rd term",
  "Tuition fee (Grade1 - Grade4) 3rd term",
  "Tuition fee (Grade5) 3rd term",
];

const SchoolFeeManager = () => {
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [creating, setCreating] = useState(false);
  const [fees, setFees] = useState([]);

  const { data: session, status: sessionStatus } = useSession();
  const [isFetching, setIsFetching] = useState(false);

  const fetchFees = async () => {
    try {
      setIsFetching(true);
      const { data } = await axios.get("/api/fees", {
        params: { schoolId: session.schoolId },
      });
      setFees(data);
    } catch (error) {
      console.error("Failed to fetch fees:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (session?.schoolId) {
      fetchFees();
    }
  }, [session?.schoolId]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.price === "") return;

    const cleanedFees = [
      { name: formData.name, price: parseFloat(formData.price) },
    ];

    try {
      setCreating(true);
      await axios.post("/api/fees", {
        schoolId: session.schoolId,
        fees: cleanedFees,
      });
      await fetchFees();
      setFormData({ name: "", price: "" });
    } catch (error) {
      console.error("Failed to create/update fees:", error);
    } finally {
      setCreating(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  }

  return (
    <div className={styles.payment}>
      <h1 className="text-white">Manage School Fees</h1>

      <div className={styles.selectContainer}>
        <select
          value={formData.name}
          onChange={(e) => handleFormChange("name", e.target.value)}
          required
        >
          <option value="" disabled hidden>
            Select Fee Type
          </option>
          {[...feeOptions].sort().map((fee) => (
            <option key={fee} value={fee}>
              {fee}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={(e) => handleFormChange("price", e.target.value)}
          required
        />
        <button onClick={handleSubmit} type="submit" disabled={creating}>
          {creating ? "Saving..." : "Save"}
        </button>
      </div>

      <div className={styles.studentTableWrapper}>
        <table className={styles.studentTable}>
          <thead>
            <tr>
              <th>No</th>
              <th>Fee Name</th>
              <th>Price</th>
            </tr>
          </thead>
          {isFetching ? (
            <p>Getting Fees</p>
          ) : (
            <tbody>
              {[...fees]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((fee, index) => (
                  <tr key={fee.id}>
                    <td>{index + 1}</td>
                    <td>{fee.name}</td>
                    <td>{fee.price.toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default SchoolFeeManager;
