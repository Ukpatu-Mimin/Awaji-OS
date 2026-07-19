import { useState, FormEvent } from "react";
import { DeadlineTask, ClassSubject, SubTask } from "../types";
import { 
  Plus, Trash2, Calendar, CheckSquare, Square, CheckCircle, 
  Kanban, List, ArrowLeft, ArrowRight, Circle, Clock, Tag, 
  ChevronDown, ChevronUp, AlertTriangle, Sparkles, X
} from "lucide-react";

interface DeadlineSectionProps {
  deadlines: DeadlineTask[];
  classes: ClassSubject[];
  onAddDeadline: (newDeadline: DeadlineTask) => void;
  onToggleDeadline: (deadlineId: string) => void;
  onDeleteDeadline: (deadlineId: string) => void;
  onUpdateDeadlines?: (updatedDeadlines: DeadlineTask[]) => void;
}

export default function DeadlineSection({
  deadlines,
  classes,
  onAddDeadline,
  onToggleDeadline,
  onDeleteDeadline,
  onUpdateDeadlines,
}: DeadlineSectionProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [estimatedHours, setEstimatedHours] = useState<number>(2);

  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTexts, setNewSubtaskTexts] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const newDl: DeadlineTask = {
      id: "dl-" + Date.now(),
      title,
      subjectId: subjectId || "general",
      dueDate,
      status: "pending",
      priority,
      difficulty,
      estimatedHours,
      subTasks: []
    };

    onAddDeadline(newDl);
    setTitle("");
    setSubjectId("");
    setDueDate("");
    setPriority("medium");
    setDifficulty("medium");
    setEstimatedHours(2);
    setShowAddForm(false);
  };

  const getPriorityBadge = (p: "low" | "medium" | "high") => {
    switch (p) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
  };

  const getDifficultyBadge = (d: "easy" | "medium" | "hard") => {
    switch (d) {
      case "hard":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "medium":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "easy":
        return "bg-teal-50 text-teal-700 border-teal-100";
    }
  };

  const getSubjectCode = (id: string) => {
    if (id === "general") return "GENERAL";
    const found = classes.find((c) => c.id === id);
    return found ? found.code : "GENERAL";
  };

  // Helper to trigger list updates
  const updateDeadlinesArray = (updated: DeadlineTask[]) => {
    if (onUpdateDeadlines) {
      onUpdateDeadlines(updated);
    } else {
      // Local fallback to trigger rerender if prop is missing (should be there)
      console.warn("onUpdateDeadlines prop missing in DeadlineSection");
    }
  };

  // Subtask Helpers
  const handleAddSubtask = (taskId: string, e: FormEvent) => {
    e.preventDefault();
    const text = newSubtaskTexts[taskId]?.trim();
    if (!text) return;

    const updated = deadlines.map((dl) => {
      if (dl.id === taskId) {
        const currentSubtasks = dl.subTasks || [];
        const newSub: SubTask = {
          id: "sub-" + Date.now(),
          title: text,
          completed: false
        };
        return {
          ...dl,
          subTasks: [...currentSubtasks, newSub]
        };
      }
      return dl;
    });

    updateDeadlinesArray(updated);
    setNewSubtaskTexts({ ...newSubtaskTexts, [taskId]: "" });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = deadlines.map((dl) => {
      if (dl.id === taskId) {
        const currentSubtasks = dl.subTasks || [];
        return {
          ...dl,
          subTasks: currentSubtasks.map((sub) => 
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          )
        };
      }
      return dl;
    });
    updateDeadlinesArray(updated);
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = deadlines.map((dl) => {
      if (dl.id === taskId) {
        const currentSubtasks = dl.subTasks || [];
        return {
          ...dl,
          subTasks: currentSubtasks.filter((sub) => sub.id !== subtaskId)
        };
      }
      return dl;
    });
    updateDeadlinesArray(updated);
  };

  // Move task status helper
  const handleMoveStatus = (taskId: string, newStatus: "pending" | "in_progress" | "completed") => {
    const updated = deadlines.map((dl) => {
      if (dl.id === taskId) {
        return { ...dl, status: newStatus };
      }
      return dl;
    });
    updateDeadlinesArray(updated);
  };

  const getSubtaskProgress = (dl: DeadlineTask) => {
    const subs = dl.subTasks || [];
    if (subs.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = subs.filter((s) => s.completed).length;
    return {
      completed,
      total: subs.length,
      percentage: Math.round((completed / subs.length) * 100)
    };
  };

  // Filter tasks based on status & criteria
  const filteredDeadlines = deadlines.filter((dl) => {
    if (viewMode === "kanban") return true; // Let Kanban handle rendering by status columns
    if (filter === "pending") return dl.status === "pending" || dl.status === "in_progress";
    if (filter === "completed") return dl.status === "completed";
    return true;
  });

  // Calculate sum of estimated workload hours for Kanban columns
  const getWorkloadForStatus = (status: "pending" | "in_progress" | "completed") => {
    return deadlines
      .filter((dl) => dl.status === status)
      .reduce((sum, dl) => sum + (dl.estimatedHours || 0), 0);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="deadline-section">
      {/* Header Panel */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
            Module 02
          </span>
          <h2 className="text-2xl font-display font-black text-neutral-800 tracking-tight">
            Deadline & Workload Board
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Optimize time blocks. Track subtask actions. Prevent grade penalties.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {/* View Toggle */}
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/50">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === "list"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
              title="Kanban Board"
            >
              <Kanban size={14} />
            </button>
          </div>

          <button
            id="btn-toggle-add-dl"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <Plus size={14} />
            <span>{showAddForm ? "Hide Form" : "Schedule Deliverable"}</span>
          </button>
        </div>
      </div>

      {/* Add Task Form Panel */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/50 shadow-md space-y-4 animate-fade-in"
          id="add-dl-form"
        >
          <h3 className="font-display font-extrabold text-neutral-800 text-sm flex items-center gap-1.5">
            <Sparkles size={14} className="text-awaji-gold animate-pulse" />
            <span>Deliverable Workload Matrix Particulars</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Deliverable / Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deliver Midterm Presentation Outline"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Associated Course Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-600 bg-white"
              >
                <option value="general">General / Independent Studies</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    [{cls.code}] {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Priority Urgency Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-[10px] font-mono uppercase tracking-wider font-bold rounded-xl border transition-all cursor-pointer ${
                      priority === p
                        ? p === "high"
                          ? "bg-rose-50 text-rose-700 border-rose-400"
                          : p === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-400"
                          : "bg-emerald-50 text-emerald-700 border-emerald-400"
                        : "bg-white text-neutral-400 border-neutral-200 hover:text-neutral-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Rating */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Cognitive Difficulty Rating
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 text-[10px] font-mono uppercase tracking-wider font-bold rounded-xl border transition-all cursor-pointer ${
                      difficulty === d
                        ? d === "hard"
                          ? "bg-purple-50 text-purple-700 border-purple-400"
                          : d === "medium"
                          ? "bg-sky-50 text-sky-700 border-sky-400"
                          : "bg-teal-50 text-teal-700 border-teal-400"
                        : "bg-white text-neutral-400 border-neutral-200 hover:text-neutral-600"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Workload hours estimation */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Estimated Study Hours Required
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value))}
                  className="flex-1 accent-neutral-800"
                />
                <span className="text-xs font-bold font-mono px-3 py-1.5 bg-neutral-100 rounded-lg text-neutral-700 w-16 text-center">
                  {estimatedHours}h
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              id="submit-add-dl"
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold rounded-xl text-xs cursor-pointer transition-all active:scale-95"
            >
              Commit Deliverable
            </button>
          </div>
        </form>
      )}

      {/* RENDER LIST VIEW */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex justify-between items-center py-2">
            <div className="flex gap-1 bg-white/60 p-1 rounded-xl border border-neutral-200/50 shadow-xs">
              {(["pending", "completed", "all"] as const).map((f) => (
                <button
                  key={f}
                  id={`filter-${f}`}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    filter === f
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {f === "pending" ? "Active" : f}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-mono text-neutral-400">
              Showing {filteredDeadlines.length} tasks
            </span>
          </div>

          {/* Deadlines List */}
          <div className="space-y-3">
            {filteredDeadlines.length === 0 ? (
              <div className="text-center py-12 bg-white/50 backdrop-blur-md rounded-3xl border border-neutral-200/45">
                <span className="p-3 bg-neutral-100 text-neutral-400 rounded-full inline-block mb-3">
                  <CheckCircle size={20} />
                </span>
                <p className="text-xs text-neutral-500">Perfect slate! No deliverables matching this filter.</p>
              </div>
            ) : (
              filteredDeadlines.map((dl) => {
                const isCompleted = dl.status === "completed";
                const isExpanded = expandedTaskId === dl.id;
                const { completed, total, percentage } = getSubtaskProgress(dl);

                return (
                  <div
                    key={dl.id}
                    className={`rounded-2xl bg-white border border-neutral-200/50 shadow-sm transition-all overflow-hidden ${
                      isCompleted ? "opacity-75" : ""
                    }`}
                  >
                    {/* Primary Item Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* Status Toggle Checkbox */}
                        <button
                          onClick={() => {
                            if (dl.status === "completed") {
                              handleMoveStatus(dl.id, "pending");
                            } else {
                              handleMoveStatus(dl.id, "completed");
                            }
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-awaji-gold transition-colors cursor-pointer shrink-0"
                        >
                          {isCompleted ? (
                            <CheckSquare size={18} className="text-emerald-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[9px] font-mono font-bold tracking-wide uppercase">
                              {getSubjectCode(dl.subjectId)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-extrabold border ${getPriorityBadge(dl.priority)}`}>
                              {dl.priority}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-extrabold border ${getDifficultyBadge(dl.difficulty || "medium")}`}>
                              {dl.difficulty || "medium"}
                            </span>
                            {dl.estimatedHours && (
                              <span className="flex items-center gap-0.5 text-[9px] font-mono text-neutral-400 bg-neutral-50 border border-neutral-200 px-1 rounded">
                                <Clock size={9} />
                                {dl.estimatedHours}h
                              </span>
                            )}
                          </div>
                          <h4 className={`text-sm font-semibold text-neutral-800 ${isCompleted ? "line-through text-neutral-400" : ""}`}>
                            {dl.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {/* Subtask Quick Progress Badge */}
                        {total > 0 && (
                          <div className="text-[10px] font-mono text-neutral-500 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200/50">
                            Subtasks: {completed}/{total} ({percentage}%)
                          </div>
                        )}

                        {/* Calendar Due indicator */}
                        <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                          <Calendar size={11} />
                          <span>{dl.dueDate}</span>
                        </div>

                        {/* Expand Toggle */}
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : dl.id)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-50 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteDeadline(dl.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-neutral-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Subtask Section */}
                    {isExpanded && (
                      <div className="bg-neutral-50/50 border-t border-neutral-100 p-4 space-y-4 animate-fade-in">
                        {/* Subtask Progress bar */}
                        {total > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                              <span>Action Item Progress</span>
                              <span className="font-bold">{percentage}% Done</span>
                            </div>
                            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Subtask Checkboxes */}
                        <div className="space-y-2">
                          {(dl.subTasks || []).length === 0 ? (
                            <p className="text-[10px] font-mono text-neutral-400 font-light italic">
                              No action checklist mapped. Create one below to compartmentalize work blocks!
                            </p>
                          ) : (
                            (dl.subTasks || []).map((sub) => (
                              <div 
                                key={sub.id} 
                                className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-xl border border-neutral-200/50 shadow-2xs hover:border-neutral-300 transition-all"
                              >
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => handleToggleSubtask(dl.id, sub.id)}
                                    className="text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  >
                                    {sub.completed ? (
                                      <CheckSquare size={14} className="text-emerald-500" />
                                    ) : (
                                      <Square size={14} />
                                    )}
                                  </button>
                                  <span className={`text-xs text-neutral-700 ${sub.completed ? "line-through text-neutral-400" : ""}`}>
                                    {sub.title}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteSubtask(dl.id, sub.id)}
                                  className="p-1 text-neutral-400 hover:text-rose-500 rounded hover:bg-neutral-50 cursor-pointer"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Create subtask input */}
                        <form 
                          onSubmit={(e) => handleAddSubtask(dl.id, e)}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Add targeted study action step..."
                            value={newSubtaskTexts[dl.id] || ""}
                            onChange={(e) => setNewSubtaskTexts({ ...newSubtaskTexts, [dl.id]: e.target.value })}
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                          >
                            Add Step
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RENDER KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1: BACKLOG */}
          <div className="bg-neutral-50/70 border border-neutral-200/50 p-4 rounded-3xl flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-neutral-200/40 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <h3 className="font-display font-black text-sm text-neutral-800">Backlog / Backburner</h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-full">
                {deadlines.filter(d => d.status === "pending").length} tasks
              </span>
            </div>

            <div className="flex justify-between items-center bg-white/50 border border-neutral-200/50 p-2.5 rounded-2xl mb-4 text-[10px] font-mono text-neutral-500">
              <span>Expected workload:</span>
              <span className="font-bold text-neutral-700">{getWorkloadForStatus("pending")} hrs</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {deadlines.filter(d => d.status === "pending").map((dl) => (
                <KanbanCard 
                  key={dl.id}
                  task={dl}
                  getSubjectCode={getSubjectCode}
                  getPriorityBadge={getPriorityBadge}
                  getDifficultyBadge={getDifficultyBadge}
                  getSubtaskProgress={getSubtaskProgress}
                  onMoveLeft={null} // can't move left of backlog
                  onMoveRight={() => handleMoveStatus(dl.id, "in_progress")}
                  onDelete={() => onDeleteDeadline(dl.id)}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  newSubtaskText={newSubtaskTexts[dl.id] || ""}
                  onNewSubtaskTextChange={(text) => setNewSubtaskTexts({ ...newSubtaskTexts, [dl.id]: text })}
                  isExpanded={expandedTaskId === dl.id}
                  onToggleExpand={() => setExpandedTaskId(expandedTaskId === dl.id ? null : dl.id)}
                />
              ))}
              {deadlines.filter(d => d.status === "pending").length === 0 && (
                <EmptyColumnPlaceholder text="Backlog clear. No immediate study burdens." />
              )}
            </div>
          </div>
 
          {/* COLUMN 2: IN PROGRESS */}
          <div className="bg-amber-50/30 border border-amber-100/50 p-4 rounded-3xl flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-amber-200/40 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-display font-black text-sm text-neutral-800">Active Workblocks</h3>
              </div>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                {deadlines.filter(d => d.status === "in_progress").length} tasks
              </span>
            </div>
 
            <div className="flex justify-between items-center bg-white/50 border border-amber-100/50 p-2.5 rounded-2xl mb-4 text-[10px] font-mono text-amber-700">
              <span>Expected workload:</span>
              <span className="font-bold text-amber-900">{getWorkloadForStatus("in_progress")} hrs</span>
            </div>
 
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {deadlines.filter(d => d.status === "in_progress").map((dl) => (
                <KanbanCard 
                  key={dl.id}
                  task={dl}
                  getSubjectCode={getSubjectCode}
                  getPriorityBadge={getPriorityBadge}
                  getDifficultyBadge={getDifficultyBadge}
                  getSubtaskProgress={getSubtaskProgress}
                  onMoveLeft={() => handleMoveStatus(dl.id, "pending")}
                  onMoveRight={() => handleMoveStatus(dl.id, "completed")}
                  onDelete={() => onDeleteDeadline(dl.id)}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  newSubtaskText={newSubtaskTexts[dl.id] || ""}
                  onNewSubtaskTextChange={(text) => setNewSubtaskTexts({ ...newSubtaskTexts, [dl.id]: text })}
                  isExpanded={expandedTaskId === dl.id}
                  onToggleExpand={() => setExpandedTaskId(expandedTaskId === dl.id ? null : dl.id)}
                />
              ))}
              {deadlines.filter(d => d.status === "in_progress").length === 0 && (
                <EmptyColumnPlaceholder text="Bring focus. Move an item here to engage." />
              )}
            </div>
          </div>
 
          {/* COLUMN 3: COMPLETED */}
          <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-3xl flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-emerald-200/40 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="font-display font-black text-sm text-neutral-800">Closed Out / Done</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                {deadlines.filter(d => d.status === "completed").length} tasks
              </span>
            </div>
 
            <div className="flex justify-between items-center bg-white/50 border border-emerald-100/50 p-2.5 rounded-2xl mb-4 text-[10px] font-mono text-emerald-700">
              <span>Expected workload:</span>
              <span className="font-bold text-emerald-900">{getWorkloadForStatus("completed")} hrs</span>
            </div>
 
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {deadlines.filter(d => d.status === "completed").map((dl) => (
                <KanbanCard 
                  key={dl.id}
                  task={dl}
                  getSubjectCode={getSubjectCode}
                  getPriorityBadge={getPriorityBadge}
                  getDifficultyBadge={getDifficultyBadge}
                  getSubtaskProgress={getSubtaskProgress}
                  onMoveLeft={() => handleMoveStatus(dl.id, "in_progress")}
                  onMoveRight={null} // can't move further right
                  onDelete={() => onDeleteDeadline(dl.id)}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  newSubtaskText={newSubtaskTexts[dl.id] || ""}
                  onNewSubtaskTextChange={(text) => setNewSubtaskTexts({ ...newSubtaskTexts, [dl.id]: text })}
                  isExpanded={expandedTaskId === dl.id}
                  onToggleExpand={() => setExpandedTaskId(expandedTaskId === dl.id ? null : dl.id)}
                />
              ))}
              {deadlines.filter(d => d.status === "completed").length === 0 && (
                <EmptyColumnPlaceholder text="Success outputs go here. Build some volume!" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
/* KANBAN CARD SUB-COMPONENT */
interface KanbanCardProps {
  task: DeadlineTask;
  getSubjectCode: (id: string) => string;
  getPriorityBadge: (p: "low" | "medium" | "high") => string;
  getDifficultyBadge: (d: "easy" | "medium" | "hard") => string;
  getSubtaskProgress: (dl: DeadlineTask) => { completed: number; total: number; percentage: number };
  onMoveLeft: (() => void) | null;
  onMoveRight: (() => void) | null;
  onDelete: () => void;
  onAddSubtask: (taskId: string, e: FormEvent) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  newSubtaskText: string;
  onNewSubtaskTextChange: (text: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}
 
function KanbanCard({
  task,
  getSubjectCode,
  getPriorityBadge,
  getDifficultyBadge,
  getSubtaskProgress,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  newSubtaskText,
  onNewSubtaskTextChange,
  isExpanded,
  onToggleExpand
}: KanbanCardProps) {
  const { completed, total, percentage } = getSubtaskProgress(task);
  const isCompleted = task.status === "completed";
 
  return (
    <div className={`p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs hover:shadow-sm hover:border-neutral-300 transition-all text-left flex flex-col justify-between min-h-[145px] ${isCompleted ? "opacity-75" : ""}`}>
      <div className="space-y-2">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[8px] font-mono font-bold tracking-wide uppercase">
              {getSubjectCode(task.subjectId)}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-extrabold border ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-extrabold border ${getDifficultyBadge(task.difficulty || "medium")}`}>
              {task.difficulty || "medium"}
            </span>
          </div>
          <button
            onClick={onToggleExpand}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-50 cursor-pointer transition-colors flex-shrink-0"
            title="Toggle checklist subtasks"
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
 
        {/* Task Title */}
        <h4 className={`text-xs font-bold text-neutral-800 leading-tight ${isCompleted ? "line-through text-neutral-400" : ""}`}>
          {task.title}
        </h4>
 
        {/* Action checklist progress indicator */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono text-neutral-400">
            <span>Steps: {completed}/{total}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-neutral-800 h-full transition-all" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Expandable Checklist/Subtasks */}
        {isExpanded && (
          <div className="border-t border-neutral-100/75 pt-2.5 mt-2 space-y-2 animate-fade-in">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Todo Checklist
            </span>
            
            {/* Subtasks list */}
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {(task.subTasks || []).length === 0 ? (
                <p className="text-[9px] font-mono text-neutral-400 font-light italic">
                  No steps added yet. Add a todo below!
                </p>
              ) : (
                (task.subTasks || []).map((sub) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center justify-between gap-2 bg-neutral-50 px-2 py-1.5 rounded-lg border border-neutral-200/40 hover:border-neutral-200 transition-all"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        onClick={() => onToggleSubtask(task.id, sub.id)}
                        className="text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer flex-shrink-0"
                      >
                        {sub.completed ? (
                          <CheckSquare size={12} className="text-emerald-500" />
                        ) : (
                          <Square size={12} />
                        )}
                      </button>
                      <span className={`text-[10px] text-neutral-700 truncate ${sub.completed ? "line-through text-neutral-400" : ""}`}>
                        {sub.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteSubtask(task.id, sub.id)}
                      className="p-0.5 text-neutral-400 hover:text-rose-500 rounded hover:bg-neutral-100 cursor-pointer flex-shrink-0"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
 
            {/* Subtask Form input */}
            <form 
              onSubmit={(e) => onAddSubtask(task.id, e)}
              className="flex gap-1.5"
            >
              <input
                type="text"
                required
                placeholder="Add subtask step..."
                value={newSubtaskText}
                onChange={(e) => onNewSubtaskTextChange(e.target.value)}
                className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-awaji-gold bg-white"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </div>
 
      {/* Footer controls */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-3">
        <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-400">
          <Calendar size={10} />
          <span className="truncate max-w-[70px]">{task.dueDate}</span>
        </div>
 
        <div className="flex items-center gap-1">
          {/* Delete Card Button */}
          <button
            onClick={onDelete}
            className="p-1 text-neutral-400 hover:text-rose-500 rounded hover:bg-neutral-50 cursor-pointer"
            title="Delete task"
          >
            <Trash2 size={11} />
          </button>
 
          {/* Stepper controls */}
          {onMoveLeft && (
            <button
              onClick={onMoveLeft}
              className="p-1 text-neutral-500 hover:text-neutral-800 rounded bg-neutral-50 border border-neutral-200/50 hover:border-neutral-300 cursor-pointer transition-all active:scale-90"
              title="Move left"
            >
              <ArrowLeft size={11} />
            </button>
          )}
 
          {onMoveRight && (
            <button
              onClick={onMoveRight}
              className="p-1 text-neutral-500 hover:text-neutral-800 rounded bg-neutral-50 border border-neutral-200/50 hover:border-neutral-300 cursor-pointer transition-all active:scale-90"
              title="Move right"
            >
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* EMPTY COLUMN PLACEHOLDER */
function EmptyColumnPlaceholder({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-neutral-200 rounded-2xl p-6 text-center text-[10px] font-light text-neutral-400 my-auto bg-white/20">
      {text}
    </div>
  );
}
