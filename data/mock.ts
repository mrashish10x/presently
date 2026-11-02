import { mulberry32 } from "@/lib/utils";
import type {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  AttendanceRecord,
  AttendanceSessionSummary,
  NotificationItem,
  ActivityItem,
  WeeklyPoint,
  MonthlyPoint,
  AttendanceStatus,
} from "@/types";

const rand = mulberry32(42);

export const AVATAR_COLORS = [
  "#1F8460",
  "#B77A2C",
  "#2447A8",
  "#B34A3A",
  "#6B4FA0",
  "#0F7A8C",
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export const CLASS_NAMES = [
  "B.Tech IT 1st Year",
  "B.Tech IT 2nd Year",
  "B.Tech CSE 1st Year",
];
export const SECTIONS = ["A", "B"];

export const SUBJECT_LIST = [
  "Data Structures",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Mathematics",
  "Software Engineering",
];

const FIRST_NAMES = [
  "Aarav",
  "Priya",
  "Rahul",
  "Ananya",
  "Rohit",
  "Ishaan",
  "Kavya",
  "Vivaan",
  "Diya",
  "Aditya",
  "Meera",
  "Kabir",
  "Sanya",
  "Arjun",
  "Nisha",
  "Karan",
  "Pooja",
  "Yash",
  "Riya",
  "Dev",
  "Tanvi",
  "Aryan",
  "Simran",
  "Nikhil",
];
const LAST_NAMES = [
  "Sharma",
  "Singh",
  "Kumar",
  "Verma",
  "Yadav",
  "Gupta",
  "Mehta",
  "Reddy",
  "Iyer",
  "Nair",
  "Chauhan",
  "Joshi",
];

export const STUDENTS: Student[] = Array.from({ length: 24 }).map((_, i) => {
  const first = pick(FIRST_NAMES, i);
  const last = pick(LAST_NAMES, i + Math.floor(i / FIRST_NAMES.length));
  const name = `${first} ${last}`;
  const className = pick(CLASS_NAMES, Math.floor(i / 8));
  const section = pick(SECTIONS, i);
  const pct = Math.round(62 + rand() * 36);
  return {
    id: `STU-${1001 + i}`,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@stellar.edu.in`,
    avatarColor: pick(AVATAR_COLORS, i),
    className,
    section,
    rollNo: `${String(i + 1).padStart(2, "0")}`,
    attendancePct: pct,
    status: pct < 65 ? "inactive" : "active",
    phone: `9${Math.floor(100000000 + rand() * 899999999)}`,
    guardianName: `${pick(FIRST_NAMES, i + 5)} ${last}`,
    joinedOn: "2024-07-15",
  };
});

const TEACHER_NAMES = [
  "Dr. Amit Sharma",
  "Neha Singh",
  "Rahul Verma",
  "Dr. Sunita Rao",
  "Manish Tiwari",
  "Priyanka Das",
];

export const TEACHERS: Teacher[] = TEACHER_NAMES.map((name, i) => {
  const subjects = [pick(SUBJECT_LIST, i), pick(SUBJECT_LIST, i + 2)];
  return {
    id: `TCH-${201 + i}`,
    name,
    email: `${name
      .toLowerCase()
      .replace(/^dr\.\s*/, "")
      .replace(/\s+/g, ".")}@stellar.edu.in`,
    avatarColor: pick(AVATAR_COLORS, i + 2),
    subject: subjects[0],
    subjects,
    assignedClass: pick(CLASS_NAMES, i),
    status: "active",
    phone: `9${Math.floor(100000000 + rand() * 899999999)}`,
    joinedOn: "2022-06-01",
  };
});

export const CLASSES: SchoolClass[] = CLASS_NAMES.flatMap((cls, ci) =>
  SECTIONS.map((sec, si) => {
    const studentsInClass = STUDENTS.filter(
      (s) => s.className === cls && s.section === sec
    );
    const avgPct =
      studentsInClass.length > 0
        ? Math.round(
            studentsInClass.reduce((a, s) => a + s.attendancePct, 0) /
              studentsInClass.length
          )
        : Math.round(70 + rand() * 20);
    return {
      id: `CLS-${ci}${si}`,
      name: cls,
      section: sec,
      studentsCount: studentsInClass.length || 4,
      classTeacher: pick(TEACHER_NAMES, ci + si),
      attendancePct: avgPct,
    };
  })
);

export const SUBJECTS: Subject[] = SUBJECT_LIST.map((name, i) => ({
  id: `SUB-${100 + i}`,
  name,
  code: `${name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()}${101 + i}`,
  teacher: pick(TEACHER_NAMES, i),
  className: pick(CLASS_NAMES, i),
  status: "active" as const,
}));

// ---- Attendance records: last 20 weekdays x subjects (sampled) ----
function lastNWeekdays(n: number): string[] {
  const days: string[] = [];
  const d = new Date("2026-09-18T00:00:00Z");
  while (days.length < n) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      days.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() - 1);
  }
  return days.reverse();
}

export const RECENT_DATES = lastNWeekdays(20);

function statusForStudent(baseRate: number, r: number): AttendanceStatus {
  if (r < baseRate) return "present";
  if (r < baseRate + (1 - baseRate) * 0.6) return "absent";
  return "late";
}

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [];
RECENT_DATES.forEach((date, di) => {
  SUBJECT_LIST.slice(0, 4).forEach((subject, sj) => {
    STUDENTS.forEach((s, si) => {
      // not every subject meets for every class every day - simple filter
      if ((si + sj + di) % 3 === 2) return;
      const r = rand();
      const status = statusForStudent(s.attendancePct / 100, r);
      ATTENDANCE_RECORDS.push({
        id: `ATT-${date}-${subject}-${s.id}`.replace(/\s+/g, ""),
        date,
        className: s.className,
        section: s.section,
        subject,
        studentId: s.id,
        studentName: s.name,
        status,
      });
    });
  });
});

export const ATTENDANCE_SESSIONS: AttendanceSessionSummary[] = (() => {
  const map = new Map<string, AttendanceRecord[]>();
  ATTENDANCE_RECORDS.forEach((r) => {
    const key = `${r.date}|${r.className}|${r.section}|${r.subject}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return Array.from(map.entries())
    .map(([key, records], i) => {
      const [date, className, section, subject] = key.split("|");
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      const total = records.length;
      return {
        id: `SESSION-${i}`,
        date,
        className,
        section,
        subject,
        present,
        absent,
        late,
        total,
        percentage: total ? Math.round(((present + late) / total) * 100) : 0,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
})();

export const WEEKLY_ATTENDANCE: WeeklyPoint[] = (() => {
  const last7 = RECENT_DATES.slice(-7);
  return last7.map((date) => {
    const records = ATTENDANCE_RECORDS.filter((r) => r.date === date);
    const present = records.filter(
      (r) => r.status === "present" || r.status === "late"
    ).length;
    const absent = records.filter((r) => r.status === "absent").length;
    const d = new Date(date);
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      present,
      absent,
    };
  });
})();

export const MONTHLY_ATTENDANCE: MonthlyPoint[] = [
  { label: "Apr", attendance: 88 },
  { label: "May", attendance: 85 },
  { label: "Jun", attendance: 79 },
  { label: "Jul", attendance: 90 },
  { label: "Aug", attendance: 86 },
  { label: "Sep", attendance: 91 },
];

export const CLASS_WISE_ATTENDANCE = CLASSES.map((c) => ({
  label: `${c.name.replace("B.Tech ", "")} - ${c.section}`,
  attendance: c.attendancePct,
}));

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "N1",
    title: "Low attendance alert",
    description: "8 students have dropped below 75% attendance this month.",
    time: "2 hours ago",
    read: false,
    type: "warning",
  },
  {
    id: "N2",
    title: "Monthly report generated",
    description: "The August attendance report is ready to download.",
    time: "1 day ago",
    read: false,
    type: "success",
  },
  {
    id: "N3",
    title: "New teacher onboarded",
    description: "Priyanka Das has been added to the Mathematics department.",
    time: "2 days ago",
    read: true,
    type: "info",
  },
  {
    id: "N4",
    title: "Attendance not marked",
    description: "Operating Systems (CSE 1st Year) attendance is pending for today.",
    time: "3 days ago",
    read: true,
    type: "warning",
  },
];

export const ACTIVITY: ActivityItem[] = [
  {
    id: "A1",
    actor: "Dr. Amit Sharma",
    action: "marked attendance for",
    target: "Data Structures · IT 2nd Year",
    time: "10 min ago",
  },
  {
    id: "A2",
    actor: "Admin",
    action: "added a new student",
    target: "Tanvi Chauhan",
    time: "45 min ago",
  },
  {
    id: "A3",
    actor: "Neha Singh",
    action: "updated attendance for",
    target: "DBMS · IT 1st Year",
    time: "1 hour ago",
  },
  {
    id: "A4",
    actor: "Admin",
    action: "generated report for",
    target: "August 2026",
    time: "3 hours ago",
  },
  {
    id: "A5",
    actor: "Rahul Verma",
    action: "marked attendance for",
    target: "Computer Networks · CSE 1st Year",
    time: "5 hours ago",
  },
];

export function studentsByTeacher(teacherName: string) {
  const teacher = TEACHERS.find((t) => t.name === teacherName);
  if (!teacher) return STUDENTS.slice(0, 8);
  return STUDENTS.filter((s) => s.className === teacher.assignedClass);
}

export const CURRENT_ADMIN = {
  name: "Rekha Nambiar",
  email: "rekha.nambiar@stellar.edu.in",
  role: "Administrator",
  avatarColor: "#1F8460",
};

export const CURRENT_TEACHER = TEACHERS[0];

export const CURRENT_STUDENT = STUDENTS[0];

export const INSTITUTION = {
  name: "Stellar Institute of Technology",
  address: "Sector 62, Meerut, Uttar Pradesh",
  established: 2008,
  affiliation: "Dr. A.P.J. Abdul Kalam Technical University",
};
