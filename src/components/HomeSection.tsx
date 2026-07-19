import { useState, useEffect } from "react";
import FeatureCarousel from "./FeatureCarousel";
import { Smile, Flame, Sparkles, Trophy, BookOpen, CalendarCheck } from "lucide-react";
import { ClassSubject, DeadlineTask } from "../types";

interface HomeSectionProps {
  onSelectTab: (tabId: string) => void;
  classes: ClassSubject[];
  deadlines: DeadlineTask[];
}

export default function HomeSection({ onSelectTab, classes, deadlines }: HomeSectionProps) {
  const pendingCount = deadlines.filter((d) => d.status !== "completed").length;

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem("awaji_streak_days");
    return saved ? parseInt(saved, 10) : 5;
  });

  const [percentage, setPercentage] = useState<number>(() => {
    const savedHabits = localStorage.getItem("awaji_habits");
    if (savedHabits) {
      try {
        const parsed = JSON.parse(savedHabits);
        const completedCount = parsed.filter((h: any) => h.done).length;
        const totalCount = parsed.length;
        return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      } catch (e) {}
    }
    return 66; // Initial fallback (2/3 is ~66%)
  });

  useEffect(() => {
    const handleSync = () => {
      const savedStreak = localStorage.getItem("awaji_streak_days");
      if (savedStreak) {
        setStreakDays(parseInt(savedStreak, 10));
      }
      const savedHabits = localStorage.getItem("awaji_habits");
      if (savedHabits) {
        try {
          const parsed = JSON.parse(savedHabits);
          const completedCount = parsed.filter((h: any) => h.done).length;
          const totalCount = parsed.length;
          setPercentage(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);
        } catch (e) {}
      }
    };
    window.addEventListener("awaji_sync_streak", handleSync);
    // Initial check on mount
    handleSync();
    return () => window.removeEventListener("awaji_sync_streak", handleSync);
  }, []);

  return (
    <div className="space-y-8 text-left animate-fade-in" id="home-section">
      {/* Immersive Welcome Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scholar Banner */}
        <div className="md:col-span-2 bg-gradient-to-br from-neutral-800 to-neutral-950 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden border border-neutral-800 shadow-xl flex flex-col justify-between min-h-[180px]">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-awaji-gold/10 blur-3xl pointer-events-none -translate-y-12 translate-x-12" />
          
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
              Cognitive Companion v1.2
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight">
              Welcome to your Study Sanctuary
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 font-light max-w-lg leading-relaxed">
              Awaji coordinates your schedule, tasks, cognitive focus intervals, and mental health. Let's make today highly productive!
            </p>
          </div>

          <div className="flex gap-4 items-center pt-4 relative z-10">
            <button
              id="cta-study-arena"
              onClick={() => onSelectTab("study")}
              className="px-4 py-2 bg-awaji-gold hover:bg-awaji-gold-dark text-neutral-900 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              <Flame size={13} className="text-neutral-900" />
              <span>Enter Study Arena</span>
            </button>
            <button
              id="cta-ask-ai"
              onClick={() => onSelectTab("guardian")}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-medium border border-white/10 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles size={13} className="text-awaji-gold" />
              <span>Ask Awaji AI</span>
            </button>
          </div>
        </div>

        {/* Quick Streak Card */}
        <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Current Streak
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
              <Trophy size={14} />
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-display font-black text-neutral-800">{streakDays}</span>
            <span className="text-sm font-semibold text-neutral-500">Days Active</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-awaji-gold h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-[10px] text-neutral-500 flex items-center gap-1">
              <Flame size={10} className="text-amber-500 animate-bounce shrink-0" />
              <span>{percentage === 100 ? "All rituals forged! Streak secured." : "Complete core rituals in 'Streak' to secure today!"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mini Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Classes Card */}
        <div
          onClick={() => onSelectTab("class")}
          className="bg-white hover:border-awaji-gold border border-neutral-200/50 p-5 rounded-2xl shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md flex items-center justify-between group"
          id="mini-class-card"
        >
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen size={16} />
            </span>
            <div>
              <span className="text-neutral-800 font-display font-bold text-xs">Today's Lectures</span>
              <span className="text-[10px] text-neutral-500 block">{classes.length} registered classes</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        {/* Deadlines Card */}
        <div
          onClick={() => onSelectTab("deadline")}
          className="bg-white hover:border-awaji-gold border border-neutral-200/50 p-5 rounded-2xl shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md flex items-center justify-between group"
          id="mini-deadline-card"
        >
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform">
              <CalendarCheck size={16} />
            </span>
            <div>
              <span className="text-neutral-800 font-display font-bold text-xs">Due Deliverables</span>
              <span className="text-[10px] text-neutral-500 block">{pendingCount} assignments left</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            {pendingCount} Pending
          </span>
        </div>

        {/* Motivational Card */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Smile size={16} />
            </span>
            <div>
              <span className="text-neutral-800 font-display font-bold text-xs">Zen Quote of the Day</span>
              <span className="text-[10px] italic text-neutral-500 block">"The secret of getting ahead is getting started."</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Carousel Section */}
      <div className="pt-2">
        <FeatureCarousel onSelectFeature={onSelectTab} />
      </div>
    </div>
  );
}
