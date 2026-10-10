"use client";
import { usePathname, useRouter } from "next/navigation";
import styles from "./navbar.module.css";
import { FaPowerOff } from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa6";
import { MdAddTask } from "react-icons/md";
import { VscDashboard } from "react-icons/vsc";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const logOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("studentData");
    router.push("/");
  };

  const handleNavigation = (event, path) => {
    event.preventDefault();
    router.push(path);
  };

  // Hide the Navbar if the pathname contains "/result/"
  const hideNavbar =
    pathname.includes("/result") || pathname.includes("/login");


  return (
    <>
      {!hideNavbar && (
        <div className={styles.header}>
          <section className={styles.listContainer}>
            <li
              onClick={(event) => handleNavigation(event, "/student/dashboard")}
            >
              <a
                className={`${styles.nav} ${
                  pathname === "/student/dashboard" && styles.active
                }`}
                href="/student/dashboard"
              >
                <VscDashboard className={styles.icon} />
                <span>Dashboard</span>
              </a>
            </li>
            <li onClick={(event) => handleNavigation(event, "/student/result")}>
              <a
                className={`${styles.nav} ${
                  pathname === "/student/result" && styles.active
                }`}
                href="/student/result"
              >
                <FaFilePdf className={styles.icon} />
                <span>Result</span>
              </a>
            </li>

            <li onClick={(event) => handleNavigation(event, "/student/task")}>
              <a
                className={`${styles.nav} ${
                  pathname === "/student/task" && styles.active
                }`}
                href="/student/task"
              >
                <MdAddTask className={styles.icon} />
                <span>Task</span>
              </a>
            </li>

            <li onClick={logOut}>
              <a className={styles.nav}>
                <FaPowerOff className={styles.icon} />
                <span>Log Out</span>
              </a>
            </li>
          </section>
        </div>
      )}
    </>
  );
};

export default Navbar;
