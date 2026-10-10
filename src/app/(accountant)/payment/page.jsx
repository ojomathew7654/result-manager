"use client";
import Spinner from "@/components/Spinner/Spinner";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Payment.module.css";
import Link from "next/link";

const Payment = () => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [paymentsInput, setPaymentsInput] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [studentPayments, setStudentPayments] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fees, setFees] = useState([]);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState({});

  useEffect(() => {
    if (session?.schoolId) {
      const fetchSchoolData = async () => {
        try {
          // await axios.delete("/api/payment");
          const res = await axios.get("/api/fees", {
            params: { schoolId: session?.schoolId },
          });
          setFees(res.data);
          setPaymentsInput(res.data.map((item) => item.name));
          const { data } = await axios.get(`/api/school/${session.schoolId}`);
          setSchoolClasses(data.classes?.sort() || []);
        } catch (error) {
          console.error("Error fetching school data:", error);
        }
      };
      fetchSchoolData();
    }
  }, [session?.schoolId]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session.role !== "ACCOUNTANT") {
      signOut();
      router.push("/");
    }
  }, [sessionStatus, session, router]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/");
    }
  }, [sessionStatus, router]);

  const fetchStudentData = async (term, cls, year) => {
    if (!term || !cls || !year) return;
    try {
      setLoading(true);
      const encodedYear = encodeURIComponent(year);
      const { data } = await axios.get(
        `/api/student/class/result/${term}-${session.schoolId}-${encodedYear}-${cls}`,
      );
      setStudents(
        data.map((student) => {
          const termData = student.terms.find((t) => t.termType === term);
          return { ...student, currentTerm: termData?.subjects || [] };
        }),
      );
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = async (setter, value, type) => {
    setter(value);
    const nextValues = {
      termType: type === "term" ? value : termType,
      selectedClass: type === "class" ? value : selectedClass,
      academicYear: type === "year" ? value : academicYear,
    };
    await fetchStudentData(
      nextValues.termType,
      nextValues.selectedClass,
      nextValues.academicYear,
    );
  };

  const handlePaymentChange = (studentId, key, value) => {
    setStudentPayments((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: value,
      },
    }));
  };

  const handleTogglePaymentItem = (studentId, itemName, add) => {
    setSelectedPaymentItems((prev) => ({
      ...prev,
      [studentId]: "", // reset select to default after each selection
    }));

    if (itemName === "__REMARK__") {
      setStudentPayments((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          remark: add ? "" : undefined,
        },
      }));
      return;
    }

    if (add) {
      const fee = fees.find((f) => f.name === itemName);
      const price = fee ? fee.price : 0;
      setStudentPayments((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          items: {
            ...prev[studentId]?.items,
            [itemName]: price,
          },
        },
      }));
    } else {
      setStudentPayments((prev) => {
        const updatedItems = { ...prev[studentId]?.items };
        delete updatedItems[itemName];

        return {
          ...prev,
          [studentId]: {
            ...prev[studentId],
            items: updatedItems,
          },
        };
      });
    }
  };

  const handleAmountChange = (studentId, item, amount) => {
    setStudentPayments((prev) => {
      const current = prev[studentId] || {};
      const items = current.items || {};
      items[item] = amount;
      return {
        ...prev,
        [studentId]: {
          ...current,
          items,
        },
      };
    });
  };

  const submitPayment = async (studentId) => {
    const data = studentPayments[studentId];

    const EXCLUDED_ITEMS = ["Previous term outstanding", "Discount"];
    const hasItems = data?.items && Object.keys(data.items).length > 0;
    const hasRealPayments =
      hasItems &&
      Object.entries(data.items).some(
        ([item, amount]) =>
          !EXCLUDED_ITEMS.includes(item) && data.items[item] !== undefined,
      );
    const isRemarkOnly = data?.remark && !hasRealPayments;

    if (!isRemarkOnly && hasRealPayments) {
      if (!data?.date || !data?.method) {
        alert("Please fill out payment date and method for actual payments.");
        return;
      }
    }
    const payload = {
      studentId,
      schoolId: session?.schoolId,
      termType,
      items: hasItems
        ? Object.entries(data.items)
            .filter(([_, amount]) => typeof amount === "number")
            .map(([type, amount]) => ({
              type,
              amount,
              ...(EXCLUDED_ITEMS.includes(type)
                ? {}
                : { date: data.date, method: data.method }),
            }))
        : [],
      remark: data.remark || undefined,
    };

    try {
      setSubmitting(true);
      const { data } = await axios.post("/api/payment", payload);
      if (data.status === 400) {
        alert(data.message);
        setSubmitting(false);
        return;
      }
      alert(`Payment recorded successfully.`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <h1 className="waitH1 h50">
        <Spinner /> Please wait...
      </h1>
    );
  }

  return (
    <div className={styles.payment}>
      <h1 className="text-white">Please select academic year, term and class</h1>

      <div className={styles.selectContainer}>
        <select
          value={academicYear}
          onChange={(e) =>
            handleSelectChange(setAcademicYear, e.target.value, "year")
          }
        >
          <option value="" disabled>
            Select academic year
          </option>
          <option value="2025/2026">2025/2026</option>
        </select>

        <select
          value={termType}
          onChange={(e) =>
            handleSelectChange(setTermType, e.target.value, "term")
          }
        >
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>

        <select
          value={selectedClass}
          onChange={(e) =>
            handleSelectChange(setSelectedClass, e.target.value, "class")
          }
        >
          <option value="" disabled>
            Select class
          </option>
          {schoolClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.studentTableWrapper}>
        {loading ? (
          <h1 className="waitH1">
            <Spinner /> Please wait...
          </h1>
        ) : (
          <table className={styles.studentTable}>
            <thead>
              <tr>
                <th>No</th>
                <th>Surname</th>
                <th>Name</th>
                <th>Payment Date</th>
                <th>Payment Item</th>
                <th>Items & Amounts</th>
                <th>Payment Method</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.surname}</td>
                  <td>{student.name}</td>
                  <td>
                    <input
                      type="date"
                      onChange={(e) =>
                        handlePaymentChange(student.id, "date", e.target.value)
                      }
                      className={styles.input}
                    />
                  </td>
                  <td>
                    <select
                      value={selectedPaymentItems[student.id] || ""}
                      onChange={(e) => {
                        setSelectedPaymentItems((prev) => ({
                          ...prev,
                          [student.id]: e.target.value,
                        }));
                        handleTogglePaymentItem(
                          student.id,
                          e.target.value,
                          true,
                        );
                      }}
                      className={styles.select}
                    >
                      <option value="" disabled hidden>
                        Select Item
                      </option>
                      {paymentsInput.map((item, idx) => (
                        <option key={idx} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__REMARK__">Remark</option>
                    </select>
                  </td>
                  <td>
                    <div className={styles.itemList}>
                      {studentPayments[student.id]?.items &&
                        Object.entries(studentPayments[student.id].items).map(
                          ([item, amount]) => (
                            <div key={item} className={styles.itemRow}>
                              {item}: {Number(amount).toLocaleString()}
                              <input
                                type="number"
                                value={amount}
                                placeholder="Amount"
                                className={styles.amountInput}
                                onChange={(e) =>
                                  handleAmountChange(
                                    student.id,
                                    item,
                                    parseFloat(e.target.value),
                                  )
                                }
                              />
                              <button
                                type="button"
                                className={styles.removeItemBtn}
                                onClick={() =>
                                  handleTogglePaymentItem(
                                    student.id,
                                    item,
                                    false,
                                  )
                                }
                              >
                                ❌
                              </button>
                            </div>
                          ),
                        )}
                      {studentPayments[student.id]?.remark !== undefined && (
                        <div className={styles.itemRow}>
                          Remark:
                          <textarea
                            placeholder="Enter reason for incomplete or discounted payment"
                            className={styles.remarkInput}
                            value={studentPayments[student.id].remark}
                            onChange={(e) =>
                              handlePaymentChange(
                                student.id,
                                "remark",
                                e.target.value,
                              )
                            }
                          />
                          <button
                            type="button"
                            className={styles.removeItemBtn}
                            onClick={() =>
                              handleTogglePaymentItem(
                                student.id,
                                "__REMARK__",
                                false,
                              )
                            }
                          >
                            ❌
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      onChange={(e) =>
                        handlePaymentChange(
                          student.id,
                          "method",
                          e.target.value,
                        )
                      }
                      className={styles.select}
                    >
                      <option value="">Payment Method</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK">BANK</option>
                      <option value="POS">POS</option>
                      <option value="NOT_PAID">Not Paid</option>
                    </select>
                  </td>
                  <td className={styles.actions}>
                    <button
                      disabled={submitting}
                      onClick={() => submitPayment(student.id)}
                      className={styles.submitBtn}
                    >
                      {submitting ? "Wait..." : "Submit"}
                    </button>

                    <button>
                      <Link
                        className={styles.link}
                        href={`/payment/${student.id}-${termType} `}
                      >
                        Edit
                      </Link>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Payment;
