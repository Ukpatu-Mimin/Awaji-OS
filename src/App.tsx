import { useState, useEffect } from "react";
import HomeSection from "./components/HomeSection";
import ClassSection from "./components/ClassSection";
import DeadlineSection from "./components/DeadlineSection";
import StudySection from "./components/StudySection";
import AwajiAISection from "./components/AwajiAISection";
import MoodSection from "./components/MoodSection";
import StreakSection from "./components/StreakSection";
import ThemeSection, { ThemePreset } from "./components/ThemeSection";
import NotificationCenter from "./components/NotificationCenter";

import {
  Compass,
  BookOpen,
  CalendarClock,
  Hourglass,
  Sparkles,
  Heart,
  Flame,
  Palette,
  Info,
  Layers,
  GraduationCap,
  Menu,
  X
} from "lucide-react";
import { ClassSubject, DeadlineTask, NotificationItem } from "./types";

type TabType = "home" | "class" | "deadline" | "study" | "guardian" | "mood" | "streak" | "theme";

const sanitizeInput = (val: string): string => {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").trim();
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");

  // User Authentication / Empty State & Onboarding
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("awaji_current_user");
  });

  const [classes, setClasses] = useState<ClassSubject[]>(() => {
    const user = localStorage.getItem("awaji_current_user");
    if (user) {
      const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
      try {
        const accounts = JSON.parse(accountsStr);
        const profile = accounts[user.toLowerCase()];
        if (profile && profile.classes) return profile.classes;
      } catch (e) {}
    }
    const saved = localStorage.getItem("awaji_classes");
    return saved ? JSON.parse(saved) : [];
  });

  const [deadlines, setDeadlines] = useState<DeadlineTask[]>(() => {
    const user = localStorage.getItem("awaji_current_user");
    if (user) {
      const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
      try {
        const accounts = JSON.parse(accountsStr);
        const profile = accounts[user.toLowerCase()];
        if (profile && profile.deadlines) return profile.deadlines;
      } catch (e) {}
    }
    const saved = localStorage.getItem("awaji_deadlines");
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<ThemePreset>(() => {
    const user = localStorage.getItem("awaji_current_user");
    if (user) {
      const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
      try {
        const accounts = JSON.parse(accountsStr);
        const profile = accounts[user.toLowerCase()];
        if (profile && profile.theme) return profile.theme as ThemePreset;
      } catch (e) {}
    }
    const saved = localStorage.getItem("awaji_theme");
    return (saved as ThemePreset) || "ivory";
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const user = localStorage.getItem("awaji_current_user");
    if (user) {
      const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
      try {
        const accounts = JSON.parse(accountsStr);
        const profile = accounts[user.toLowerCase()];
        if (profile && profile.notifications) return profile.notifications;
      } catch (e) {}
    }
    const saved = localStorage.getItem("awaji_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const user = localStorage.getItem("awaji_current_user");
    if (user) {
      const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
      try {
        const accounts = JSON.parse(accountsStr);
        const profile = accounts[user.toLowerCase()];
        if (profile && typeof profile.streakDays === "number") return profile.streakDays;
      } catch (e) {}
    }
    const saved = localStorage.getItem("awaji_streak_days");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem("awaji_onboarding_completed");
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authUsername, setAuthUsername] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Global Emoji Rain state
  const [rainItems, setRainItems] = useState<any[]>([]);

  // Request native browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Auto-sync active state back to user's persistent profile in the accounts database
  useEffect(() => {
    if (!currentUser) return;
    const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
    let accounts: Record<string, any> = {};
    try {
      accounts = JSON.parse(accountsStr);
    } catch (e) {}

    const key = currentUser.toLowerCase();
    if (accounts[key]) {
      accounts[key].classes = classes;
      accounts[key].deadlines = deadlines;
      accounts[key].streakDays = streakDays;
      accounts[key].theme = theme;
      accounts[key].notifications = notifications;
      localStorage.setItem("awaji_user_accounts", JSON.stringify(accounts));
    }
  }, [classes, deadlines, streakDays, theme, notifications, currentUser]);

  const saveCurrentUserProfile = () => {
    if (!currentUser) return;
    const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
    let accounts: Record<string, any> = {};
    try {
      accounts = JSON.parse(accountsStr);
    } catch (e) {}

    const key = currentUser.toLowerCase();
    if (accounts[key]) {
      accounts[key].classes = classes;
      accounts[key].deadlines = deadlines;
      accounts[key].streakDays = streakDays;
      accounts[key].theme = theme;
      accounts[key].notifications = notifications;
      const savedHabits = localStorage.getItem("awaji_habits");
      if (savedHabits) {
        try {
          accounts[key].habits = JSON.parse(savedHabits);
        } catch (e) {}
      }
      localStorage.setItem("awaji_user_accounts", JSON.stringify(accounts));
    }
  };

  const handleLogin = (usernameInput: string) => {
    const cleanUsername = sanitizeInput(usernameInput);
    const cleanPassword = sanitizeInput(authPassword);

    if (!cleanUsername) {
      setAuthError("Username is required");
      return;
    }
    if (!cleanPassword) {
      setAuthError("Password is required");
      return;
    }
    if (cleanPassword.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }

    const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
    let accounts: Record<string, any> = {};
    try {
      accounts = JSON.parse(accountsStr);
    } catch (e) {}

    const key = cleanUsername.toLowerCase();
    if (!accounts[key]) {
      setAuthError("Account not found. Please create an account first.");
      return;
    }

    if (accounts[key].password !== cleanPassword) {
      setAuthError("Invalid username or password.");
      return;
    }

    // Login succeeds
    localStorage.setItem("awaji_current_user", accounts[key].username);
    setCurrentUser(accounts[key].username);

    const profile = accounts[key];
    setClasses(profile.classes || []);
    setDeadlines(profile.deadlines || []);
    setStreakDays(profile.streakDays || 0);
    setTheme((profile.theme as ThemePreset) || "ivory");
    setNotifications(profile.notifications || []);

    localStorage.setItem("awaji_classes", JSON.stringify(profile.classes || []));
    localStorage.setItem("awaji_deadlines", JSON.stringify(profile.deadlines || []));
    localStorage.setItem("awaji_streak_days", String(profile.streakDays || 0));
    localStorage.setItem("awaji_theme", profile.theme || "ivory");
    localStorage.setItem("awaji_notifications", JSON.stringify(profile.notifications || []));
    localStorage.setItem("awaji_habits", JSON.stringify(profile.habits || []));

    window.dispatchEvent(new Event("awaji_sync_streak"));

    handleAddCustomNotification(
      `Welcome Back, ${profile.username}! 👋`,
      `Glad to see you again. Your personalized academic desk is ready for focus.`,
      "general"
    );
  };

  const handleSignup = (usernameInput: string) => {
    const cleanUsername = sanitizeInput(usernameInput);
    const cleanEmail = sanitizeInput(authEmail);
    const cleanPassword = sanitizeInput(authPassword);

    if (!cleanUsername) {
      setAuthError("Username is required");
      return;
    }
    if (!cleanEmail) {
      setAuthError("Email is required");
      return;
    }
    if (!cleanEmail.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!cleanPassword) {
      setAuthError("Password is required");
      return;
    }
    if (cleanPassword.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }

    const accountsStr = localStorage.getItem("awaji_user_accounts") || "{}";
    let accounts: Record<string, any> = {};
    try {
      accounts = JSON.parse(accountsStr);
    } catch (e) {}

    const key = cleanUsername.toLowerCase();
    if (accounts[key]) {
      setAuthError("An account with this username already exists.");
      return;
    }

    const freshHabits = [
      { id: "h1", name: "Complete 2 Pomodoro Sessions", done: false },
      { id: "h2", name: "Log Daily Class Lectures", done: false },
      { id: "h4", name: "Converse with Awaji AI", done: false }
    ];

    const welcomeNotif: NotificationItem = {
      id: "welcome-notif",
      title: `Welcome to Awaji OS, ${cleanUsername}! 🎓`,
      message: "Your new hyper-crafted personal student desktop is operational. Create your custom classes and deadlines to start!",
      type: "general",
      isRead: false,
      timestamp: "Just now",
      targetTab: "home"
    };

    const newProfile = {
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPassword,
      classes: [],
      deadlines: [],
      streakDays: 0,
      theme: "ivory",
      notifications: [welcomeNotif],
      habits: freshHabits
    };

    accounts[key] = newProfile;
    localStorage.setItem("awaji_user_accounts", JSON.stringify(accounts));

    // Sign in the newly created account
    localStorage.setItem("awaji_current_user", cleanUsername);
    setCurrentUser(cleanUsername);

    setClasses([]);
    setDeadlines([]);
    setStreakDays(0);
    setTheme("ivory");
    setNotifications([welcomeNotif]);

    localStorage.setItem("awaji_classes", JSON.stringify([]));
    localStorage.setItem("awaji_deadlines", JSON.stringify([]));
    localStorage.setItem("awaji_streak_days", "0");
    localStorage.setItem("awaji_theme", "ivory");
    localStorage.setItem("awaji_notifications", JSON.stringify([welcomeNotif]));
    localStorage.setItem("awaji_habits", JSON.stringify(freshHabits));

    window.dispatchEvent(new Event("awaji_sync_streak"));

    // Reset and open onboarding
    localStorage.removeItem("awaji_onboarding_completed");
    setShowOnboarding(true);
    setOnboardingStep(1);
  };

  const handleLogout = () => {
    saveCurrentUserProfile();

    localStorage.removeItem("awaji_current_user");
    localStorage.removeItem("awaji_classes");
    localStorage.removeItem("awaji_deadlines");
    localStorage.removeItem("awaji_streak_days");
    localStorage.removeItem("awaji_theme");
    localStorage.removeItem("awaji_notifications");
    localStorage.removeItem("awaji_habits");

    setCurrentUser(null);
    setClasses([]);
    setDeadlines([]);
    setStreakDays(0);
    setTheme("ivory");
    setNotifications([]);
    setAuthUsername("");
    setAuthPassword("");
    setAuthEmail("");
    setAuthError("");
  };

  // Listen to Global Emoji Rain
  useEffect(() => {
    const handleEmojiRain = (e: any) => {
      const moodLabel = e.detail || "happy";
      const emojis: Record<string, string> = {
        happy: "😄",
        sad: "😢",
        anxious: "😰",
        anger: "😡",
        tired: "🥱",
        focused: "🧠"
      };
      const emoji = emojis[moodLabel] || "😄";
      
      const items = Array.from({ length: 45 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        delay: Math.random() * 2.2,
        duration: 2.2 + Math.random() * 1.8,
        size: 20 + Math.random() * 26,
        emoji: emoji
      }));
      setRainItems(items);
      setTimeout(() => setRainItems([]), 5000);
    };
    window.addEventListener("awaji_trigger_emoji_rain", handleEmojiRain);
    return () => window.removeEventListener("awaji_trigger_emoji_rain", handleEmojiRain);
  }, []);

  // Listen to Agentic AI Actions
  useEffect(() => {
    const handleAiAction = (e: any) => {
      const { type, payload } = e.detail || {};
      if (!type) return;

      if (type === "TRIGGER_EMOJI_RAIN") {
        window.dispatchEvent(new CustomEvent("awaji_trigger_emoji_rain", { detail: payload.mood }));
      } else if (type === "START_POMODORO") {
        setActiveTab("study");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("awaji_trigger_pomodoro", { detail: payload }));
        }, 120);
      } else if (type === "ADD_CLASS") {
        const newClass: ClassSubject = {
          id: "class-" + Date.now(),
          name: payload.name || "Custom Subject",
          instructor: payload.instructor || "Prof. Unknown",
          scheduleTime: payload.scheduleTime || "TBD",
          code: payload.code || (payload.name ? payload.name.slice(0, 3).toUpperCase() + "101" : "SUB101"),
          room: payload.room || "Room 101",
          color: payload.color || "indigo",
          sessions: [{ id: "session-1", dayOfWeek: "Monday", time: payload.scheduleTime || "10:00 AM", venue: payload.room || "Room 101" }]
        };
        handleAddClass(newClass);
        handleAddCustomNotification(
          `Class Added: ${newClass.name} 📚`,
          `Your AI copilot registered a new course under your active syllabus.`,
          "class"
        );
      } else if (type === "ADD_DEADLINE") {
        const matchedClass = classes.find((c) => c.name.toLowerCase().includes((payload.subjectName || "").toLowerCase()));
        const subId = matchedClass ? matchedClass.id : "general";
        
        const newDl: DeadlineTask = {
          id: "dl-" + Date.now(),
          title: payload.title || "Custom Task",
          subjectId: subId,
          dueDate: payload.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
          status: "pending",
          priority: (payload.priority || "medium") as "low" | "medium" | "high"
        };
        handleAddDeadline(newDl);
        handleAddCustomNotification(
          `Deadline Formed: ${newDl.title} ⏳`,
          `A new task milestone was assigned to your study calendar.`,
          "deadline"
        );
      } else if (type === "UPDATE_STREAK") {
        const inc = parseInt(payload.increment, 10) || 1;
        setStreakDays((curr) => {
          const next = curr + inc;
          localStorage.setItem("awaji_streak_days", String(next));
          return next;
        });
        window.dispatchEvent(new Event("awaji_sync_streak"));
        handleAddCustomNotification(
          `Streak Multiplied! 🔥`,
          `Your consistency is unmatched. Your streak was reinforced by Awaji AI.`,
          "streak"
        );
      }
    };

    window.addEventListener("awaji_ai_action", handleAiAction);
    return () => window.removeEventListener("awaji_ai_action", handleAiAction);
  }, [classes, deadlines]);

  // Load from local storage if available (safe guard)
  useEffect(() => {
    const savedTheme = localStorage.getItem("awaji_theme");
    if (savedTheme) setTheme(savedTheme as ThemePreset);
  }, []);

  // Sync streak state in real-time
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("awaji_streak_days");
      if (saved) {
        setStreakDays(parseInt(saved, 10));
      }
    };
    window.addEventListener("awaji_sync_streak", handleSync);
    return () => window.removeEventListener("awaji_sync_streak", handleSync);
  }, []);

  // Scan for upcoming deadlines or today's classes
  useEffect(() => {
    if (notifications.length === 0) return;

    let updated = [...notifications];
    let changed = false;

    // 1. Scan for impending or overdue deadlines
    deadlines.forEach((dl) => {
      if (dl.status === "pending") {
        const notifId = `deadline-alert-${dl.id}`;
        if (!updated.some((n) => n.id === notifId)) {
          const dueDateObj = new Date(dl.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDateObj.setHours(0, 0, 0, 0);
          const diffTime = dueDateObj.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let title = "";
          let msg = "";

          if (diffDays < 0) {
            title = `Overdue: ${dl.title} ⚠️`;
            msg = `This assignment was due on ${dl.dueDate}. Ensure you submit and mark it complete on your Deadline Board to stop the alert!`;
          } else if (diffDays <= 2) {
            title = `Looming Deadline: ${dl.title} ⏳`;
            msg = `Due in ${diffDays === 0 ? "today" : diffDays === 1 ? "tomorrow" : diffDays + " days"} (${dl.dueDate}). Focus up and clear this milestone.`;
          }

          if (title && msg) {
            updated.unshift({
              id: notifId,
              title,
              message: msg,
              type: "deadline",
              isRead: false,
              timestamp: "System Alert",
              targetTab: "deadline"
            });
            changed = true;
          }
        }
      }
    });

    // 2. Scan for today's active classes to remind attendance logging
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];

    classes.forEach((cls) => {
      if (cls.sessions) {
        const hasTodaySession = cls.sessions.some((s) => s.dayOfWeek.toLowerCase() === todayName.toLowerCase());
        if (hasTodaySession) {
          const notifId = `class-today-${cls.id}-${todayName}`;
          if (!updated.some((n) => n.id === notifId)) {
            updated.unshift({
              id: notifId,
              title: `Daily Attendance Checklist: ${cls.code} 📆`,
              message: `You have an active lecture scheduled today for ${cls.name}. Remember to check into your Desk and mark if you attended or missed it.`,
              type: "class",
              isRead: false,
              timestamp: "Today",
              targetTab: "class"
            });
            changed = true;
          }
        }
      }
    });

    if (changed) {
      setNotifications(updated);
      localStorage.setItem("awaji_notifications", JSON.stringify(updated));
    }
  }, [deadlines, classes]);

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    localStorage.setItem("awaji_notifications", JSON.stringify(updated));
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem("awaji_notifications", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.setItem("awaji_notifications", JSON.stringify([]));
  };

  const triggerDeviceNotification = (title: string, message: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body: message });
        } catch (e) {
          console.error("Failed to show native notification:", e);
        }
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            try {
              new Notification(title, { body: message });
            } catch (e) {
              console.error("Failed to show native notification:", e);
            }
          }
        });
      }
    }
  };

  const handleAddCustomNotification = (title: string, message: string, type: "general" | "deadline" | "class" | "streak" | "guardian") => {
    const newNotif: NotificationItem = {
      id: `custom-${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      timestamp: "Just now",
      targetTab: type === "deadline" ? "deadline" : type === "class" ? "class" : type === "streak" ? "streak" : type === "guardian" ? "guardian" : "home"
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    localStorage.setItem("awaji_notifications", JSON.stringify(updated));
    triggerDeviceNotification(title, message);
  };

  // Save changes helper
  const handleAddClass = (newClass: ClassSubject) => {
    const updated = [...classes, newClass];
    setClasses(updated);
    localStorage.setItem("awaji_classes", JSON.stringify(updated));
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    localStorage.setItem("awaji_classes", JSON.stringify(updated));
  };

  const handleAddDeadline = (newDl: DeadlineTask) => {
    const updated = [...deadlines, newDl];
    setDeadlines(updated);
    localStorage.setItem("awaji_deadlines", JSON.stringify(updated));
  };

  const handleToggleDeadline = (id: string) => {
    const updated: DeadlineTask[] = deadlines.map((dl) => (dl.id === id ? { ...dl, status: (dl.status === "completed" ? "pending" : "completed") as "pending" | "completed" } : dl));
    setDeadlines(updated);
    localStorage.setItem("awaji_deadlines", JSON.stringify(updated));
  };

  const handleDeleteDeadline = (id: string) => {
    const updated = deadlines.filter((dl) => dl.id !== id);
    setDeadlines(updated);
    localStorage.setItem("awaji_deadlines", JSON.stringify(updated));
  };

  const handleSelectTheme = (t: ThemePreset) => {
    setTheme(t);
    localStorage.setItem("awaji_theme", t);
  };

  // Maps of colors/styles depending on active theme
  const getThemeStyles = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-[#090A0C] text-gray-100 dark",
          headerBorder: "border-neutral-800",
          cardBg: "bg-neutral-900/60 border-neutral-800",
          logoColor: "text-indigo-400"
        };
      case "ninja":
        return {
          bg: "bg-[#0B132B] text-gray-200 dark",
          headerBorder: "border-blue-950/40",
          cardBg: "bg-[#1C2541]/70 border-blue-900/30",
          logoColor: "text-blue-400"
        };
      case "purple":
        return {
          bg: "bg-[#130E20] text-purple-100 dark",
          headerBorder: "border-purple-950/40",
          cardBg: "bg-[#211A34]/70 border-purple-900/30",
          logoColor: "text-purple-400"
        };

      case "amber":
        return {
          bg: "bg-[#FAF5EC] text-amber-950",
          headerBorder: "border-amber-200/40",
          cardBg: "bg-white/75 border-amber-200/50",
          logoColor: "text-amber-600"
        };
      case "emerald":
        return {
          bg: "bg-[#F0F4F1] text-emerald-950",
          headerBorder: "border-emerald-200/40",
          cardBg: "bg-white/75 border-emerald-200/50",
          logoColor: "text-emerald-600"
        };
      case "ivory":
      default:
        return {
          bg: "bg-[#FAF9F6] text-neutral-800",
          headerBorder: "border-neutral-200/40",
          cardBg: "bg-white/70 border-neutral-200/50",
          logoColor: "text-amber-500"
        };
    }
  };

  const currentStyles = getThemeStyles();

  // Sidebar list of items with corresponding icons
  const sidebarItems = [
    { id: "home" as const, label: "Home", icon: Compass },
    { id: "class" as const, label: "Class", icon: BookOpen },
    { id: "deadline" as const, label: "Deadline", icon: CalendarClock },
    { id: "study" as const, label: "Study", icon: Hourglass },
    { id: "guardian" as const, label: "Awaji AI", icon: Sparkles },
    { id: "mood" as const, label: "Mood", icon: Heart },
    { id: "streak" as const, label: "Streak", icon: Flame },
    { id: "theme" as const, label: "Theme", icon: Palette },
  ];

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${currentStyles.bg} p-6 font-sans relative transition-colors duration-500`}>
        {/* Decorative backdrop auras */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-awaji-gold/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-neutral-200/50 p-8 rounded-3xl shadow-xl flex flex-col justify-between z-10 text-left">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-neutral-900 text-white rounded-2xl shadow-md block">
                <GraduationCap size={20} className="animate-pulse" />
              </span>
              <div>
                <h1 className="font-display font-black text-xl text-neutral-800 leading-none">
                  Awaji OS
                </h1>
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block mt-1">
                  STUDY OPERATING SYSTEM
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-display font-black text-neutral-800 tracking-tight">
                {authMode === "login" ? "Welcome Back, Scholar" : "Create New Account"}
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                {authMode === "login"
                  ? "Enter your secure study credentials to enter your sanctuary."
                  : "Sign up to create your secure student workspace."}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                {authError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthError("");
                if (!authUsername.trim()) {
                  setAuthError("Username is required");
                  return;
                }
                if (authMode === "signup" && !authEmail.trim()) {
                  setAuthError("Email is required");
                  return;
                }
                if (!authPassword) {
                  setAuthError("Password is required");
                  return;
                }
                
                if (authMode === "login") {
                  handleLogin(authUsername.trim());
                } else {
                  handleSignup(authUsername.trim());
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  USERNAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. MarieCurie"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full bg-neutral-50/50 border border-neutral-200/80 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-indigo-400 font-medium"
                />
              </div>

              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    placeholder="marie@curie.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-neutral-50/50 border border-neutral-200/80 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-neutral-50/50 border border-neutral-200/80 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-indigo-400 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-850 text-white font-bold rounded-xl text-xs transition-all duration-300 mt-2 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <span>{authMode === "login" ? "Enter Study Workspace" : "Begin New Journey"}</span>
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-neutral-100 mt-6 flex justify-center items-center text-xs">
            <button
              onClick={() => {
                setAuthError("");
                setAuthMode(authMode === "login" ? "signup" : "login");
              }}
              className="text-neutral-500 hover:text-neutral-800 transition-colors font-semibold"
            >
              {authMode === "login" ? "Need an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${currentStyles.bg} transition-colors duration-500 font-sans relative`}>
      {/* Decorative backdrop auras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-awaji-gold/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Global Emoji Rain Overlay */}
      {rainItems.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {rainItems.map((item) => (
            <div
              key={item.id}
              className="absolute text-center"
              style={{
                left: `${item.x}%`,
                top: `-50px`,
                fontSize: `${item.size}px`,
                animationDelay: `${item.delay}s`,
                animationDuration: `${item.duration}s`,
                animationName: "fall",
                animationTimingFunction: "linear",
                animationIterationCount: "1",
                animationFillMode: "forwards"
              }}
            >
              {item.emoji}
            </div>
          ))}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
            }
          `}} />
        </div>
      )}

      {/* Onboarding Orientation Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-neutral-200/50 p-8 rounded-3xl shadow-2xl relative text-left">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-neutral-900 text-white rounded-lg block text-xs">
                    🎓
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-widest">
                    Awaji Sanctuary Orientation
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-neutral-400">
                  STEP {onboardingStep} OF 3
                </span>
              </div>

              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black text-neutral-800 tracking-tight">
                    Welcome to your Study Sanctuary ⛩️
                  </h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    Awaji Student OS is an elite, minimalist focus dashboard. It acts as a cognitive buffer between you and the chaotic internet. Here you can coordinate your classes, manage looming deadline tasks, and forge permanent academic habits.
                  </p>
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                    <span className="text-xl">💡</span>
                    <p className="text-[11px] text-amber-800 leading-normal font-medium">
                      Your workspace is fully local and secure. Wiping your browser cache resets your system, but logging in as an existing user will restore pre-populated templates.
                    </p>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black text-neutral-800 tracking-tight">
                    The Study Arena & Pomodoro ⏳
                  </h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    Unlock peak learning workflows inside the **Study** tab. From standard Pomodoro block cycles to Socratic tutoring modules, everything is engineered to reduce fatigue and maximize cognitive retention.
                  </p>
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3 items-start">
                    <span className="text-xl">🔥</span>
                    <p className="text-[11px] text-indigo-800 leading-normal font-medium">
                      Complete your rituals in the **Streak** tab every day. If you complete all goals, your consistency forge grows. Stay dedicated!
                    </p>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black text-neutral-800 tracking-tight">
                    Awaji AI Copilot & Ambient Rain 🔮
                  </h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    Your copilot can add classes, establish deadline cards, increment streaks, or start pomodoro timers. Just ask in the **Awaji AI** chat interface!
                  </p>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 items-start">
                    <span className="text-xl">🌦️</span>
                    <p className="text-[11px] text-emerald-800 leading-normal font-medium">
                      Feeling overwhelmed? Express your emotion to the AI, and it will trigger soothing falling face rains corresponding to your energy level.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
                {onboardingStep > 1 ? (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => {
                    if (onboardingStep < 3) {
                      setOnboardingStep(onboardingStep + 1);
                    } else {
                      localStorage.setItem("awaji_onboarding_completed", "true");
                      setShowOnboarding(false);
                    }
                  }}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <span>{onboardingStep === 3 ? "Enter Study Sanctuary" : "Continue"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Elegant Left Transparent Sidebar */}
      <aside className={`w-64 bg-neutral-950 text-white lg:bg-transparent lg:glass-sidebar lg:text-neutral-800 shrink-0 p-6 flex flex-col justify-between h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="space-y-8 text-left">
          {/* Logo Brand Brand */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className={`p-2.5 bg-neutral-900 text-white rounded-2xl shadow-md block border border-neutral-800/60 lg:border-0`}>
                <GraduationCap size={20} className="animate-pulse" />
              </span>
              <div>
                <h1 className="font-display font-black text-lg text-white lg:text-neutral-800 leading-none flex items-center gap-1">
                  <span>Awaji</span>
                  <span className="text-xs font-mono font-bold text-awaji-gold uppercase px-1.5 py-0.5 bg-awaji-gold/10 rounded-md">
                    OS
                  </span>
                </h1>
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase block tracking-wider mt-0.5">
                  STUDY OPERATING SYSTEM
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer rounded-xl"
              aria-label="Close Sidebar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer min-h-[44px] ${
                    isActive
                      ? "bg-white text-neutral-950 lg:bg-neutral-900 lg:text-white shadow-md scale-[1.02]"
                      : "text-white/70 lg:text-neutral-500 hover:text-white lg:hover:text-neutral-800 hover:bg-white/10 lg:hover:bg-white/40"
                  }`}
                >
                  <IconComp size={15} className={isActive ? "text-awaji-gold" : "text-neutral-400/80 lg:text-neutral-400"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync Indicator / Info / Profile Signout */}
        <div className="pt-4 border-t border-neutral-800/60 lg:border-t-neutral-200/20 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-white lg:bg-neutral-900 rounded-full flex items-center justify-center text-[9px] font-bold text-neutral-950 lg:text-white uppercase border border-neutral-700/50">
                {currentUser ? currentUser.slice(0, 2) : "US"}
              </span>
              <span className="text-xs font-bold text-white lg:text-neutral-700 truncate max-w-[110px]">
                {currentUser}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] font-mono text-rose-400 hover:text-rose-500 lg:text-rose-500 lg:hover:text-rose-600 font-bold uppercase tracking-wider cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <div className="text-[9px] font-mono text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <span>AWAJI WORKSPACE PERSISTED</span>
          </div>
        </div>
      </aside>

      {/* Main Study Arena Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Dynamic header / breadcrumbs */}
        <header className="p-6 md:px-8 flex justify-between items-center bg-white/30 backdrop-blur-md border-b border-neutral-200/10 relative z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50 rounded-xl lg:hidden cursor-pointer"
              aria-label="Open Sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
              <span>Workspace</span>
              <span>&bull;</span>
              <span className="capitalize text-neutral-800 font-bold font-display">{activeTab}</span>
            </div>
          </div>

          {/* Quick Stats banner */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-neutral-200/50 text-left">
                <Flame size={12} className="text-amber-500 animate-bounce" />
                <div>
                  <span className="text-[9px] font-mono text-neutral-400 block leading-none font-bold">STREAK</span>
                  <span className="text-xs font-black text-neutral-800 font-display">{streakDays} Days</span>
                </div>
              </div>
            </div>

            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
              onNavigate={(tab) => setActiveTab(tab)}
              onAddCustomNotification={handleAddCustomNotification}
            />
          </div>
        </header>

        {/* Dynamic Panel Renderer */}
        <main className="p-6 md:p-8 flex-1 max-w-5xl w-full mx-auto">
          {activeTab === "home" && (
            <HomeSection
              onSelectTab={(tabId: any) => setActiveTab(tabId)}
              classes={classes}
              deadlines={deadlines}
            />
          )}

          {activeTab === "class" && (
            <ClassSection
              classes={classes}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onUpdateClasses={(updated) => {
                setClasses(updated);
                localStorage.setItem("awaji_classes", JSON.stringify(updated));
              }}
            />
          )}

          {activeTab === "deadline" && (
            <DeadlineSection
              deadlines={deadlines}
              classes={classes}
              onAddDeadline={handleAddDeadline}
              onToggleDeadline={handleToggleDeadline}
              onDeleteDeadline={handleDeleteDeadline}
              onUpdateDeadlines={(updated) => {
                setDeadlines(updated);
                localStorage.setItem("awaji_deadlines", JSON.stringify(updated));
              }}
            />
          )}

          {activeTab === "study" && (
            <StudySection
              classes={classes}
            />
          )}

          {activeTab === "guardian" && (
            <AwajiAISection />
          )}

          {activeTab === "mood" && (
            <MoodSection />
          )}

          {activeTab === "streak" && (
            <StreakSection />
          )}

          {activeTab === "theme" && (
            <ThemeSection
              currentTheme={theme}
              onSelectTheme={handleSelectTheme}
            />
          )}
        </main>

        {/* Footer info */}
        <footer className="p-6 text-center text-[10px] font-mono text-neutral-400 tracking-wider">
          © 2026 Awaji Student OS • Powered by Awaji• Made with Love🌸
        </footer>
      </div>
    </div>
  );
}
