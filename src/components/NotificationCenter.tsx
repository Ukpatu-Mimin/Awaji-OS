import { useState, useEffect, useRef, FormEvent } from "react";
import { Bell, Check, Trash2, CalendarClock, BookOpen, Flame, Sparkles, Info, X, Radio } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NotificationItem } from "../types";

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigate: (tab: any) => void;
  onAddCustomNotification?: (title: string, message: string, type: any) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigate,
  onAddCustomNotification
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return <CalendarClock className="text-rose-500" size={15} />;
      case "class":
        return <BookOpen className="text-indigo-500" size={15} />;
      case "streak":
        return <Flame className="text-amber-500" size={15} />;
      case "guardian":
        return <Sparkles className="text-purple-500" size={15} />;
      default:
        return <Info className="text-sky-500" size={15} />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-neutral-50/50 hover:bg-neutral-100/50";
    switch (type) {
      case "deadline":
        return "bg-rose-50/70 border-l-4 border-l-rose-500 hover:bg-rose-50";
      case "class":
        return "bg-indigo-50/70 border-l-4 border-l-indigo-500 hover:bg-indigo-50";
      case "streak":
        return "bg-amber-50/70 border-l-4 border-l-amber-500 hover:bg-amber-50";
      case "guardian":
        return "bg-purple-50/70 border-l-4 border-l-purple-500 hover:bg-purple-50";
      default:
        return "bg-sky-50/70 border-l-4 border-l-sky-500 hover:bg-sky-50";
    }
  };

  // Mock Generator for user testing
  const [testTitle, setTestTitle] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testType, setTestType] = useState<"general" | "deadline" | "class" | "streak" | "guardian">("general");
  const [showGenerator, setShowGenerator] = useState(false);

  const handleCreateTest = (e: FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testMsg.trim()) return;
    if (onAddCustomNotification) {
      onAddCustomNotification(testTitle, testMsg, testType);
    }
    setTestTitle("");
    setTestMsg("");
    setShowGenerator(false);
  };

  return (
    <div className="relative" ref={dropdownRef} id="notification-center-module">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-xl border border-neutral-200/50 text-neutral-600 hover:text-neutral-950 transition-all duration-200 cursor-pointer flex items-center justify-center relative active:scale-95 shadow-xs"
        id="bell-trigger-button"
        title="Study Workspace Notifications"
      >
        <Bell size={16} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] text-white font-bold items-center justify-center font-mono">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-lg border border-neutral-200/60 rounded-3xl shadow-xl z-[100] overflow-hidden text-left"
            id="notification-dropdown-panel"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-neutral-900 text-white rounded-lg">
                  <Bell size={13} />
                </span>
                <div>
                  <h4 className="font-display font-black text-xs text-neutral-800">
                    Real-time Notifications
                  </h4>
                  <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                    {unreadCount} UNREAD LOGS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 hover:bg-neutral-200/50 rounded-lg text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <Check size={13} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="p-1.5 hover:bg-neutral-200/50 text-neutral-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                    title="Clear all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-neutral-200/50 text-neutral-400 hover:text-neutral-600 rounded-lg cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Quick Simulation Trigger */}
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-100 flex items-center justify-between text-[10px]">
              <span className="text-amber-900 font-medium flex items-center gap-1">
                <Radio size={11} className="animate-pulse" />
                <span>Simulate / test real-time alerts?</span>
              </span>
              <button
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-[9px] font-mono font-black text-amber-700 bg-amber-200/50 hover:bg-amber-200 px-2 py-0.5 rounded uppercase cursor-pointer"
              >
                {showGenerator ? "Hide" : "Open"}
              </button>
            </div>

            {/* Test Alert Builder Drawer */}
            {showGenerator && (
              <form onSubmit={handleCreateTest} className="p-4 bg-neutral-50 border-b border-neutral-100 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Notification Title..."
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border bg-white focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      required
                      placeholder="Alert details or message description..."
                      value={testMsg}
                      onChange={(e) => setTestMsg(e.target.value)}
                      rows={2}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border bg-white focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <select
                      value={testType}
                      onChange={(e: any) => setTestType(e.target.value)}
                      className="w-full text-[10px] py-1 px-1.5 border rounded bg-white font-semibold"
                    >
                      <option value="general">General</option>
                      <option value="deadline">Deadline</option>
                      <option value="class">Class Desk</option>
                      <option value="streak">Streak Quest</option>
                      <option value="guardian">AI Companion</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-neutral-900 text-white rounded text-[10px] font-bold hover:bg-neutral-800"
                    >
                      Trigger Alert
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Scrollable notification list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <span className="p-2.5 bg-neutral-50 border text-neutral-300 rounded-full inline-block">
                    <Bell size={18} />
                  </span>
                  <p className="text-xs text-neutral-500 font-bold">Your Workspace is peaceful</p>
                  <p className="text-[10px] text-neutral-400 font-light">
                    No active notifications or upcoming deadlines currently flagged.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-all duration-200 flex gap-3 relative ${getBgColor(
                      notif.type,
                      notif.isRead
                    )}`}
                  >
                    {/* Icon Column */}
                    <div className="shrink-0 pt-0.5">
                      <span className="p-1.5 bg-white rounded-lg shadow-xs border border-black/5 block">
                        {getIcon(notif.type)}
                      </span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className={`text-xs font-bold leading-snug ${notif.isRead ? "text-neutral-600" : "text-neutral-900"}`}>
                          {notif.title}
                        </h5>
                        <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Interactive Section Link button */}
                      <div className="pt-2 flex justify-between items-center">
                        <button
                          onClick={() => {
                            onNavigate(notif.targetTab);
                            setIsOpen(false);
                          }}
                          className="text-[9px] font-mono font-black text-neutral-700 hover:text-awaji-gold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Module</span>
                          <span>&rarr;</span>
                        </button>

                        {!notif.isRead && (
                          <button
                            onClick={() => onMarkAsRead(notif.id)}
                            className="text-[9px] font-mono font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-neutral-100 text-center bg-neutral-50/30">
                <span className="text-[9px] font-mono text-neutral-400">
                  REAL-TIME ALERTS AUTOMATICALLY REFRESHED
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
