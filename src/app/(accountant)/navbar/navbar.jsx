"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link"; // Use next/link for internal routing
import styles from "./navbar.module.css";
import {
  FaCaretDown,
  FaCaretUp,
  FaPowerOff,
  FaMoneyBillWave,
  FaTimes,
} from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { AiOutlineFileSearch } from "react-icons/ai";
import { IoMenuSharp } from "react-icons/io5";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import axios from "axios";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [school, setSchool] = useState([]);
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const logOut = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    await signOut({ callbackUrl: "/" });
  };

  const handleNavigation = (event, path) => {
    event.preventDefault();
    router.push(path);
    setOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!session) return;
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data);
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };
    fetchSchoolData();
  }, [session]);
  const hideNavbar = pathname.includes("/print/");

  return (
    <>
      {!hideNavbar && (
        <nav className={styles.navbar}>
          {open && (
            <div
              className={styles.sidebarOverlay}
              onClick={() => setOpen(false)}
            ></div>
          )}

          <div className={styles.logo}>
            <div className={styles.imageContainer}>
              <Image
                src={school.logo || "/img/logo.jpeg"}
                alt="img2"
                height={60}
                width={70}
              />
            </div>
            <span> {school.name?.toUpperCase()}</span>
          </div>

          {/* Sidebar menu */}
          <div className={`${styles.hamburger} ${open ? styles.visible : ""}`}>
            <div className={styles.menuGroup}>
              <div className={styles.cancelBtn} onClick={() => setOpen(false)}>
                <FaTimes />
              </div>

              <li onClick={(event) => handleNavigation(event, "/create-fee")}>
                <Link
                  href="/create-fee"
                  className={`${styles.nav} ${
                    pathname === "/create-fee" ? styles.active : ""
                  }`}
                >
                  <FaMoneyBillWave className={styles.icon} />
                  <span>Create Fee</span>
                </Link>
              </li>

              <li onClick={(event) => handleNavigation(event, "/payment")}>
                <Link
                  href="/payment"
                  className={`${styles.nav} ${
                    pathname === "/payment" ? styles.active : ""
                  }`}
                >
                  <MdPayment className={styles.icon} />
                  <span>Make Payment</span>
                </Link>
              </li>

              <li
                onClick={(event) => handleNavigation(event, "/display-payment")}
              >
                <Link
                  href="/display-payment"
                  className={`${styles.nav} ${
                    pathname === "/display-payment" ? styles.active : ""
                  }`}
                >
                  <AiOutlineFileSearch className={styles.icon} />
                  <span>Display Payment</span>
                </Link>
              </li>
            </div>
          </div>

          <div className={styles.middleBar}>
            <div className={styles.adminContainer}>
              <div className={styles.desktop}>
                <span className="text-white">ACCOUNTANT: {session?.name.toUpperCase()} </span>
                <div className={styles.imageContainer}>
                  <Image
                    className={styles.img}
                    src={session?.imageUrl || "/img/admin.jpg"}
                    alt="img2"
                    height={60}
                    width={60}
                  />
                  <button onClick={logOut} className={styles.logoutButton}>
                    <FaPowerOff className={styles.icon} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
              <button
                onClick={toggleDropdown}
                className={styles.dropdownButton}
              >
                {dropdownOpen ? (
                  <FaCaretUp className={styles.icon} fontSize={35} />
                ) : (
                  <FaCaretDown className={styles.icon} fontSize={35} />
                )}
              </button>
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownItem}>
                    <Image
                      className={styles.img}
                      src={session?.imageUrl || "/img/admin.jpg"}
                      alt="img2"
                      height={60}
                      width={60}
                    />
                    <span>{session?.name.toUpperCase()}</span>
                  </div>
                  <button onClick={logOut} className={styles.logoutButton}>
                    <FaPowerOff className={styles.icon} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Right column with menu button */}
          <div className={styles.rightColumn}>
            <div className={styles.menuBtn} onClick={() => setOpen(true)}>
              <IoMenuSharp className={styles.icon} />
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
