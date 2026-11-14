// "use client";
// import React, { useRef } from "react";
// import { useReactToPrint } from "react-to-print";
// import styles from "./printout.module.css";
// import Image from "next/image";

// const UkpSecondary = ({
//   student,
//   subjects,
//   formTeacherName,
//   attendanceList,
//   psychomotor,
//   totalStudents,
//   effectiveTraits,
//   headOfSchoolRemark,
//   formTeacherRemark,
//   subjectPosition,
//   selectedTerm,
//   school,
// }) => {
//   const contentToPrint = useRef(null);
//   const handlePrint = useReactToPrint({
//     documentTitle: "Print This Document",
//     content: () => contentToPrint.current,
//     onBeforePrint: () => console.log("before printing..."),
//     onAfterPrint: () => console.log("after printing..."),
//     removeAfterPrint: true,
//   });

//   const calculateTotal = (subject) => {
//     const total =
//       (parseFloat(subject.firstCA) || 0) +
//       (parseFloat(subject.secondCA) || 0) +
//       (parseFloat(subject.assignment) || 0) +
//       (parseFloat(subject.project) || 0) +
//       (parseFloat(subject.exam) || 0);
//     return total;
//   };

//   const getGrade = (total) => {
//     if (total >= 80) return "A1"; // Distinction
//     if (total >= 70) return "B2"; // Excellent
//     if (total >= 65) return "B3"; // Good
//     if (total >= 60) return "C4"; // Credit
//     if (total >= 55) return "C5"; // Credit
//     if (total >= 50) return "C6"; // Credit
//     if (total >= 45) return "D7"; // Pass
//     if (total >= 40) return "E8"; // Fair
//     return "F9"; // Fail
//   };

//   const getComment = (total) => {
//     if (total >= 80) return "Distinction";
//     if (total >= 70) return "Excellent";
//     if (total >= 65) return "Very Good";
//     if (total >= 60) return "Credit";
//     if (total >= 55) return "Credit";
//     if (total >= 50) return "Credit";
//     if (total >= 45) return "Pass";
//     if (total >= 40) return "Fair";
//     return "Fail";
//   };

//   function getOrdinalSuffix(position) {
//     const j = position % 10;
//     const k = position % 100;
//     if (j === 1 && k !== 11) {
//       return `${position}st`;
//     }
//     if (j === 2 && k !== 12) {
//       return `${position}nd`;
//     }
//     if (j === 3 && k !== 13) {
//       return `${position}rd`;
//     }
//     return `${position}th`;
//   }

//   const countSubjectsPassed = () => {
//     return subjects.filter((subject) => calculateTotal(subject) >= 45).length;
//   };

//   const calculateTotalScoreObtained = () => {
//     return subjects.reduce(
//       (total, subject) => total + calculateTotal(subject),
//       0
//     );
//   };

//   const calculateAveragePercentage = () => {
//     const totalScoreObtained = calculateTotalScoreObtained();
//     return (totalScoreObtained / (subjects.length * 100)) * 100;
//   };

