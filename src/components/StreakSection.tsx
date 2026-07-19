import { useState, useEffect } from "react";
import { Flame, Trophy, Zap, Shield, Crown, CheckCircle } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  done: boolean;
}

export default function StreakSection() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("awaji_habits");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((h: Habit) => h.id !== "h3");
      } catch (e) {}
    }
    return [
      { id: "h1", name: "Complete 2 Pomodoro Sessions", done: false },
      { id: "h2", name: "Log Daily Class Lectures", done: false },
      { id: "h4", name: "Converse with Awaji AI", done: false }
    ];
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem("awaji_streak_days");
    return saved ? parseInt(saved, 10) : 0;
  });

  const toggleHabit = (id: string) => {
    const updated = habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h));
    setHabits(updated);
    localStorage.setItem("awaji_habits", JSON.stringify(updated));
    
    // Compute dynamic streak
    const completedCount = updated.filter((h) => h.done).length;
    const totalCount = updated.length;
    const allDone = totalCount > 0 && completedCount === totalCount;
    
    let savedStreak = localStorage.getItem("awaji_streak_days");
    let currentS = savedStreak ? parseInt(savedStreak, 10) : 0;
    if (allDone && currentS === 0) {
      currentS = 1;
    }
    setStreakDays(currentS);
    localStorage.setItem("awaji_streak_days", String(currentS));
    
    // Dispatch sync event with a custom source identifier to avoid self-sync loops
    window.dispatchEvent(new CustomEvent("awaji_sync_streak", { detail: { source: "streak_section" } }));
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("awaji_habits", JSON.stringify(habits));
  }, [habits]);

  // Listen to other components syncing (if they update habits or streak)
  useEffect(() => {
    const handleSync = (e: any) => {
      // Avoid self-updating when we are the source of the event
      if (e.detail?.source === "streak_section") return;

      const savedHabits = localStorage.getItem("awaji_habits");
      if (savedHabits) {
        try {
          const parsed = JSON.parse(savedHabits).filter((h: Habit) => h.id !== "h3");
          // Only update if different to avoid infinite render loops
          setHabits((curr) => {
            const isSame = curr.length === parsed.length && 
              curr.every((h, idx) => h.id === parsed[idx].id && h.done === parsed[idx].done && h.name === parsed[idx].name);
            return isSame ? curr : parsed;
          });
        } catch (e) {}
      }
      const savedStreak = localStorage.getItem("awaji_streak_days");
      if (savedStreak) {
        const parsedStreak = parseInt(savedStreak, 10);
        setStreakDays((curr) => (curr === parsedStreak ? curr : parsedStreak));
      }
    };
    window.addEventListener("awaji_sync_streak", handleSync as EventListener);
    return () => window.removeEventListener("awaji_sync_streak", handleSync as EventListener);
  }, []);

  const completedCount = habits.filter((h) => h.done).length;
  const totalCount = habits.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const unlockedBadges = [
    { name: "Novice Scribe", desc: "Initiated first study block", icon: Zap, color: "text-amber-500 bg-amber-50 border-amber-100" },
    { name: "Deep Work Engine", desc: "5 hours of total focus logs", icon: Shield, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
    { name: "Sage Architect", desc: "Created 5 custom study courses", icon: Crown, color: "text-rose-500 bg-rose-50 border-rose-100" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-left animate-fade-in" id="streak-section">
      {/* Left side: Habits and streak stats */}
      <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
            Module 05
          </span>
          <h2 className="text-xl font-display font-black text-neutral-800 tracking-tight mt-1">
            Consistency Streak Forge
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5 mb-4">
            Study habits aren't built in a day, but in daily intervals. Power up your streak forge.
          </p>

          {/* Daily Goals Checklists */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-2">
              Daily Core Rituals
            </span>
            {habits.map((h) => (
              <button
                key={h.id}
                id={`btn-habit-${h.id}`}
                type="button"
                onClick={() => toggleHabit(h.id)}
                className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  h.done
                    ? "bg-emerald-50/50 border-emerald-200 text-neutral-700"
                    : "bg-white border-neutral-150 hover:border-neutral-200 text-neutral-600"
                }`}
              >
                <span>{h.name}</span>
                <CheckCircle size={15} className={h.done ? "text-emerald-500" : "text-neutral-300"} />
              </button>
            ))}
          </div>
        </div>

        {/* Streak visual progress */}
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <div className="flex justify-between items-center text-xs mb-3">
            <span className="font-bold text-neutral-700">Forge Progress</span>
            <span className="font-mono text-[10px] text-neutral-500">
              {completedCount} / {totalCount} Rituals Completed
            </span>
          </div>
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right side: Trophies cabinet and scholar badges */}
      <div className="lg:col-span-5 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-3">
            Trophy & Ranks Cabinet
          </h3>

          <div className="space-y-3">
            {unlockedBadges.map((badge, idx) => {
              const IconComp = badge.icon;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${badge.color}`}
                >
                  <span className="p-2 bg-white/90 border border-neutral-150/40 rounded-xl block shrink-0 shadow-sm">
                    <IconComp size={16} />
                  </span>
                  <div>
                    <h4 className="font-display font-black text-xs text-neutral-800 leading-none">
                      {badge.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-light mt-1 leading-normal">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic streak quote */}
        <div className="bg-neutral-900 text-white rounded-2xl p-4 flex gap-3 items-center">
          <span className="p-2.5 bg-white/10 text-awaji-gold rounded-xl">
            <Flame size={16} className="animate-pulse" />
          </span>
          <div>
            <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">
              Active Streak: {streakDays} Days
            </span>
            <span className="text-xs font-serif italic text-white leading-tight">
              {percentage === 100 
                ? `"All rituals forged! Your consistency streak is hot at ${streakDays} days!"`
                : `"Complete all core rituals to heat up your consistency forge!"`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
