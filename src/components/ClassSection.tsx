import { useState, useEffect, FormEvent } from "react";
import { ClassSubject, ClassSession, AttendanceRecord, AcademicConfig } from "../types";
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  User,
  MapPin,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Settings,
  Info,
  CalendarClock,
  Clock,
  ShieldAlert,
  Award
} from "lucide-react";

interface ClassSectionProps {
  classes: ClassSubject[];
  onAddClass: (newClass: ClassSubject) => void;
  onDeleteClass: (classId: string) => void;
  onUpdateClasses: (updatedClasses: ClassSubject[]) => void;
}

const AVAILABLE_COLORS = ["indigo", "amber", "rose", "teal", "sky", "emerald", "purple", "orange"];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ClassSection({
  classes,
  onAddClass,
  onDeleteClass,
  onUpdateClasses
}: ClassSectionProps) {
  // Academic Config State
  const [config, setConfig] = useState<AcademicConfig | null>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);

  // Onboarding Form States
  const [semestersCount, setSemestersCount] = useState<number>(2);
  const [activeSemester, setActiveSemester] = useState<string>("Semester 1");
  const [expectedDays, setExpectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

  // Semester Dates States
  const [semesterDurationDays, setSemesterDurationDays] = useState<number>(90);
  const [semesterStartDate, setSemesterStartDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [semesterEndDate, setSemesterEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });
  const [examsStartDate, setExamsStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 80);
    return d.toISOString().split("T")[0];
  });
  const [examsEndDate, setExamsEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });

  // Auto-calculate dates when start date or duration changes
  useEffect(() => {
    if (semesterStartDate && semesterDurationDays) {
      const d = new Date(semesterStartDate);
      d.setDate(d.getDate() + semesterDurationDays);
      setSemesterEndDate(d.toISOString().split("T")[0]);
      
      const examStart = new Date(semesterStartDate);
      examStart.setDate(examStart.getDate() + Math.max(1, semesterDurationDays - 10));
      setExamsStartDate(examStart.toISOString().split("T")[0]);
      
      const examEnd = new Date(semesterStartDate);
      examEnd.setDate(examEnd.getDate() + semesterDurationDays);
      setExamsEndDate(examEnd.toISOString().split("T")[0]);
    }
  }, [semesterStartDate, semesterDurationDays]);

  // Attendance Records State
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // UI Navigation States
  const [activeSubTab, setActiveSubTab] = useState<"attendance" | "courses" | "settings">("attendance");
  const [showAddCourseForm, setShowAddCourseForm] = useState<boolean>(false);

  // New Course States
  const [newCourseName, setNewCourseName] = useState<string>("");
  const [newCourseCode, setNewCourseCode] = useState<string>("");
  const [newCourseInstructor, setNewCourseInstructor] = useState<string>("");
  const [newCourseVenue, setNewCourseVenue] = useState<string>("");
  const [newCourseColor, setNewCourseColor] = useState<string>("indigo");
  const [newCourseDuration, setNewCourseDuration] = useState<string>("1 hour");

  // Load and Migrate on Mount
  useEffect(() => {
    // 1. Load Academic Settings
    const savedConfig = localStorage.getItem("awaji_academic_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as AcademicConfig;
        setConfig(parsed);
        setIsOnboarding(false);
        if (parsed.expectedDays) setExpectedDays(parsed.expectedDays);
        if (parsed.semesterDurationDays) setSemesterDurationDays(parsed.semesterDurationDays);
        if (parsed.semesterStartDate) setSemesterStartDate(parsed.semesterStartDate);
        if (parsed.semesterEndDate) setSemesterEndDate(parsed.semesterEndDate);
        if (parsed.examsStartDate) setExamsStartDate(parsed.examsStartDate);
        if (parsed.examsEndDate) setExamsEndDate(parsed.examsEndDate);
      } catch (e) {
        console.error("Error parsing academic config:", e);
      }
    }

    // 2. Load Attendance Records
    const savedAttendance = localStorage.getItem("awaji_attendance");
    if (savedAttendance) {
      try {
        setAttendance(JSON.parse(savedAttendance));
      } catch (e) {
        console.error("Error parsing attendance:", e);
      }
    }

    // 3. Migrate any legacy courses that don't have structured weekly sessions
    let hasLegacy = false;
    const migratedClasses = classes.map((cls) => {
      if (!cls.sessions || cls.sessions.length === 0) {
        hasLegacy = true;
        const autoSessions: ClassSession[] = [];
        const timeStr = cls.scheduleTime || "10:00 AM";
        const roomStr = cls.room || "Hall A";

        if (cls.scheduleTime.includes("Mon/Wed")) {
          const t = cls.scheduleTime.replace("Mon/Wed", "").trim() || "10:00 AM";
          autoSessions.push(
            { id: `${cls.id}-s1`, dayOfWeek: "Monday", time: t, venue: roomStr },
            { id: `${cls.id}-s2`, dayOfWeek: "Wednesday", time: t, venue: roomStr }
          );
        } else if (cls.scheduleTime.includes("Tue/Thu")) {
          const t = cls.scheduleTime.replace("Tue/Thu", "").trim() || "11:30 AM";
          autoSessions.push(
            { id: `${cls.id}-s1`, dayOfWeek: "Tuesday", time: t, venue: roomStr },
            { id: `${cls.id}-s2`, dayOfWeek: "Thursday", time: t, venue: roomStr }
          );
        } else if (cls.scheduleTime.includes("Wed")) {
          const t = cls.scheduleTime.replace("Wed", "").trim() || "2:00 PM";
          autoSessions.push({ id: `${cls.id}-s1`, dayOfWeek: "Wednesday", time: t, venue: roomStr });
        } else if (cls.scheduleTime.includes("Fri")) {
          const t = cls.scheduleTime.replace("Fri", "").trim() || "9:00 AM";
          autoSessions.push({ id: `${cls.id}-s1`, dayOfWeek: "Friday", time: t, venue: roomStr });
        } else {
          // Default fallback
          autoSessions.push({ id: `${cls.id}-s1`, dayOfWeek: "Monday", time: timeStr, venue: roomStr });
        }

        return { ...cls, sessions: autoSessions };
      }
      return cls;
    });

    if (hasLegacy) {
      onUpdateClasses(migratedClasses);
    }
  }, [classes]);

  // Handle Onboarding Completion
  const handleOnboardSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newConfig: AcademicConfig = {
      semestersCount,
      activeSemester,
      expectedDays,
      semesterDurationDays,
      semesterStartDate,
      semesterEndDate,
      examsStartDate,
      examsEndDate
    };
    setConfig(newConfig);
    localStorage.setItem("awaji_academic_config", JSON.stringify(newConfig));
    setIsOnboarding(false);
  };

  // Quick reset config
  const handleResetConfig = () => {
    if (confirm("Are you sure you want to re-configure your academic schedule calendar? Your attendance logs will remain, but week days and semesters will be reset.")) {
      setIsOnboarding(true);
    }
  };

  // Days expected checkboxes helper
  const handleToggleExpectedDay = (day: string) => {
    if (expectedDays.includes(day)) {
      setExpectedDays(expectedDays.filter((d) => d !== day));
    } else {
      setExpectedDays([...expectedDays, day]);
    }
  };

  // Convert Date YYYY-MM-DD to timezone-safe Day Name
  const getDayOfWeekName = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dateObj.getDay()];
  };

  const selectedDayName = getDayOfWeekName(selectedDate);

  // Find all scheduled sessions for the selected day of the week
  interface ScheduledSessionInfo {
    course: ClassSubject;
    session: ClassSession;
  }

  const todaySessions: ScheduledSessionInfo[] = [];
  classes.forEach((course) => {
    if (course.sessions) {
      course.sessions.forEach((sess) => {
        if (sess.dayOfWeek.toLowerCase() === selectedDayName.toLowerCase()) {
          todaySessions.push({ course, session: sess });
        }
      });
    }
  });

  // Track Attendance Status Handler
  const handleSetAttendance = (courseId: string, sessionId: string, status: "attended" | "absent") => {
    // Check if record exists for this date + session
    const existingIndex = attendance.findIndex(
      (a) => a.date === selectedDate && a.sessionId === sessionId
    );

    let updated: AttendanceRecord[] = [];
    if (existingIndex > -1) {
      updated = [...attendance];
      updated[existingIndex].status = status;
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: selectedDate,
        courseId,
        sessionId,
        status
      };
      updated = [...attendance, newRecord];
    }

    setAttendance(updated);
    localStorage.setItem("awaji_attendance", JSON.stringify(updated));
  };

  // Reset/Clear attendance for a session on a date
  const handleResetAttendance = (sessionId: string) => {
    const updated = attendance.filter(
      (a) => !(a.date === selectedDate && a.sessionId === sessionId)
    );
    setAttendance(updated);
    localStorage.setItem("awaji_attendance", JSON.stringify(updated));
  };

  // Create Course Helper
  const handleCreateCourse = (e: FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) return;

    const courseId = `class-${Date.now()}`;
    const newCourse: ClassSubject = {
      id: courseId,
      name: newCourseName,
      code: newCourseCode.toUpperCase(),
      instructor: newCourseInstructor || "TBA",
      room: newCourseVenue || "Online",
      scheduleTime: "Custom Weekly",
      color: newCourseColor,
      sessions: [], // empty sessions initially, can add immediately
      duration: newCourseDuration
    };

    onAddClass(newCourse);
    setNewCourseName("");
    setNewCourseCode("");
    setNewCourseInstructor("");
    setNewCourseVenue("");
    setShowAddCourseForm(false);
  };

  // Add Session to an existing course
  const [addingSessionToCourseId, setAddingSessionToCourseId] = useState<string | null>(null);
  const [newSessDay, setNewSessDay] = useState<string>("Monday");
  const [newSessTime, setNewSessTime] = useState<string>("10:00 AM");
  const [newSessVenue, setNewSessVenue] = useState<string>("");

  const handleAddSession = (courseId: string) => {
    if (!newSessTime.trim()) return;

    const updated = classes.map((c) => {
      if (c.id === courseId) {
        const currentSessions = c.sessions || [];
        const newSession: ClassSession = {
          id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          dayOfWeek: newSessDay,
          time: newSessTime,
          venue: newSessVenue || c.room || "TBA"
        };
        return {
          ...c,
          // Sync primary schedule representation for backward-compatibility
          room: newSessVenue || c.room,
          scheduleTime: `${newSessDay} ${newSessTime}`,
          sessions: [...currentSessions, newSession]
        };
      }
      return c;
    });

    onUpdateClasses(updated);
    setAddingSessionToCourseId(null);
    setNewSessVenue("");
  };

  // Delete specific session from course
  const handleDeleteSession = (courseId: string, sessionId: string) => {
    const updated = classes.map((c) => {
      if (c.id === courseId && c.sessions) {
        return {
          ...c,
          sessions: c.sessions.filter((s) => s.id !== sessionId)
        };
      }
      return c;
    });
    onUpdateClasses(updated);
  };

  // Attendance Analytics Calculations
  const markedRecords = attendance.filter((a) => a.status !== "pending");
  const totalAttended = markedRecords.filter((a) => a.status === "attended").length;
  const totalAbsent = markedRecords.filter((a) => a.status === "absent").length;
  const totalMarked = markedRecords.length;
  const attendanceRate = totalMarked > 0 ? Math.round((totalAttended / totalMarked) * 100) : 0;

  // Visual Styling Maps
  const getColorClasses = (c: string) => {
    switch (c) {
      case "indigo":
        return "bg-indigo-50/70 border-indigo-100 text-indigo-900 hover:border-indigo-300";
      case "amber":
        return "bg-amber-50/70 border-amber-100 text-amber-900 hover:border-amber-300";
      case "rose":
        return "bg-rose-50/70 border-rose-100 text-rose-900 hover:border-rose-300";
      case "teal":
        return "bg-teal-50/70 border-teal-100 text-teal-900 hover:border-teal-300";
      case "sky":
        return "bg-sky-50/70 border-sky-100 text-sky-900 hover:border-sky-300";
      case "emerald":
        return "bg-emerald-50/70 border-emerald-100 text-emerald-900 hover:border-emerald-300";
      case "purple":
        return "bg-purple-50/70 border-purple-100 text-purple-900 hover:border-purple-300";
      case "orange":
        return "bg-orange-50/70 border-orange-100 text-orange-900 hover:border-orange-300";
      default:
        return "bg-neutral-50/70 border-neutral-100 text-neutral-900 hover:border-neutral-300";
    }
  };

  const getBadgeColor = (c: string) => {
    switch (c) {
      case "indigo": return "bg-indigo-100 text-indigo-800";
      case "amber": return "bg-amber-100 text-amber-800";
      case "rose": return "bg-rose-100 text-rose-800";
      case "teal": return "bg-teal-100 text-teal-800";
      case "sky": return "bg-sky-100 text-sky-800";
      case "emerald": return "bg-emerald-100 text-emerald-800";
      case "purple": return "bg-purple-100 text-purple-800";
      case "orange": return "bg-orange-100 text-orange-800";
      default: return "bg-neutral-100 text-neutral-800";
    }
  };

  // Render ONBOARDING STEP-BY-STEP screen if first time
  if (isOnboarding) {
    return (
      <div className="space-y-6 text-left animate-fade-in" id="academic-onboarding">
        <div className="bg-gradient-to-br from-neutral-800 to-neutral-950 text-white p-8 rounded-3xl border border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-awaji-gold/10 blur-3xl pointer-events-none" />
          
          <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold px-2 py-0.5 bg-awaji-gold/20 rounded-md">
            WIZARD SETUP
          </span>
          <h2 className="text-3xl font-display font-black tracking-tight mt-3">
            Setup Academic Workspace
          </h2>
          <p className="text-xs text-neutral-300 font-light mt-1.5 max-w-xl leading-relaxed">
            Configure your active term partitions, weekly expected days of campus/classroom presence, and synchronize course attendance records.
          </p>
        </div>

        <form onSubmit={handleOnboardSubmit} className="bg-white/80 backdrop-blur-md border border-neutral-200/50 p-6 md:p-8 rounded-3xl shadow-md space-y-6">
          <h3 className="text-sm font-display font-bold text-neutral-800 border-b border-neutral-100 pb-3 flex items-center gap-2">
            <CalendarClock size={16} className="text-awaji-gold" />
            <span>Academic Partition Parameters</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Semesters Count */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Total Semester Parts
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSemestersCount(num)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      semestersCount === num
                        ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {num} {num === 1 ? "Semester" : "Semesters"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-400 font-light">
                Specify the division format of your academic year (e.g., Semesters or Quarters).
              </p>
            </div>

            {/* Active Semester */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Active Study Semester
              </label>
              <select
                value={activeSemester}
                onChange={(e) => setActiveSemester(e.target.value)}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white font-bold"
              >
                {Array.from({ length: semestersCount }).map((_, idx) => (
                  <option key={idx} value={`Semester ${idx + 1}`}>
                    Semester {idx + 1}
                  </option>
                ))}
                <option value="Trimester Term">Trimester Term</option>
                <option value="Summer Quarter">Summer Quarter</option>
              </select>
              <p className="text-[10px] text-neutral-400 font-light">
                This is the active semester code that will label your logs and schedules.
              </p>
            </div>

            {/* Semester Duration (Days) */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Semester Total Duration (Days)
              </label>
              <input
                type="number"
                min="10"
                max="365"
                value={semesterDurationDays}
                onChange={(e) => setSemesterDurationDays(parseInt(e.target.value) || 90)}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white font-bold text-neutral-800"
              />
              <p className="text-[10px] text-neutral-400 font-light">
                Typically 90 days (12-14 weeks) for a standard trimester or semester.
              </p>
            </div>

            {/* Semester Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Semester Start Date
              </label>
              <input
                type="date"
                value={semesterStartDate}
                onChange={(e) => setSemesterStartDate(e.target.value)}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white font-bold text-neutral-800 text-neutral-600"
              />
              <p className="text-[10px] text-neutral-400 font-light">
                The first instruction day of the active academic term.
              </p>
            </div>

            {/* Semester End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Semester End Date
              </label>
              <input
                type="date"
                value={semesterEndDate}
                onChange={(e) => setSemesterEndDate(e.target.value)}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white font-bold text-neutral-805 text-neutral-600"
              />
              <p className="text-[10px] text-neutral-400 font-light">
                Calculated automatically but customizable. Includes final grades closing.
              </p>
            </div>

            {/* Exams Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Exams Commencement Date
              </label>
              <input
                type="date"
                value={examsStartDate}
                onChange={(e) => setExamsStartDate(e.target.value)}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white font-bold text-neutral-805 text-neutral-600"
              />
              <p className="text-[10px] text-neutral-400 font-light">
                The start date for final exams of this term.
              </p>
            </div>

            {/* Exams End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Exams Conclusion Date
              </label>
              <input
                type="date"
                value={examsEndDate}
                onChange={(e) => setExamsEndDate(e.target.value)}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white font-bold text-neutral-805 text-neutral-600"
              />
              <p className="text-[10px] text-neutral-400 font-light">
                End date for all final examinations.
              </p>
            </div>

            {/* Expected attendance days */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                Expected Attendance Days of the Week
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {WEEKDAYS.map((day) => {
                  const isChecked = expectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleExpectedDay(day)}
                      className={`py-2.5 px-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-400 text-amber-900 font-semibold"
                          : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      }`}
                    >
                      <span className="block truncate">{day.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-neutral-400 font-light pt-1">
                Mark the days of the week on which you are expected to attend classes. We'll use this to optimize the attendance helper.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-awaji-gold hover:bg-awaji-gold-dark text-neutral-900 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
            >
              <Sparkles size={14} />
              <span>Initialize Workspace</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Date-based calculations for semester progress
  const getSemesterProgressMetrics = () => {
    if (!config) return null;
    
    const startStr = config.semesterStartDate || new Date().toISOString().split("T")[0];
    const duration = config.semesterDurationDays || 90;
    
    const startDate = new Date(startStr);
    const endDate = config.semesterEndDate ? new Date(config.semesterEndDate) : new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    // Total days
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || duration;
    
    // Days elapsed
    let elapsedDays = Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (elapsedDays < 0) elapsedDays = 0;
    if (elapsedDays > totalDays) elapsedDays = totalDays;
    
    // Days remaining
    const remainingDays = totalDays - elapsedDays;
    
    // Progress percentage
    const progressPercent = Math.round((elapsedDays / totalDays) * 100);
    
    // Exams info
    const examStartStr = config.examsStartDate || new Date(startDate.getTime() + (duration - 10) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const examEndStr = config.examsEndDate || endDate.toISOString().split("T")[0];
    
    const examStartDate = new Date(examStartStr);
    const examEndDate = new Date(examEndStr);
    
    const isExamPeriod = today >= examStartDate && today <= examEndDate;
    const daysUntilExams = Math.round((examStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      totalDays,
      elapsedDays,
      remainingDays,
      progressPercent,
      isExamPeriod,
      daysUntilExams,
      startDateStr: startStr,
      endDateStr: endDate.toISOString().split("T")[0],
      examStartStr,
      examEndStr
    };
  };

  const semMetrics = getSemesterProgressMetrics();

  // Render CORE DASHBOARD once onboarded
  return (
    <div className="space-y-6 text-left animate-fade-in" id="class-section-active">
      {/* Top Academic Context Card */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
              Module 01
            </span>
            <span className="text-[10px] font-mono bg-neutral-900 text-white font-bold px-2 py-0.5 rounded-md uppercase">
              {config?.activeSemester || "Semester 1"}
            </span>
          </div>
          <h2 className="text-2xl font-display font-black text-neutral-800 tracking-tight mt-1">
            Academic Calendar & Desk
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Organize courses, build multi-day schedules, and track your attendance.
          </p>
        </div>

        {/* Quick config settings button */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer ${
              activeSubTab === "settings" ? "bg-neutral-100 text-neutral-800" : "bg-white text-neutral-400"
            }`}
            title="Calendar Settings"
          >
            <Settings size={15} />
          </button>

          <button
            onClick={() => {
              setActiveSubTab("courses");
              setShowAddCourseForm(true);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Statistics and Gauges Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance Percentage Circle / Metric */}
        <div className="bg-white/70 backdrop-blur-md border border-neutral-200/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Attendance Rate
            </span>
            <span className="text-2xl font-display font-black text-neutral-800 mt-1 block">
              {attendanceRate}%
            </span>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              {totalAttended} attended &bull; {totalAbsent} absent
            </span>
          </div>
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            {/* SVG Ring representation */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#E5E7EB"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#D97706"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - attendanceRate / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-amber-700">
              {attendanceRate}%
            </span>
          </div>
        </div>

        {/* Expected Campus Presence */}
        <div className="bg-white/70 backdrop-blur-md border border-neutral-200/50 p-5 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
            Expected Week Days
          </span>
          <span className="text-xl font-display font-black text-neutral-800 mt-1 block truncate">
            {config?.expectedDays.length || 0} Attendance Days
          </span>
          <p className="text-[10px] text-neutral-500 mt-0.5 truncate">
            {config?.expectedDays.map((d) => d.slice(0, 3)).join(", ")}
          </p>
        </div>

        {/* Total Registered Courses */}
        <div className="bg-white/70 backdrop-blur-md border border-neutral-200/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Course Catalog
            </span>
            <span className="text-2xl font-display font-black text-neutral-800 mt-1 block">
              {classes.length} Registered
            </span>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              {classes.reduce((acc, curr) => acc + (curr.sessions?.length || 0), 0)} weekly lectures
            </span>
          </div>
          <span className="p-3 bg-neutral-900 text-white rounded-xl">
            <BookOpen size={16} />
          </span>
        </div>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveSubTab("attendance")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === "attendance"
              ? "border-neutral-900 text-neutral-900 font-black"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          📆 Daily Attendance Checklist
        </button>
        <button
          onClick={() => setActiveSubTab("courses")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === "courses"
              ? "border-neutral-900 text-neutral-900 font-black"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          🏫 Course & Schedules Builder ({classes.length})
        </button>
        <button
          onClick={() => setActiveSubTab("settings")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === "settings"
              ? "border-neutral-900 text-neutral-900 font-black"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          ⚙️ Academic Settings
        </button>
      </div>

      {/* SECTION VIEW RENDERING */}

      {/* 1. DAILY ATTENDANCE CHECKLIST */}
      {activeSubTab === "attendance" && (
        <div className="space-y-6 animate-fade-in" id="subtab-attendance">
          {/* Semester Progress & Exam Timeline Panel */}
          {semMetrics && (
            <div className="bg-gradient-to-br from-neutral-50 to-white p-6 rounded-3xl border border-neutral-200/50 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
                    Academic Term Track
                  </span>
                  <h3 className="text-base font-display font-black text-neutral-800 flex items-center gap-2">
                    <span>{config?.activeSemester || "Current Semester"} Timeline</span>
                    <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
                      {semMetrics.totalDays} Days Total
                    </span>
                  </h3>
                </div>
                
                {/* Exam Countdown Badge */}
                <div>
                  {semMetrics.isExamPeriod ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>EXAM WEEK ACTIVE</span>
                    </div>
                  ) : semMetrics.daysUntilExams > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CalendarClock size={14} className="text-amber-600" />
                      <span>Exams begin in {semMetrics.daysUntilExams} days</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Award size={14} className="text-emerald-600" />
                      <span>Exams concluded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>Semester Elapsed: {semMetrics.elapsedDays} of {semMetrics.totalDays} days ({semMetrics.progressPercent}%)</span>
                  <span className="font-bold">{semMetrics.remainingDays} Days Left</span>
                </div>
                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200/50">
                  <div 
                    className="bg-neutral-800 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${semMetrics.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Milestones / Dates Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-neutral-100">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono uppercase text-neutral-400 block font-bold">Term Start Date</span>
                  <span className="text-xs font-semibold text-neutral-700">{semMetrics.startDateStr}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono uppercase text-neutral-400 block font-bold">Term End Date</span>
                  <span className="text-xs font-semibold text-neutral-700">{semMetrics.endDateStr}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono uppercase text-neutral-400 block font-bold">Exams Commencement</span>
                  <span className="text-xs font-semibold text-neutral-700">{semMetrics.examStartStr}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono uppercase text-neutral-400 block font-bold">Exams Conclusion</span>
                  <span className="text-xs font-semibold text-neutral-700">{semMetrics.examEndStr}</span>
                </div>
              </div>
            </div>
          )}

          {/* Picker & Selected Information bar */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                Choose Attendance Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 bg-white focus:outline-none focus:border-awaji-gold cursor-pointer"
                />
                <span className="text-xs font-semibold text-neutral-600 font-display bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100">
                  {selectedDayName}
                </span>
              </div>
            </div>

            {/* expected day alert indicator */}
            <div>
              {config && config.expectedDays.includes(selectedDayName) ? (
                <div className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/40 flex items-center gap-1.5">
                  <Check size={12} />
                  <span>EXPECTED CLASSROOM DAY</span>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100/40 flex items-center gap-1.5">
                  <Info size={12} />
                  <span>SELF-STUDY OR REST DAY</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's Lectures Attendance list */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Clock size={12} />
              <span>Timetable for {selectedDayName} ({todaySessions.length} lectures)</span>
            </h3>

            {todaySessions.length === 0 ? (
              <div className="p-10 text-center bg-white/40 rounded-3xl border border-neutral-200/45 space-y-2">
                <span className="p-3 bg-neutral-100 text-neutral-400 rounded-full inline-block">
                  <Calendar size={18} />
                </span>
                <p className="text-xs text-neutral-500 font-medium">No classes scheduled on {selectedDayName}s.</p>
                <p className="text-[10px] text-neutral-400 font-light">
                  Use this interval to study your course note catalog or clear focus goals!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaySessions.map(({ course, session }) => {
                  // Get attendance status for this date + session
                  const record = attendance.find(
                    (a) => a.date === selectedDate && a.sessionId === session.id
                  );
                  const status = record ? record.status : "pending";

                  return (
                    <div
                      key={session.id}
                      className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] relative ${getColorClasses(
                        course.color
                      )} ${
                        status === "attended"
                          ? "ring-2 ring-emerald-500/50 border-emerald-300 bg-gradient-to-br from-emerald-50/20 to-white"
                          : status === "absent"
                          ? "ring-2 ring-rose-500/50 border-rose-300 bg-gradient-to-br from-rose-50/20 to-white"
                          : ""
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase ${getBadgeColor(
                              course.color
                            )}`}
                          >
                            {course.code}
                          </span>

                          {/* Attendance Status Pill */}
                          <span
                            className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                              status === "attended"
                                ? "bg-emerald-500 text-white"
                                : status === "absent"
                                ? "bg-rose-500 text-white"
                                : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {status === "attended" ? "Attended" : status === "absent" ? "Absent" : "Unmarked"}
                          </span>
                        </div>

                        <h4 className="font-display font-black text-sm text-neutral-800 mt-2.5">
                          {course.name}
                        </h4>

                        {/* Location and hour info */}
                        <div className="flex items-center gap-4 text-[10px] text-neutral-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            <span className="font-mono">{session.time}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            <span>{session.venue}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            <span>{course.instructor}</span>
                          </span>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-black/5 justify-end">
                        <button
                          onClick={() => handleSetAttendance(course.id, session.id, "attended")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            status === "attended"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-white/80 hover:bg-emerald-100/50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <Check size={11} />
                          <span>Attended</span>
                        </button>

                        <button
                          onClick={() => handleSetAttendance(course.id, session.id, "absent")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            status === "absent"
                              ? "bg-rose-600 text-white shadow-sm"
                              : "bg-white/80 hover:bg-rose-100/50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <X size={11} />
                          <span>Absent</span>
                        </button>

                        {status !== "pending" && (
                          <button
                            onClick={() => handleResetAttendance(session.id)}
                            className="p-1.5 bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-600 rounded-lg cursor-pointer"
                            title="Reset Check Status"
                          >
                            <RefreshCw size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. COURSE & SCHEDULES BUILDER */}
      {activeSubTab === "courses" && (
        <div className="space-y-6 animate-fade-in" id="subtab-courses">
          {/* Add Course Toggle Area */}
          {showAddCourseForm ? (
            <form
              onSubmit={handleCreateCourse}
              className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/50 shadow-md space-y-4"
              id="add-course-form"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                <h3 className="font-display font-black text-neutral-800 text-sm">
                  Add New Academic Course
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddCourseForm(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="e.g., Intro to Deep Learning"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g., CS450"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Lecturer / Professor
                  </label>
                  <input
                    type="text"
                    value={newCourseInstructor}
                    onChange={(e) => setNewCourseInstructor(e.target.value)}
                    placeholder="e.g., Dr. Kenji Sato"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Primary Venue / Room
                  </label>
                  <input
                    type="text"
                    value={newCourseVenue}
                    onChange={(e) => setNewCourseVenue(e.target.value)}
                    placeholder="e.g., Science Hall B"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Course Session Duration
                  </label>
                  <select
                    value={newCourseDuration}
                    onChange={(e) => setNewCourseDuration(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-600 bg-white"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="45 minutes">45 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1.5 hours">1.5 hours</option>
                    <option value="2 hours">2 hours</option>
                    <option value="2.5 hours">2.5 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="4 hours">4 hours</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Course Label Accent Color
                  </span>
                  <div className="flex gap-2">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCourseColor(c)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-all border ${
                          newCourseColor === c
                            ? "ring-2 ring-offset-2 ring-neutral-900 border-transparent"
                            : "border-neutral-200"
                        }`}
                        style={{
                          backgroundColor:
                            c === "indigo" ? "#6366F1" :
                            c === "amber" ? "#F59E0B" :
                            c === "rose" ? "#F43F5E" :
                            c === "teal" ? "#14B8A6" :
                            c === "sky" ? "#0EA5E9" :
                            c === "emerald" ? "#10B981" :
                            c === "purple" ? "#A855F7" : "#F97316"
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Create Course
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddCourseForm(true)}
                className="text-xs font-bold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 py-1 px-3 bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={12} />
                <span>Add a New Course block</span>
              </button>
            </div>
          )}

          {/* Courses Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.length === 0 ? (
              <div className="md:col-span-2 text-center py-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-neutral-200/40">
                <BookOpen size={24} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-xs text-neutral-500 font-bold">No registered courses found.</p>
                <p className="text-[10px] text-neutral-400 mt-1">Configure your course catalog to populate the weekly schedule and activity checker.</p>
              </div>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between min-h-[220px] transition-all duration-300 group ${getColorClasses(
                    cls.color
                  )}`}
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase ${getBadgeColor(
                            cls.color
                          )}`}
                        >
                          {cls.code}
                        </span>
                        {cls.duration && (
                          <span className="px-2 py-0.5 bg-neutral-900/10 text-neutral-800 rounded text-[9px] font-mono font-bold">
                            ⏱ {cls.duration}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        className="p-1 text-neutral-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Remove Course"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <h3 className="font-display font-black text-base text-neutral-800 tracking-tight mt-3">
                      {cls.name}
                    </h3>

                    {/* Professor Name */}
                    <p className="text-xs text-neutral-500 mt-1 font-medium flex items-center gap-1.5">
                      <User size={12} className="text-neutral-400" />
                      <span>{cls.instructor}</span>
                    </p>

                    {/* SESSIONS SECTION */}
                    <div className="mt-4 pt-3 border-t border-black/5 space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                        Weekly Occurrences (Attendances)
                      </span>

                      {(!cls.sessions || cls.sessions.length === 0) ? (
                        <p className="text-[10px] italic text-neutral-400">
                          No scheduled occurrences. Add a day below to place it in the timetable.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {cls.sessions.map((sess) => (
                            <div
                              key={sess.id}
                              className="bg-white/60 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center justify-between text-[10px] text-neutral-700"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-neutral-800">{sess.dayOfWeek}</span>
                                <span className="font-mono text-neutral-500">{sess.time}</span>
                                <span className="text-neutral-400 truncate max-w-[100px]">&bull; {sess.venue}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteSession(cls.id, sess.id)}
                                className="p-0.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                                title="Remove Occurrence"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Occurence Block */}
                  <div className="mt-4 pt-3 border-t border-black/5">
                    {addingSessionToCourseId === cls.id ? (
                      <div className="bg-white/80 p-3 rounded-2xl border border-neutral-200/60 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-mono text-neutral-400 block mb-0.5">Day of Week</label>
                            <select
                              value={newSessDay}
                              onChange={(e) => setNewSessDay(e.target.value)}
                              className="w-full text-[10px] py-1 px-2 border rounded-md bg-white font-bold"
                            >
                              {WEEKDAYS.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-neutral-400 block mb-0.5">Time Slot</label>
                            <input
                              type="text"
                              value={newSessTime}
                              onChange={(e) => setNewSessTime(e.target.value)}
                              placeholder="e.g., 10:00 AM"
                              className="w-full text-[10px] py-1 px-2 border rounded-md bg-white font-semibold"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[9px] font-mono text-neutral-400 block mb-0.5">Room / Venue</label>
                            <input
                              type="text"
                              value={newSessVenue}
                              onChange={(e) => setNewSessVenue(e.target.value)}
                              placeholder="e.g., Hall B (defaults to course room)"
                              className="w-full text-[10px] py-1 px-2 border rounded-md bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingSessionToCourseId(null)}
                            className="px-2.5 py-1 text-[9px] font-bold text-neutral-500 hover:bg-neutral-100 rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddSession(cls.id)}
                            className="px-2.5 py-1 text-[9px] font-black bg-neutral-900 text-white rounded-md cursor-pointer"
                          >
                            Add Occurrence
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingSessionToCourseId(cls.id);
                          setNewSessDay("Monday");
                          setNewSessTime("10:00 AM");
                        }}
                        className="w-full py-1.5 bg-white/50 hover:bg-white border border-neutral-200/50 hover:border-neutral-300 text-neutral-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <Plus size={11} />
                        <span>Add Weekly Schedule Occurrence</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. SETTINGS CONFIG */}
      {activeSubTab === "settings" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200/50 shadow-md space-y-6 animate-fade-in" id="subtab-settings">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <span className="p-2 bg-neutral-900 text-white rounded-xl">
              <Settings size={16} />
            </span>
            <div>
              <h3 className="font-display font-black text-sm text-neutral-800">
                Academic Configurations
              </h3>
              <p className="text-[10px] text-neutral-400 font-light mt-0.5">
                Revise active semesters or expected weekly attendance targets.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-neutral-600 leading-relaxed font-light">
            <div className="p-4 bg-amber-500/10 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
              <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Caution regarding workspace reset:</span>
                <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                  Changing partitions resets your calendar timetable settings, requiring you to map expected weekday presences. Individual course data and attendance history remains preserved in local storage cache.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                Operational Academic Wizard
              </span>
              <button
                type="button"
                onClick={handleResetConfig}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 self-start border border-neutral-200/55"
              >
                <RefreshCw size={13} />
                <span>Launch Calendar Setup Wizard</span>
              </button>
            </div>

            {/* Timeline Config Section */}
            <div className="pt-5 border-t border-neutral-100 space-y-4 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                Semester Timeline & Exam Milestones Settings
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Semester Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="365"
                    value={semesterDurationDays}
                    onChange={(e) => setSemesterDurationDays(parseInt(e.target.value) || 90)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Semester Start Date
                  </label>
                  <input
                    type="date"
                    value={semesterStartDate}
                    onChange={(e) => setSemesterStartDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Semester End Date
                  </label>
                  <input
                    type="date"
                    value={semesterEndDate}
                    onChange={(e) => setSemesterEndDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Exams Commencement Date
                  </label>
                  <input
                    type="date"
                    value={examsStartDate}
                    onChange={(e) => setExamsStartDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    Exams Conclusion Date
                  </label>
                  <input
                    type="date"
                    value={examsEndDate}
                    onChange={(e) => setExamsEndDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white"
                  />
                </div>
              </div>

              {/* Expected attendance days */}
              <div className="space-y-2 pt-4 border-t border-neutral-100">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  Expected Attendance Days of the Week
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {WEEKDAYS.map((day) => {
                    const isChecked = expectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleExpectedDay(day)}
                        className={`py-2.5 px-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          isChecked
                            ? "bg-amber-500/10 border-amber-400 text-amber-900 font-semibold"
                            : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                        }`}
                      >
                        <span className="block truncate">{day.slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-neutral-400 font-light pt-1">
                  Mark the days of the week on which you are expected to attend classes or have study goals.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const newConfig = {
                      semestersCount: config?.semestersCount || 2,
                      activeSemester: config?.activeSemester || "Semester 1",
                      expectedDays: expectedDays.length > 0 ? expectedDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      semesterDurationDays,
                      semesterStartDate,
                      semesterEndDate,
                      examsStartDate,
                      examsEndDate
                    };
                    setConfig(newConfig);
                    localStorage.setItem("awaji_academic_config", JSON.stringify(newConfig));
                    alert("Academic configurations saved successfully!");
                  }}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  Save Academic Configurations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
