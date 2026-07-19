import { useState, useEffect, FormEvent } from "react";
import { Play, Pause, Trash2, Heart } from "lucide-react";

interface MoodLog {
  id: string;
  mood: string; // "happy" | "sad" | "anxious" | "anger" | "numb" | "tired"
  note: string;
  timestamp: string;
  dateKey: string; // "YYYY-MM-DD"
}

interface RainItem {
  id: number;
  x: number; // percentage
  delay: number; // seconds
  duration: number; // seconds
  size: number; // px
  emoji: string;
  colorClass: string;
}

const getDkey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function MoodSection() {
  const moods = [
    { label: "happy", emoji: "😄", color: "bg-amber-50 border-amber-200/60 text-amber-600 hover:bg-amber-100/60", activeColor: "bg-amber-500 text-white border-amber-600 shadow-md", textColor: "text-amber-500" },
    { label: "sad", emoji: "😢", color: "bg-blue-50 border-blue-200/60 text-blue-600 hover:bg-blue-100/60", activeColor: "bg-blue-500 text-white border-blue-600 shadow-md", textColor: "text-blue-500" },
    { label: "anxious", emoji: "😰", color: "bg-orange-50 border-orange-200/60 text-orange-600 hover:bg-orange-100/60", activeColor: "bg-orange-500 text-white border-orange-600 shadow-md", textColor: "text-orange-500" },
    { label: "anger", emoji: "😡", color: "bg-red-50 border-red-200/60 text-red-600 hover:bg-red-100/60", activeColor: "bg-red-500 text-white border-red-600 shadow-md", textColor: "text-red-500" },
    { label: "numb", emoji: "😑", color: "bg-neutral-100 border-neutral-300/60 text-neutral-600 hover:bg-neutral-200/60", activeColor: "bg-neutral-600 text-white border-neutral-700 shadow-md", textColor: "text-neutral-500" },
    { label: "tired", emoji: "🥱", color: "bg-purple-50 border-purple-200/60 text-purple-600 hover:bg-purple-100/60", activeColor: "bg-purple-500 text-white border-purple-600 shadow-md", textColor: "text-purple-500" }
  ];

  // Generate some realistic historical heatmap logs if user has never saved any logs
  const generateMockHeatmapData = () => {
    const logs: MoodLog[] = [];
    const today = new Date();
    const emotions = ["happy", "sad", "anxious", "anger", "numb", "tired"];
    const notes = [
      "Had a wonderful, productive lecture!",
      "A bit down, took a quick cocoa break.",
      "Stressed about the upcoming midterms.",
      "Spent an hour debugging compile errors.",
      "Just zoning out and listening to lofi.",
      "Long study marathon, extremely sleepy."
    ];

    // Populating ~120 historical random mood logs spread over the last 365 days
    for (let i = 1; i <= 365; i++) {
      if (Math.random() < 0.28) { // 28% log density
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        const emotionIdx = Math.floor(Math.random() * emotions.length);
        const dKey = getDkey(pastDate);

        logs.push({
          id: `mock-${i}`,
          mood: emotions[emotionIdx],
          note: notes[emotionIdx],
          timestamp: "Historical Log",
          dateKey: dKey
        });
      }
    }
    return logs;
  };

  const currentUser = typeof window !== "undefined" ? (localStorage.getItem("awaji_current_user") || "guest") : "guest";
  const userKey = "awaji_mood_logs_" + currentUser.toLowerCase();

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [selectedMood, setSelectedMood] = useState<string>("happy");
  const [note, setNote] = useState<string>("");
  const [hoveredLog, setHoveredLog] = useState<{
    date: string;
    mood: string;
    emoji: string;
    note: string;
  } | null>(null);

  // Breathing Coach states
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathSeconds, setBreathSeconds] = useState<number>(4);

  // Sync to local storage
  useEffect(() => {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        setMoodLogs(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setMoodLogs([]);
  }, [userKey]);

  useEffect(() => {
    localStorage.setItem(userKey, JSON.stringify(moodLogs));
  }, [moodLogs, userKey]);

  // Breathing interval controller
  useEffect(() => {
    let interval: any = null;
    if (isBreathing) {
      interval = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            setBreathPhase((currentPhase) => {
              if (currentPhase === "Inhale") return "Hold";
              if (currentPhase === "Hold") return "Exhale";
              return "Inhale";
            });
            return 4; // Reset duration (4s cycles)
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
      setBreathSeconds(4);
      setBreathPhase("Inhale");
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  // Rain animation trigger
  const triggerRainEffect = (moodLabel: string) => {
    // Dispatch global event so the entire screen gets the emoji rain!
    window.dispatchEvent(new CustomEvent("awaji_trigger_emoji_rain", { detail: moodLabel }));
  };

  const handleAddLog = (e: FormEvent) => {
    e.preventDefault();
    const todayStr = getDkey(new Date());

    const sanitizedNote = note.replace(/<[^>]*>/g, "").trim();

    const newLog: MoodLog = {
      id: "mood-" + Date.now(),
      mood: selectedMood,
      note: sanitizedNote || `Feeling ${selectedMood}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateKey: todayStr
    };

    // Filter out previous logs from today so today's cell gets updated to the latest mood
    const filtered = moodLogs.filter(log => log.dateKey !== todayStr);
    setMoodLogs([newLog, ...filtered]);
    setNote("");

    // Trigger the rain effect!
    triggerRainEffect(selectedMood);
  };

  const handleClearLogs = () => {
    if (confirm("Reset historical mood tracker? This will wipe your logs and heatmap.")) {
      setMoodLogs([]);
      localStorage.removeItem("awaji_mood_logs");
    }
  };

  // 365 Days dates grid logic
  const getHeatmapGrid = () => {
    const grid: Date[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      grid.push(d);
    }
    return grid;
  };

  const gridDates = getHeatmapGrid();
  const firstDayOfWeek = gridDates[0].getDay(); // 0 to 6
  const spacers = Array.from({ length: firstDayOfWeek });

  const getHeatmapCellColor = (mood: string) => {
    switch (mood) {
      case "happy": return "bg-amber-400 border border-amber-500/20";
      case "sad": return "bg-blue-400 border border-blue-500/20";
      case "anxious": return "bg-orange-400 border border-orange-500/20";
      case "anger": return "bg-red-400 border border-red-500/20";
      case "numb": return "bg-neutral-400 border border-neutral-500/20";
      case "tired": return "bg-purple-400 border border-purple-500/20";
      default: return "bg-neutral-100";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left relative" id="mood-section">
      {/* Stylesheet injection for fallback keyframes */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d4;
        }
      `}</style>

      {/* Hero Header */}
      <div>
        <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
          Emotional Well-being Module
        </span>
        <h2 className="text-xl font-display font-black text-neutral-800 tracking-tight mt-1">
          Vibe & Mind Check
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Map your daily cognitive energies, activate rain shower releases, and regulate through sensory pacing.
        </p>
      </div>

      {/* Top row: Vibe Logger Panel + Recent Mood Entries */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        {/* Logger Panel */}
        <div className="xl:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm space-y-5">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Log How You Feel
            </h3>
            <p className="text-[11px] text-neutral-500 font-light leading-relaxed mt-0.5">
              Select your emotional state to activate an atmospheric drizzle of its emojis, updating your 365-day heat ledger.
            </p>
          </div>

          {/* Emotional selection grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {moods.map((m) => {
              const isSelected = selectedMood === m.label;
              return (
                <button
                  key={m.label}
                  id={`btn-select-mood-${m.label}`}
                  type="button"
                  onClick={() => {
                    setSelectedMood(m.label);
                    triggerRainEffect(m.label);
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? m.activeColor + " scale-102"
                      : m.color + " border-neutral-200/60 text-neutral-500"
                  }`}
                >
                  <span className="text-2xl select-none" role="img" aria-label={m.label}>
                    {m.emoji}
                  </span>
                  <span className="text-[11px] font-bold capitalize tracking-tight">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Note & submission */}
          <form onSubmit={handleAddLog} className="space-y-3.5 pt-1">
            <div className="relative">
              <input
                type="text"
                id="mood-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`Why are you feeling ${selectedMood} today? (Optional)`}
                className="w-full text-xs px-4 py-3.5 rounded-2xl border border-neutral-200 focus:outline-none focus:border-indigo-400 bg-white/60 focus:bg-white text-neutral-800 shadow-xs font-semibold placeholder:font-light"
              />
            </div>
            <button
              type="submit"
              id="submit-mood-log"
              className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-widest font-extrabold cursor-pointer transition-all active:scale-[0.98] shadow-sm"
            >
              💾 Add Log
            </button>
          </form>
        </div>

        {/* Recent Entries Panel */}
        <div className="xl:col-span-5 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-150 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                Recent Mood Entries
              </span>
              <button
                id="btn-clear-mood-logs"
                onClick={handleClearLogs}
                className="text-[10px] font-mono text-neutral-400 hover:text-rose-600 cursor-pointer flex items-center gap-1 transition-colors animate-pulse"
              >
                <Trash2 size={11} /> Clear All
              </button>
            </div>

            {/* Scrollable list */}
            <div className="space-y-2.5 max-h-[195px] overflow-y-auto custom-scrollbar pr-1">
              {moodLogs.length > 0 ? (
                moodLogs.slice(0, 8).map((log) => {
                  const currentMoodObj = moods.find(m => m.label === log.mood);
                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-neutral-50/50 rounded-2xl border border-neutral-150 flex items-start gap-3 transition-all hover:bg-neutral-50"
                    >
                      {/* Little circle badge with Emoji */}
                      <div className={`w-8 h-8 flex items-center justify-center rounded-xl border shrink-0 text-lg ${currentMoodObj?.color || "bg-neutral-100 border-neutral-200"}`}>
                        <span className="select-none">{currentMoodObj?.emoji || "🔮"}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-neutral-800 capitalize leading-none">
                            {log.mood}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono tracking-tighter leading-none shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-light mt-1 break-words">
                          {log.note}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-neutral-400 text-xs font-light">
                  No recorded sessions. Select a mood to log.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: 365-Day Academic Vibe Heatmap + Respiration Coach (Side by Side) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        {/* Heatmap Section */}
        <div className="xl:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                365-Day Emotional Landscape
              </h3>
              <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                Visual mapping of your cognitive trends. Hover over any block to reveal date logs.
              </p>
            </div>

            {/* Github Style Calendar Wrapper */}
            <div className="border border-neutral-150 p-4 rounded-2xl bg-neutral-50/30 flex items-start gap-2.5 overflow-hidden">
              {/* Day of week labels */}
              <div className="grid grid-rows-7 gap-1 text-[8px] font-mono text-neutral-400 pr-1 select-none pt-[1px] h-[78px] justify-between">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Grid block */}
              <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1.5 flex-1 custom-scrollbar h-[94px]">
                {/* Spacers to align dates correctly with days of week */}
                {spacers.map((_, idx) => (
                  <div key={`spacer-${idx}`} className="w-2.5 h-2.5 bg-transparent" />
                ))}

                {/* Real Days */}
                {gridDates.map((date) => {
                  const dKey = getDkey(date);
                  const dayLog = moodLogs.find(log => log.dateKey === dKey);
                  const cellColor = getHeatmapCellColor(dayLog ? dayLog.mood : "");
                  const moodObj = dayLog ? moods.find(m => m.label === dayLog.mood) : null;
                  const formattedDate = date.toLocaleDateString(undefined, { dateStyle: "medium" });

                  return (
                    <div
                      key={dKey}
                      className={`w-2.5 h-2.5 rounded-[2px] transition-all cursor-pointer relative ${cellColor} hover:scale-115 hover:z-10`}
                      title={dayLog ? `${formattedDate}: ${moodObj?.emoji || "🔮"} ${dayLog.mood} — "${dayLog.note}"` : `${formattedDate}: No logged entry`}
                      onMouseEnter={() => {
                        setHoveredLog({
                          date: formattedDate,
                          mood: dayLog ? dayLog.mood : "No logged entry",
                          emoji: dayLog ? (moodObj?.emoji || "🔮") : "⚪",
                          note: dayLog ? dayLog.note : ""
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredLog(null);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hover detail line */}
          <div className="text-[11px] min-h-[1.5rem] flex items-center justify-start border-t border-neutral-150 pt-3 text-neutral-600 font-mono">
            {hoveredLog ? (
              <span className="animate-fade-in text-neutral-700 flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-neutral-400">{hoveredLog.date}:</span>
                <span>{hoveredLog.emoji}</span>
                <span className="capitalize font-bold text-neutral-800">{hoveredLog.mood}</span>
                {hoveredLog.note && <span className="text-neutral-500 font-light truncate max-w-[280px] sm:max-w-[400px]">({hoveredLog.note})</span>}
              </span>
            ) : (
              <span className="text-neutral-400 font-light italic">Hover over any block to reveal daily vibe details</span>
            )}
          </div>

          {/* Heatmap Footer Legend & stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-neutral-100/60 pt-3">
            <div className="flex items-center gap-2">
              <span>Vibe Key:</span>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <div key={m.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-[2px] ${getHeatmapCellColor(m.label)}`} />
                    <span className="capitalize text-[9px] text-neutral-500">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Respiration Coach Card (Side by Side) */}
        <div className="xl:col-span-5 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Rhythmic Respiration Coach
            </h3>
            <p className="text-[11px] text-neutral-500 font-light mt-1 max-w-xs mx-auto leading-relaxed">
              Realign your nervous system. Follow this 4s box breathing interval to relieve academic fatigue.
            </p>
          </div>

          {/* Interactive Breathing circle */}
          <div className="my-10 relative flex items-center justify-center">
            {/* Outer pulsing layer */}
            <div
              className={`absolute w-44 h-44 rounded-full border border-dashed border-neutral-200 transition-all duration-1000 ${
                isBreathing && breathPhase === "Inhale" ? "scale-135 bg-emerald-500/5 border-emerald-300" : ""
              } ${
                isBreathing && breathPhase === "Hold" ? "scale-135 bg-amber-500/5 border-amber-300" : ""
              } ${
                isBreathing && breathPhase === "Exhale" ? "scale-[1.05] bg-rose-500/5 border-rose-300" : ""
              }`}
            />

            {/* Core visual circle */}
            <div
              className={`w-36 h-36 rounded-full border-2 border-neutral-100 flex flex-col items-center justify-center transition-all duration-1000 shadow-xs z-10 ${
                isBreathing
                  ? breathPhase === "Inhale"
                    ? "scale-120 bg-emerald-50/70 border-emerald-300 text-emerald-800"
                    : breathPhase === "Hold"
                    ? "scale-120 bg-amber-50/70 border-amber-300 text-amber-800"
                    : "scale-90 bg-rose-50/70 border-rose-300 text-rose-800"
                  : "bg-white text-neutral-800"
              }`}
            >
              {isBreathing ? (
                <>
                  <span className="text-base font-display font-black tracking-tight">
                    {breathPhase}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 mt-1">
                    {breathSeconds}s left
                  </span>
                </>
              ) : (
                <>
                  <Heart size={20} className="text-rose-400 animate-pulse mb-1.5" />
                  <span className="text-xs font-bold text-neutral-600">Zen Active</span>
                  <span className="text-[9px] font-mono text-neutral-400 mt-0.5">Ready to guide</span>
                </>
              )}
            </div>
          </div>

          {/* Control button */}
          <button
            id="btn-toggle-breathing"
            type="button"
            onClick={() => setIsBreathing(!isBreathing)}
            className={`w-full py-3 rounded-2xl text-xs font-mono uppercase tracking-widest font-extrabold shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 ${
              isBreathing
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            {isBreathing ? <Pause size={13} /> : <Play size={13} />}
            <span>{isBreathing ? "Pause Respiration" : "Begin Box Breathing"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
