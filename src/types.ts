export interface CarouselFeature {
  id: string;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  iconName: string; // Lucide icon reference
  benefits: string[];
}

export interface ClassSession {
  id: string;
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  time: string; // e.g., "10:00 AM"
  venue: string; // e.g., "Hall B"
}

export interface ClassSubject {
  id: string;
  name: string;
  code: string;
  instructor: string;
  room: string;
  scheduleTime: string;
  color: string;
  sessions?: ClassSession[]; // Rich multiple schedule occurrences
  duration?: string; // Course duration (30 min, 1 hr, 2 hrs, etc.)
}

export interface AttendanceRecord {
  id: string; // id
  date: string; // "YYYY-MM-DD" or "Week-Day"
  courseId: string;
  sessionId: string;
  status: "attended" | "absent" | "pending";
}

export interface AcademicConfig {
  semestersCount: number;
  activeSemester: string;
  expectedDays: string[]; // ["Monday", "Tuesday", ...]
  semesterDurationDays?: number; // e.g., 90
  semesterStartDate?: string; // "YYYY-MM-DD"
  semesterEndDate?: string; // "YYYY-MM-DD"
  examsStartDate?: string; // "YYYY-MM-DD"
  examsEndDate?: string; // "YYYY-MM-DD"
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DeadlineTask {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  subTasks?: SubTask[];
  difficulty?: "easy" | "medium" | "hard";
  estimatedHours?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface StudyTimerSession {
  id: string;
  subjectId: string;
  durationMinutes: number;
  date: string;
  focusScore: number; // 1-100
}

export interface MoodLog {
  timestamp: string;
  mood: "focused" | "relaxed" | "exhausted" | "anxious" | "excited";
  note: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "deadline" | "class" | "streak" | "guardian" | "general";
  isRead: boolean;
  timestamp: string; // human-readable, e.g. "Just now", "2 hours ago"
  targetTab: "home" | "class" | "deadline" | "study" | "guardian" | "mood" | "streak" | "theme";
}

