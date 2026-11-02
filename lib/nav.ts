export type NavIconName =
  | "LayoutDashboard"
  | "Users"
  | "GraduationCap"
  | "BookOpen"
  | "Layers"
  | "ClipboardCheck"
  | "FileBarChart"
  | "Bell"
  | "Settings"
  | "History"
  | "UserCircle"
  | "BookMarked";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Students", href: "/admin/students", icon: "GraduationCap" },
  { label: "Teachers", href: "/admin/teachers", icon: "Users" },
  { label: "Classes", href: "/admin/classes", icon: "Layers" },
  { label: "Subjects", href: "/admin/subjects", icon: "BookOpen" },
  { label: "Attendance", href: "/admin/attendance", icon: "ClipboardCheck" },
  { label: "Reports", href: "/admin/reports", icon: "FileBarChart" },
  { label: "Notifications", href: "/admin/notifications", icon: "Bell" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];

export const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: "LayoutDashboard" },
  { label: "My Classes", href: "/teacher/classes", icon: "Layers" },
  { label: "Add Student", href: "/teacher/add-student", icon: "GraduationCap" },
  { label: "My Subjects", href: "/teacher/subjects", icon: "BookOpen" },
  { label: "Mark Attendance", href: "/teacher/mark-attendance", icon: "ClipboardCheck" },
  { label: "Attendance History", href: "/teacher/attendance-history", icon: "History" },
  { label: "Reports", href: "/teacher/reports", icon: "FileBarChart" },
  { label: "Students", href: "/teacher/students", icon: "GraduationCap" },
  { label: "Profile", href: "/teacher/profile", icon: "UserCircle" },
];

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: "LayoutDashboard" },
  { label: "My Attendance", href: "/student/attendance", icon: "ClipboardCheck" },
  { label: "Subjects", href: "/student/subjects", icon: "BookMarked" },
  { label: "Attendance History", href: "/student/history", icon: "History" },
  { label: "Notifications", href: "/student/notifications", icon: "Bell" },
  { label: "Profile", href: "/student/profile", icon: "UserCircle" },
];
