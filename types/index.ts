export type Role = "admin" | "teacher" | "student";

export type AttendanceStatus = "present" | "absent" | "late";

export type EntityStatus = "active" | "inactive";

export interface Student {
  id: string; // e.g. STU-1042
  name: string;
  email: string;
  avatarColor: string;
  className: string; // e.g. "B.Tech IT 2nd Year"
  section: string; // e.g. "A"
  rollNo: string;
  attendancePct: number;
  status: EntityStatus;
  phone: string;
  guardianName: string;
  joinedOn: string;
}

export interface Teacher {
  id: string; // TCH-204
  name: string;
  email: string;
  avatarColor: string;
  subject: string; // primary subject
  subjects: string[];
  assignedClass: string;
  status: EntityStatus;
  phone: string;
  joinedOn: string;
}

export interface SchoolClass {
  id: string;
  name: string; // "B.Tech IT 2nd Year"
  section: string;
  studentsCount: number;
  classTeacher: string;
  attendancePct: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  className: string;
  status: EntityStatus;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO date
  className: string;
  section: string;
  subject: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
}

export interface AttendanceSessionSummary {
  id: string;
  date: string;
  className: string;
  section: string;
  subject: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}

export interface WeeklyPoint {
  label: string;
  present: number;
  absent: number;
}

export interface MonthlyPoint {
  label: string;
  attendance: number;
}