//   return (
//     <div className={styles.Container}>
//       <div className={styles.printoutContainer}>
//         <div className={styles.reportCard} ref={contentToPrint}>
//           <div className={styles.watermark}>
//             <Image
//               className={styles.img}
//               src={school.logo}
//               alt="logo"
//               height={400}
//               width={450}
//             />
//           </div>
//           <header className={styles.header}>
//             <div className={styles.logo}>
//               <div className={styles.imageContainer}>
//                 <Image src={school.logo} alt="logo" height={90} width={100} />
//               </div>
//             </div>
//             <div className={styles.headerContents}>
//               <h4>{school?.fullName && school.fullName.toUpperCase()}</h4>
//               <span>MOTTO: {school?.motto && school.motto.toUpperCase()}</span>
//               <p>ADDRESS: {school?.address && school?.address.toUpperCase()}</p>
//               <h4 className={styles.term}>
//                 REPORT SHEET FOR {selectedTerm} TERM, {student.academicYear}{" "}
//                 ACADEMIC SESSION
//               </h4>
//             </div>
//             <div className={styles.studentImage}>
//               <div className={styles.studentImageContainer}>
//                 <Image
//                   className={styles.img}
//                   src={student.image || "/img/noAvatar.png"}
//                   alt="logo"
//                   height={100}
//                   width={120}
//                 />
//               </div>
//             </div>
//           </header>
//           <section className={styles.studentInfo}>
//             <div className={styles.Info1}>
//               <h4 className={styles.navy}>STUDENT INFORMATION</h4>
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>Field</th>
//                     <th>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>Surname</td>
//                     <td>{student.surname?.toUpperCase()}</td>
//                   </tr>
//                   <tr>
//                     <td>Name</td>
//                     <td>{student.name?.toUpperCase()}</td>
//                   </tr>
//                   <tr>
//                     <td>Class</td>
//                     <td>{student.level?.toUpperCase()}</td>
//                   </tr>
//                   <tr>
//                     <td>Gender</td>
//                     <td>{student.gender?.toUpperCase()}</td>
//                   </tr>
//                   <tr>
//                     <td>Age</td>
//                     <td>{student.age}</td>
//                   </tr>
//                   <tr>
//                     <td>Reg No</td>
//                     <td>{student.registrationNo}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//             <div className={styles.Info2}>
//               <h4 className={styles.navy}>STUDENT SUMMARY</h4>
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>Metric</th>
//                     <th>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>Number of Subjects</td>
//                     <td>{subjects.length}</td>
//                   </tr>
//                   <tr>
//                     <td>Number of Subjects Passed</td>
//                     <td>{countSubjectsPassed()}</td>
//                   </tr>
//                   <tr>
//                     <td>Max Score Obtainable</td>
//                     <td>{subjects.length * 100}</td>
//                   </tr>
//                   <tr>
//                     <td>Total Score Obtained</td>
//                     <td>{calculateTotalScoreObtained()}</td>
//                   </tr>
//                   <tr>
//                     <td>Average Percentage</td>
//                     <td>{calculateAveragePercentage().toFixed(2)}%</td>
//                   </tr>
//                   <tr>
//                     <td>Students in Class</td>
//                     <td>{totalStudents}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//             <div className={styles.Info3}>
//               <h4 className={styles.navy}>ATTENDANCE</h4>
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>Days</th>
//                     <th>Attendance</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>School Opened</td>
//                     <td>{attendanceList?.schoolOpenDays}</td>
//                   </tr>
//                   <tr>
//                     <td>Absent</td>
//                     <td>{attendanceList?.daysAbsent}</td>
//                   </tr>
//                   <tr>
//                     <td>Present</td>
//                     <td>{attendanceList?.daysPresent}</td>
//                   </tr>
//                 </tbody>
//               </table>
//               <p>
//                 <h4>TERM BEGINS:</h4>
//                 <span>
//                   On{" "}
//                   {
//                     school?.termDates?.find(
//                       (term) => term?.termType == selectedTerm
//                     )?.termBegins
//                   }
//                 </span>
//               </p>
//               <p>
//                 <h4>TERM ENDED:</h4>
//                 <span>
//                   On{" "}
//                   {
//                     school?.termDates?.find(
//                       (term) => term?.termType == selectedTerm
//                     )?.termEnds
//                   }
//                 </span>
//               </p>
//               <p>
//                 <h4>NEXT TERM BEGINS:</h4>
//                 <span>
//                   On{" "}
//                   {
//                     school?.termDates?.find(
//                       (term) => term?.termType === selectedTerm
//                     )?.nextTermBegin
//                   }
//                 </span>{" "}
//               </p>
//             </div>
//           </section>
//           <h4 className={styles.performanceh4}>
//             subject performance (cognitive domain)
//           </h4>
//           <section className={styles.grades}>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th>Subjects</th>
//                   <th>CA 1</th>
//                   <th>CA 2</th>
//                   <th>Ass</th>
//                   <th>Project</th>
//                   <th>Exam</th>
//                   <th>Total Score</th>
//                   <th>Lowest Score</th>
//                   <th>Highest Score</th>
//                   <th>Grade</th>
//                   <th>Comment</th>
//                   <th>Subject Position</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {subjects.map((subject, index) => {
//                   const total = calculateTotal(subject);
//                   const positionData = subjectPosition[subject.subjectName];
//                   const position = positionData?.position;
//                   const lowestScore = positionData?.lowestScore;
//                   const highestScore = positionData?.highestScore;

