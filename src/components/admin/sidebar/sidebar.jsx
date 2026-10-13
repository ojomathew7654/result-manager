"use client";
import { usePathname, useRouter } from "next/navigation";
import styles from "./sidebar.module.css";
import { useContext, useEffect, useState } from "react";
import {
  MdFamilyRestroom,
  MdExpandMore,
  MdExpandLess,
  MdAddTask,
  MdOutlinePreview,
} from "react-icons/md";
import { FaKey, FaRegEdit, FaUserInjured } from "react-icons/fa";
import { IoMdPersonAdd, IoMdPrint } from "react-icons/io";
import { SiLevelsdotfyi } from "react-icons/si";
import { MdAssignmentTurnedIn } from "react-icons/md";
import { IoDocumentsSharp, IoHome } from "react-icons/io5";
import { RiDashboard2Line } from "react-icons/ri";
import { signOut, useSession } from "next-auth/react";
import { CgUnavailable } from "react-icons/cg";
import { GrUpdate, GrUserAdmin } from "react-icons/gr";
import { Context } from "@/components/context/Context";
import Link from "next/link";

const Sidebar = () => {
  const pathname = usePathname();
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const [mounted, setMounted] = useState(false);
  const { sidebarOpen, dispatch } = useContext(Context);
  const router = useRouter();

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role === "USER") {
        signOut();
        router.push("/");
      } else {
        setMounted(true);
      }
    }
  }, [sessionStatus, session, router]);

  useEffect(() => {
    const storedSidebarOpen = localStorage.getItem("sidebarOpen") === "true";
    if (storedSidebarOpen !== sidebarOpen) {
      dispatch({ type: "TOGGLE_SIDEBAR" });
    }
  }, []);

  const closeSidebar = () => {
    if (sidebarOpen) {
      dispatch({ type: "TOGGLE_SIDEBAR" });
    }
  };

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  const toggleStudentsDropdown = () => {
    setStudentsDropdownOpen(!studentsDropdownOpen);
  };

  if (!mounted) return <h1></h1>;
  const navLinks = [
    {
      path: "/admin",
      icon: <RiDashboard2Line className={styles.icon} />,
      label: "Dashboard",
    },
    {
      path: "/admin/update-school",
      icon: <GrUpdate className={styles.icon} />,
      label: "Update School",
    },
    {
      path: "/admin/task",
      icon: <MdAddTask className={styles.icon} />,
      label: "Task",
    },
    {
      path: "/admin/manage-result",
      icon: <IoDocumentsSharp className={styles.icon} />,
      label: "Manage Result",
    },
    {
      path: "/admin/print-result",
      icon: <IoMdPrint className={styles.icon} />,
      label: "Print Result",
    },
    {
      path: "/admin/move_student",
      icon: <IoMdPrint className={styles.icon} />,
      label: "moveToNextClass",
    },
    {
      path: "/admin/result-availability",
      icon: <CgUnavailable className={styles.icon} />,
      label: "Result Availability",
    },
    {
      path: "/admin/student-performance",
      icon: <SiLevelsdotfyi className={styles.icon} />,
      label: "Student Performance",
    },
    {
      path: "/admin/review",
      icon: <MdOutlinePreview className={styles.icon} />,
      label: "Review Result",
    },
    {
      path: "/admin/comment",
      icon: <FaRegEdit className={styles.icon} />,
      label: "Remark",
    },
    {
      path: "/admin/assign-class",
      icon: <MdAssignmentTurnedIn className={styles.icon} />,
      label: "Assign Class",
    },
    {
      path: "/admin/new-subject",
      icon: <IoMdPersonAdd className={styles.icon} />,
      label: "Add Subject",
    },
    {
      path: "/admin/import-students",
      icon: <IoMdPersonAdd className={styles.icon} />,
      label: "Import Students",
    },
    {
      path: "/admin/register-students",
      icon: <IoMdPersonAdd className={styles.icon} />,
      label: "Add Student",
    },
    {
      path: "/admin/register",
      icon: <IoMdPersonAdd className={styles.icon} />,
      label: "Add User",
    },
    {
      path: "/admin/credential",
      icon: <FaKey className={styles.icon} />,
      label: "Student Credential",
    },
    {
      path: "/admin/users",
      icon: <GrUserAdmin className={styles.icon} />,
      label: "Admin",
    },
    {
      path: "/admin/teachers",
      icon: <FaUserInjured className={styles.icon} />,
      label: "Teachers",
    },
  ];
  return (
    <div
      className={`${styles.sidebarContainer} ${sidebarOpen ? styles.open : ""}`}
    >
      <div className={styles.container}>
        <section className={styles.listContainer}>
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                className={`${styles.nav} ${
                  pathname === link.path ? styles.active : ""
                }`}
                passHref
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <div
              className={`${styles.nav} ${
                studentsDropdownOpen ? styles.active : ""
              }`}
              onClick={toggleStudentsDropdown}
            >
              <MdFamilyRestroom className={styles.icon} />
              <span>Students</span>
              {studentsDropdownOpen ? (
                <MdExpandLess className={styles.dropdownIcon} />
              ) : (
                <MdExpandMore className={styles.dropdownIcon} />
              )}
            </div>
            {studentsDropdownOpen && (
              <ul className={styles.dropdownList}>
                <li>
                  <Link href="/admin/primary" passHref>
                    <div
                      className={`${styles.nav} ${
                        pathname.includes("/admin/primary")
                          ? styles.primary
                          : ""
                      }`}
                    >
                      <span>Primary</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/secondary" passHref>
                    <div
                      className={`${styles.nav} ${
                        pathname.includes("/admin/secondary")
                          ? styles.primary
                          : ""
                      }`}
                    >
                      <span>Secondary</span>
                    </div>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </section>
      </div>
    </div>
  );
};

export default Sidebar;
