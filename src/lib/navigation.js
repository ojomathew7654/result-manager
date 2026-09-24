import {
  LayoutDashboard,
  RefreshCcw,
  ListChecks,
  CalendarCheck,
  FileEdit,
  Printer,
  EyeOff,
  TrendingUp,
  ScanEye,
  PenLine,
  ClipboardCheck,
  UserPlus2,
  Users,
  UserCog,
  KeyRound,
  ShieldCheck,
  BookPlus,
  Presentation,
  Users2,
} from "lucide-react";

/**
 * Every admin/staff page lives here once. Add a page = add one entry;
 * the sidebar, breadcrumbs, and any "what's next" links read from this list.
 */
export const adminNav = [
  { section: "Overview" },
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Update School", href: "/admin/update-school", icon: RefreshCcw },
  { label: "Task", href: "/admin/task", icon: ListChecks },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },

  { section: "Results" },
  { label: "Manage Result", href: "/admin/manage-result", icon: FileEdit },
  { label: "Print Result", href: "/admin/print-result", icon: Printer },
  { label: "Result Availability", href: "/admin/result-availability", icon: EyeOff },
  { label: "Student Performance", href: "/admin/student-performance", icon: TrendingUp },
  { label: "Review Result", href: "/admin/review", icon: ScanEye },
  { label: "Remark", href: "/admin/comment", icon: PenLine },

  { section: "School setup" },
  { label: "Assign Class", href: "/admin/assign-class", icon: ClipboardCheck },
  { label: "Add Subject", href: "/admin/new-subject", icon: BookPlus },
  { label: "Import Students", href: "/admin/import-students", icon: UserPlus2 },
  { label: "Add Student", href: "/admin/register-students", icon: UserPlus2 },
  { label: "Add User", href: "/admin/register", icon: Users },

  { section: "Access" },
  { label: "Student Credential", href: "/admin/credential", icon: KeyRound },
  { label: "Admin", href: "/admin/users", icon: UserCog },
  { label: "Teachers", href: "/admin/teachers", icon: Presentation },
  {
    label: "Students",
    href: "/admin/primary",
    icon: Users2,
    children: [
      { label: "Primary", href: "/admin/primary" },
      { label: "Secondary", href: "/admin/secondary" },
    ],
  },
];

export const studentNav = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Result", href: "/student/result", icon: ShieldCheck },
  { label: "Task", href: "/student/task", icon: ListChecks },
];