//                   return (
//                     <tr key={index}>
//                       <td>{subject.subjectName}</td>
//                       <td>{subject.firstCA}</td>
//                       <td>{subject.secondCA}</td>
//                       <td>{subject.assignment}</td>
//                       <td>{subject.project}</td>
//                       <td>{subject.exam}</td>
//                       <td>{total}</td>
//                       <td>{lowestScore}</td>
//                       <td>{highestScore}</td>
//                       <td>{getGrade(total)}</td>
//                       <td>{getComment(total)}</td>
//                       <td>{getOrdinalSuffix(position)}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </section>

//           <section className={styles.effectiveTriats}>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th>Psychomotor</th>
//                   <th>Ratings</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {psychomotor.map((row) => (
//                   <tr key={row.id}>
//                     <td>{row.trait}</td>
//                     <td>{row.rating}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th>Effective Traits</th>
//                   <th>Ratings</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {effectiveTraits.map((row) => (
//                   <tr key={row.id}>
//                     <td>{row.trait}</td>
//                     <td>{row.rating}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th>Range</th>
//                   <th>Grade</th>
//                   <th>Meaning</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td>0 - 39</td>
//                   <td>F9</td>
//                   <td>Fail</td>
//                 </tr>
//                 <tr>
//                   <td>40 - 44</td>
//                   <td>E8</td>
//                   <td>Fair</td>
//                 </tr>
//                 <tr>
//                   <td>45 - 49</td>
//                   <td>D7</td>
//                   <td>Pass</td>
//                 </tr>
//                 <tr>
//                   <td>50 - 54</td>
//                   <td>C6</td>
//                   <td>Credit</td>
//                 </tr>
//                 <tr>
//                   <td>55 - 59</td>
//                   <td>C5</td>
//                   <td>Credit</td>
//                 </tr>
//                 <tr>
//                   <td>60 - 64</td>
//                   <td>C4</td>
//                   <td>Credit</td>
//                 </tr>
//                 <tr>
//                   <td>65 - 69</td>
//                   <td>B3</td>
//                   <td>Very Good</td>
//                 </tr>
//                 <tr>
//                   <td>70 - 79</td>
//                   <td>B2</td>
//                   <td>Excellent</td>
//                 </tr>
//                 <tr>
//                   <td>80 - 100</td>
//                   <td>A1</td>
//                   <td>Distinction</td>
//                 </tr>
//               </tbody>
//             </table>
//           </section>
//           <footer className={styles.footer}>
//             <div>
//               <p>
//                 <h4>FORM TEACHER:</h4>
//                 <span>{formTeacherName}</span>{" "}
//               </p>
//               <p>
//                 <h4>{"FORM TEACHER'S COMMENTS:"}</h4>
//                 <span> {formTeacherRemark && formTeacherRemark}</span>
//               </p>
//               <p>
//                 <h4>
//                   {" "}
//                   {student?.level?.startsWith("j") ||
//                   student?.level?.startsWith("s")
//                     ? "PRINCIPAL:"
//                     : "HEAD MASTER:"}{" "}
//                 </h4>
//                 <span>{school?.principal && school.principal}</span>
//               </p>
//               <p>
//                 <h4>
//                   {" "}
//                   {student?.level?.startsWith("j") ||
//                   student?.level?.startsWith("s")
//                     ? "PRINCIPAL'S COMMENTS:"
//                     : "HEAD MASTER'S COMMENTS:"}
//                 </h4>
//                 <span>{headOfSchoolRemark} </span>
//               </p>
//               <p>
//                 <h4>
//                   {student?.level?.startsWith("j") ||
//                   student?.level?.startsWith("s")
//                     ? "PRINCIPALS SIGNATURE:"
//                     : "HEAD MASTERS SIGNATURE:"}
//                 </h4>

//                 <span className={styles.signature}>
//                   {" "}
//                   <img
//                     src="/img/signature.jpg"
//                     alt="img2"
//                     height={50}
//                     width={60}
//                     className={styles.img}
//                   />
//                   _____________________
//                 </span>
//               </p>
//             </div>
//           </footer>
//         </div>
//       </div>
//       <div className={styles.printButton}>
//         <button onClick={handlePrint}>Print</button>
//       </div>
//     </div>
//   );
// };

// export default UkpSecondary;
