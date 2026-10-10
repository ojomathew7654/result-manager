import Link from "next/link";
import styles from "./page.module.css";
import {
  ArrowUpRight,
  ClipboardList,
  GraduationCap,
  PieChart,
  UserRound,
  Users2,
} from "lucide-react";

const roles = [
  {
    href: "/login",
    icon: Users2,
    title: "Staff & admin",
    description: "Enter scores, publish results, and manage classes, subjects and students.",
  },
  {
    href: "/student/login",
    icon: UserRound,
    title: "Students",
    description: "Check your results and school ID as soon as your teacher makes them available.",
  },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.brandPanel}>
        <div className={styles.brandMark}>
          <div className={styles.logo}>
            <GraduationCap size={22} strokeWidth={2.25} />
          </div>
          <p>Powered by As Code Elevate</p>
        </div>

        <div className={styles.pitch}>
          <p className={styles.eyebrow}>Result Manager</p>
          <h1>Report cards that write themselves.</h1>
          <p>
            One place for staff to record scores, track attendance and share results, and for
            students to see their standing the moment it&apos;s published.
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <ClipboardList size={18} />
            <strong>3,000</strong>
            <span>students currently enrolled</span>
          </div>
          <div className={styles.stat}>
            <PieChart size={18} />
            <strong>20</strong>
            <span>schools running this term</span>
          </div>
        </div>
      </section>

      <section className={styles.loginPanel}>
        <div className={styles.loginContent}>
          <p className={styles.loginEyebrow}>Sign in</p>
          <h2>Who&apos;s logging in?</h2>
          <p className={styles.loginSubtitle}>Choose your portal to continue.</p>

          <div className={styles.roles}>
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Link key={role.href} href={role.href} className={styles.role}>
                  <span className={styles.roleIcon}>
                    <Icon size={20} />
                  </span>
                  <span className={styles.roleCopy}>
                    <strong>{role.title}</strong>
                    <span>{role.description}</span>
                  </span>
                  <ArrowUpRight className={styles.arrow} size={18} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
