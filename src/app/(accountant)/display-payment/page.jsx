"use client";
import Spinner from "@/components/Spinner/Spinner";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Payment.module.css";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";

const PaymentDisplay = () => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [termType, setTermType] = useState("");
  const [payments, setPayments] = useState([]);
  const [school, setSchool] = useState({});
  const [loading, setLoading] = useState(false);

  const contentToPrint = useRef(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    content: () => contentToPrint.current,
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  useEffect(() => {
    if (session?.schoolId) {
      const fetchSchoolData = async () => {
        try {
          const { data } = await axios.get(`/api/school/${session.schoolId}`);
          setSchoolClasses(data.classes?.sort() || []);
          setSchool(data || {});
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

  const fetchPayments = async (termType, selectedClass) => {
    if (!termType || !selectedClass) return;
    try {
      setLoading(true);
      const { data } = await axios.get("/api/payment", {
        params: {
          selectedClass,
          schoolId: session.schoolId,
          termType,
        },
      });
      setPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = async (event) => {
    setTermType(event.target.value);
    await fetchPayments(event.target.value, selectedClass);
  };

  const handleClassChange = async (e) => {
    const selectedClass = e.target.value;
    setSelectedClass(selectedClass);
    await fetchPayments(termType, e.target.value);
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
      <h1 className="text-white">View Student Payments</h1>

      <div className={styles.selectContainer}>
        <select value={termType} onChange={handleTermChange}>
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>

        <select value={selectedClass} onChange={handleClassChange}>
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
      {loading ? (
        <h1 className="waitH1">
          <Spinner /> Please wait...
        </h1>
      ) : (
        <>
          <div className={styles.printoutContainer}>
            <div className={styles.reportCard} ref={contentToPrint}>
              <div className={styles.watermark}>
                <Image
                  className={styles.img}
                  src={school?.logo}
                  alt="logo"
                  height={400}
                  width={400}
                />
              </div>
              <header className={styles.header}>
                <div className={styles.logo}>
                  <div className={styles.imageContainer}>
                    <Image
                      src={school?.logo}
                      alt="logo"
                      height={80}
                      width={100}
                    />
                  </div>
                </div>
                <div className={styles.headerContents}>
                  <h4>{school?.fullName && school.fullName.toUpperCase()}</h4>
                  <h5>BRISTISH AND MONTESSORI</h5>
                  <span>
                    MOTTO: {school?.motto && school.motto.toUpperCase()}
                  </span>
                  <h4 className={styles.term}>
                    {selectedClass} PAYMENT RECORD FOR {termType} TERM,
                    2024/2025 ACADEMIC SESSION
                  </h4>
                </div>
              </header>
              <div className={styles.studentTableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Surname</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Remark</th>
                      <th>Payable</th>
                      <th>Total Paid</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => {
                      if (payment.items.length === 0) {
                        return (
                          <tr key={payment.student.id}>
                            <td>{index + 1}</td>
                            <td>{payment.student?.surname}</td>
                            <td>{payment.student?.name}</td>
                            <td>
                              {payment.student?.level}{" "}
                              {payment.student?.variant}
                            </td>
                            <td
                              colSpan={4}
                              className="text-center text-gray-400 italic"
                            >
                              No payments
                            </td>
                            <td>{payment.remark || "—"}</td>
                            <td>#{Number(payment.payable).toLocaleString()}</td>
                            <td>
                              #{Number(payment.paidAmount).toLocaleString()}
                            </td>
                            <td>
                              # {Number(payment.balance).toLocaleString()}
                            </td>
                          </tr>
                        );
                      }

                      return payment.items.map((item, itemIndex) => (
                        <tr key={`${payment.student.id}-${itemIndex}`}>
                          {itemIndex === 0 && (
                            <>
                              <td rowSpan={payment.items.length}>
                                {index + 1}
                              </td>
                              <td rowSpan={payment.items.length}>
                                {payment.student?.surname}
                              </td>
                              <td rowSpan={payment.items.length}>
                                {payment.student?.name}
                              </td>
                              <td rowSpan={payment.items.length}>
                                {payment.student?.level}{" "}
                                {payment.student?.variant}
                              </td>
                            </>
                          )}
                          <td>{item.type}</td>
                          <td>{item.amount}</td>
                          <td>
                            {item.date
                              ? new Date(item.date).toLocaleDateString()
                              : "— —"}
                          </td>
                          <td>{item.method || "— —"}</td>
                          {itemIndex === 0 && (
                            <>
                              <td rowSpan={payment.items.length}>
                                {payment.remark || "—"}
                              </td>
                              <td rowSpan={payment.items.length}>
                                {payment.payable}
                              </td>
                              <td rowSpan={payment.items.length}>
                                {payment.paidAmount}
                              </td>
                              <td rowSpan={payment.items.length}>
                                {payment.balance}
                              </td>
                            </>
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.printButton}>
              <button onClick={handlePrint}>Print</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentDisplay;
