import {
  LayoutDashboard,
  RefreshCcw,
  ListChecks,
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Update School", href: "/update-school", icon: RefreshCcw },
  { label: "Task", href: "/task", icon: ListChecks },

  { section: "Results" },
  { label: "Manage Result", href: "/manage-result", icon: FileEdit },
  { label: "Print Result", href: "/print-result", icon: Printer },
  { label: "Result Availability", href: "/result-availability", icon: EyeOff },
  { label: "Student Performance", href: "/student-performance", icon: TrendingUp },
  { label: "Review Result", href: "/review-result", icon: ScanEye },
  { label: "Remark", href: "/remark", icon: PenLine },

  { section: "School setup" },
  { label: "Assign Class", href: "/assign-class", icon: ClipboardCheck },
  { label: "Add Subject", href: "/add-subject", icon: BookPlus },
  { label: "Import Students", href: "/import-students", icon: UserPlus2 },
  { label: "Add Student", href: "/add-student", icon: UserPlus2 },
  { label: "Add User", href: "/add-user", icon: Users },

  { section: "Access" },
  { label: "Student Credential", href: "/student-credential", icon: KeyRound },
  { label: "Admin", href: "/admin", icon: UserCog },
  { label: "Teachers", href: "/teachers", icon: Presentation },
  { label: "Students", href: "/students", icon: Users2 },
];

export const studentNav = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Result", href: "/student/result", icon: ShieldCheck },
  { label: "Task", href: "/student/task", icon: ListChecks },
];
