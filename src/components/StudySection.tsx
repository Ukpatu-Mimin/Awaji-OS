import { useState, useEffect, useRef, FormEvent, DragEvent } from "react";
import { ClassSubject } from "../types";
import { 
  Play, Pause, RotateCcw, Volume2, Sparkles, Hourglass, Flame, 
  Brain, Send, Upload, X, ChevronLeft, ChevronRight, Plus, 
  Trash2, CheckCircle2, HelpCircle, FileText, RefreshCw 
} from "lucide-react";

interface StudySectionProps {
  classes: ClassSubject[];
}

type SoundType = "none" | "white" | "rain" | "waves";
type ActiveMethod = "pomodoro" | "recall" | "socratic" | "feynman";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subjectId: string;
  status?: "unstudied" | "review" | "learned";
}

interface SocraticMessage {
  role: "user" | "assistant";
  content: string;
}

export default function StudySection({ classes }: StudySectionProps) {
  // Method selection
  const [activeMethod, setActiveMethod] = useState<ActiveMethod>("pomodoro");

  // -------------------------------------------------------------
  // Shared Study Material & Upload State
  // -------------------------------------------------------------
  const [sourceNotes, setSourceNotes] = useState<string>(() => {
    return localStorage.getItem("awaji_source_notes") || "";
  });
  const [uploadedFileName, setUploadedFileName] = useState<string>(() => {
    return localStorage.getItem("awaji_uploaded_filename") || "";
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("awaji_source_notes", sourceNotes);
  }, [sourceNotes]);

  useEffect(() => {
    localStorage.setItem("awaji_uploaded_filename", uploadedFileName);
  }, [uploadedFileName]);

  const handleFileUpload = async (file: File) => {
    setUploadError("");
    setIsUploading(true);
    try {
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setSourceNotes(text);
          setUploadedFileName(file.name);
          setIsUploading(false);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith(".pdf")) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Str = (reader.result as string).split(",")[1];
            const response = await fetch("/api/gemini/parse-material", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileData: base64Str, mimeType: "application/pdf" })
            });
            if (!response.ok) throw new Error("Could not extract PDF content.");
            const data = await response.json();
            setSourceNotes(data.text);
            setUploadedFileName(file.name);
          } catch (e: any) {
            setUploadError(e.message || "Failed to parse PDF. Please check your network and try again.");
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUploadError("Unrecognized format. Please copy-paste your slides/notes directly, or upload a .txt or .pdf document.");
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError("Error reading file.");
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // -------------------------------------------------------------
  // Method 1: Pomodoro State & Hooks (Enhanced Original Code)
  // -------------------------------------------------------------
  const [minutes, setMinutes] = useState<number>(25);
  const [seconds, setSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("general");
  const [studyMode, setStudyMode] = useState<"pomodoro" | "short" | "long">("pomodoro");
  const [ambientSound, setAmbientSound] = useState<SoundType>("none");
  const [audioVolume, setAudioVolume] = useState<number>(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioNode | null>(null);

  const applyPreset = (mode: "pomodoro" | "short" | "long") => {
    setIsActive(false);
    setStudyMode(mode);
    if (mode === "pomodoro") {
      setMinutes(25);
      setSeconds(0);
    } else if (mode === "short") {
      setMinutes(5);
      setSeconds(0);
    } else {
      setMinutes(15);
      setSeconds(0);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            triggerAcousticChime();
            alert("Focus block completed! Take a relaxing breath, scholar.");
            clearInterval(interval);
          } else {
            setMinutes((m) => m - 1);
            setSeconds(59);
          }
        } else {
          setSeconds((s) => s - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      const payload = e.detail || {};
      const targetMins = parseInt(payload.minutes, 10) || 25;
      setActiveMethod("pomodoro");
      setStudyMode("pomodoro");
      setMinutes(targetMins);
      setSeconds(0);
      setIsActive(true);
    };
    window.addEventListener("awaji_trigger_pomodoro", handleTrigger);
    return () => window.removeEventListener("awaji_trigger_pomodoro", handleTrigger);
  }, []);

  const triggerAcousticChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log("Audio chime failed to execute", e);
    }
  };

  const stopAmbientNoise = () => {
    if (audioSourceRef.current) {
      try {
        (audioSourceRef.current as any).stop?.();
      } catch (e) {}
      audioSourceRef.current = null;
    }
  };

  const startAmbientNoise = (type: SoundType) => {
    stopAmbientNoise();
    if (type === "none") return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === "white") {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } else if (type === "rain") {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut * 0.98 + white * 0.02) * 3.5;
          lastOut = data[i];
        }
      } else if (type === "waves") {
        for (let i = 0; i < bufferSize; i++) {
          const t = i / ctx.sampleRate;
          const slowOsc = Math.sin(2 * Math.PI * 0.15 * t);
          data[i] = (Math.random() * 2 - 1) * (0.15 + 0.12 * slowOsc);
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(audioVolume * 0.15, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      console.error("Web Audio synthesis failed", err);
    }
  };

  useEffect(() => {
    startAmbientNoise(ambientSound);
    return () => stopAmbientNoise();
  }, [ambientSound]);

  const handleVolumeChange = (v: number) => {
    setAudioVolume(v);
  };

  // -------------------------------------------------------------
  // Method 2: Active Recall Flashcards State & Logic
  // -------------------------------------------------------------
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem("awaji_flashcards");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "fc-1",
        front: "What is the core cognitive mechanism of Active Recall?",
        back: "Retrieval Practice. By actively forcing your brain to retrieve a memory rather than passively reading a textbook, you trigger neural remodeling that solidifies long-term storage.",
        subjectId: "general",
        status: "unstudied"
      },
      {
        id: "fc-2",
        front: "What are the spacing intervals suggested by Ebbinghaus' Forgetfulness Curve?",
        back: "Reviewing material at increasing intervals (e.g., 1 day, 3 days, 7 days, 30 days) interrupts the memory decay pathway and flattens the forgetting trajectory.",
        subjectId: "general",
        status: "unstudied"
      },
      {
        id: "fc-3",
        front: "How does the Socratic Method test a scholar's mastery of a subject?",
        back: "By replacing passive answers with probing, multi-layered queries. It challenges you to define your core concepts, uncover logical errors, and discover definitions on your own.",
        subjectId: "general",
        status: "unstudied"
      }
    ];
  });

  const [currentCardIdx, setCurrentCardIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [newFront, setNewFront] = useState<string>("");
  const [newBack, setNewBack] = useState<string>("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<boolean>(false);
  const [flashcardGenError, setFlashcardGenError] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("awaji_flashcards", JSON.stringify(flashcards));
  }, [flashcards]);

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const handleMarkStatus = (status: "learned" | "review") => {
    if (flashcards.length === 0) return;
    const updated = [...flashcards];
    updated[currentCardIdx] = {
      ...updated[currentCardIdx],
      status
    };
    setFlashcards(updated);
    handleNextCard();
  };

  const handleAddManualCard = (e: FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      subjectId: selectedSubject,
      status: "unstudied"
    };
    setFlashcards((prev) => [...prev, newCard]);
    setNewFront("");
    setNewBack("");
  };

  const handleDeleteCard = (id: string) => {
    const updated = flashcards.filter((c) => c.id !== id);
    setFlashcards(updated);
    if (currentCardIdx >= updated.length && updated.length > 0) {
      setCurrentCardIdx(updated.length - 1);
    }
  };

  const handleClearDeck = () => {
    if (confirm("Are you sure you want to clear your current study deck? This will delete all flashcards.")) {
      setFlashcards([]);
      setCurrentCardIdx(0);
    }
  };

  const generateAIFlashcards = async () => {
    if (!sourceNotes.trim()) {
      setFlashcardGenError("Please paste some study notes or upload a PDF first to extract flashcards!");
      return;
    }
    setFlashcardGenError("");
    setIsGeneratingFlashcards(true);
    try {
      const response = await fetch("/api/gemini/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesText: sourceNotes })
      });
      if (!response.ok) throw new Error("Synthesis failed.");
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item: any, idx: number) => ({
          id: `ai-fc-${Date.now()}-${idx}`,
          front: item.front,
          back: item.back,
          subjectId: selectedSubject,
          status: "unstudied" as const
        }));
        setFlashcards((prev) => [...prev, ...formatted]);
        // Set index to the first newly added card
        setCurrentCardIdx(flashcards.length);
      } else {
        throw new Error("No flashcards found in AI response.");
      }
    } catch (e: any) {
      setFlashcardGenError(e.message || "Failed to generate cards. Try editing your notes or using a smaller snippet.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // -------------------------------------------------------------
  // Method 3: Socratic Dialogue State & Chat Functions
  // -------------------------------------------------------------
  const [socraticHistory, setSocraticHistory] = useState<SocraticMessage[]>(() => {
    const saved = localStorage.getItem("awaji_socratic_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        role: "assistant",
        content: "Greetings, young scholar. I am Socrates. Let us engage in thoughtful dialogue to explore your understandings. Upload a PDF/Notes above or type a concept, and I will probe your assertions to solidify your comprehension. What are you studying today?"
      }
    ];
  });
  const [socraticInput, setSocraticInput] = useState<string>("");
  const [isSocraticLoading, setIsSocraticLoading] = useState<boolean>(false);
  const [socraticError, setSocraticError] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("awaji_socratic_history", JSON.stringify(socraticHistory));
  }, [socraticHistory]);

  const handleSocraticSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!socraticInput.trim() || isSocraticLoading) return;

    const userText = socraticInput.trim();
    setSocraticInput("");
    setSocraticError("");

    const newHistory = [...socraticHistory, { role: "user" as const, content: userText }];
    setSocraticHistory(newHistory);
    setIsSocraticLoading(true);

    try {
      const response = await fetch("/api/gemini/socratic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: newHistory.slice(0, -1),
          sourceMaterial: sourceNotes
        })
      });

      if (!response.ok) throw new Error("Socrates appears offline.");
      const data = await response.json();
      setSocraticHistory((prev) => [...prev, { role: "assistant" as const, content: data.text }]);
    } catch (err: any) {
      setSocraticError(err.message || "Dialectical request failed. Socrates is reflecting in silence.");
    } finally {
      setIsSocraticLoading(false);
    }
  };

  const handleResetSocrates = () => {
    if (confirm("Reset Socratic dialogue back to first principles?")) {
      setSocraticHistory([
        {
          role: "assistant",
          content: "Let us begin our inquiry anew, scholar. Present your thesis or reference document, and let us challenge our underlying assumptions."
        }
      ]);
    }
  };

  // -------------------------------------------------------------
  // Method 4: Feynman Technique State & Functions
  // -------------------------------------------------------------
  const [feynmanConcept, setFeynmanConcept] = useState<string>(() => {
    return localStorage.getItem("awaji_feynman_concept") || "";
  });
  const [feynmanExplanation, setFeynmanExplanation] = useState<string>(() => {
    return localStorage.getItem("awaji_feynman_explanation") || "";
  });
  const [isFeynmanLoading, setIsFeynmanLoading] = useState<boolean>(false);
  const [feynmanError, setFeynmanError] = useState<string>("");

  interface FeynmanEvaluation {
    simplicityScore: number;
    jargonDetected: string[];
    knowledgeGaps: string[];
    recommendedAnalogy: string;
    critique: string;
    improvedVersion: string;
  }

  const [feynmanResult, setFeynmanResult] = useState<FeynmanEvaluation | null>(() => {
    const saved = localStorage.getItem("awaji_feynman_result");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem("awaji_feynman_concept", feynmanConcept);
  }, [feynmanConcept]);

  useEffect(() => {
    localStorage.setItem("awaji_feynman_explanation", feynmanExplanation);
  }, [feynmanExplanation]);

  useEffect(() => {
    if (feynmanResult) {
      localStorage.setItem("awaji_feynman_result", JSON.stringify(feynmanResult));
    } else {
      localStorage.removeItem("awaji_feynman_result");
    }
  }, [feynmanResult]);

  const handleFeynmanEvaluate = async (e: FormEvent) => {
    e.preventDefault();
    if (!feynmanConcept.trim() || !feynmanExplanation.trim() || isFeynmanLoading) return;

    setIsFeynmanLoading(true);
    setFeynmanError("");
    setFeynmanResult(null);

    try {
      const response = await fetch("/api/gemini/feynman-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: feynmanConcept.trim(),
          explanation: feynmanExplanation.trim(),
          sourceMaterial: sourceNotes
        })
      });

      if (!response.ok) throw new Error("Feynman engine currently resting. Please try again.");
      const data = await response.json();
      setFeynmanResult(data);
    } catch (err: any) {
      setFeynmanError(err.message || "Feynman technique assessment failed.");
    } finally {
      setIsFeynmanLoading(false);
    }
  };

  const handleResetFeynman = () => {
    if (confirm("Reset Feynman practice workspace?")) {
      setFeynmanConcept("");
      setFeynmanExplanation("");
      setFeynmanResult(null);
      setFeynmanError("");
      localStorage.removeItem("awaji_feynman_result");
    }
  };

  // -------------------------------------------------------------
  // Rendering Helpers
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 animate-fade-in text-left w-full" id="study-section">
      {/* 3D Transform Inline Styles */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Modern Tab pills header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/50 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
            Module 03
          </span>
          <h2 className="text-xl font-display font-black text-neutral-800 tracking-tight mt-0.5">
            Academic Focus & Active Learning
          </h2>
        </div>

        {/* Tactile method selector tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200/40">
          {(["pomodoro", "recall", "socratic", "feynman"] as const).map((m) => (
            <button
              key={m}
              id={`method-tab-${m}`}
              onClick={() => setActiveMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                activeMethod === m
                  ? "bg-white text-neutral-800 shadow-sm border border-neutral-200/20"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {m === "pomodoro" 
                ? "⏱️ Pomodoro" 
                : m === "recall" 
                ? "🧠 Active Recall" 
                : m === "socratic" 
                ? "🔮 Socratic"
                : "🎓 Feynman Technique"
              }
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------
          VIEW 1: POMODORO ARENA
         ------------------------------------------------------------- */}
      {activeMethod === "pomodoro" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Classic Circular Clock Timer */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-8 rounded-3xl shadow-sm flex flex-col justify-between items-center text-center">
            <div className="w-full">
              <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
                Focus Timer
              </span>
              <h3 className="text-base font-display font-black text-neutral-800 tracking-tight mt-1">
                Deep Concentration Interval
              </h3>

              {/* Quick timer presets */}
              <div className="flex gap-2 justify-center mt-4">
                {(["pomodoro", "short", "long"] as const).map((p) => (
                  <button
                    key={p}
                    id={`preset-${p}`}
                    onClick={() => applyPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold border transition-all cursor-pointer ${
                      studyMode === p
                        ? "bg-neutral-800 text-white border-neutral-800 shadow-sm"
                        : "bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700"
                    }`}
                  >
                    {p === "pomodoro" ? "25m Focus" : p === "short" ? "5m Short Break" : "15m Long Break"}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Clock counter inside circle */}
            <div className="my-8 relative flex items-center justify-center">
              <div className="w-56 h-56 rounded-full border-4 border-neutral-100 flex flex-col items-center justify-center relative bg-white/40">
                <div
                  className={`absolute inset-0 rounded-full border-4 transition-colors duration-1000 ${
                    isActive ? "border-awaji-gold animate-pulse" : "border-transparent"
                  }`}
                />
                <span className="text-5xl font-display font-black text-neutral-800 tracking-tight">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-widest mt-1">
                  {isActive ? "Flow Active" : "Paused"}
                </span>
              </div>
            </div>

            {/* Play/Pause & Reset controls */}
            <div className="flex items-center gap-4">
              <button
                id="btn-toggle-timer"
                onClick={() => setIsActive(!isActive)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
                  isActive ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-awaji-gold hover:bg-awaji-gold-dark text-neutral-900"
                }`}
              >
                {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>

              <button
                id="btn-reset-timer"
                onClick={() => applyPreset(studyMode)}
                className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 hover:bg-neutral-50 flex items-center justify-center text-neutral-600 shadow-sm cursor-pointer transition-all"
                title="Reset Session"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Right: Soundscapes and Course Association */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-xs">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-3 block">
                Associate Session
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-light mb-4">
                Assign this focus interval to a registered syllabus course to tag your academic metrics.
              </p>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-600 bg-white"
              >
                <option value="general">General / Unassigned Study</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Synths and volume */}
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2 block">
                  Ambient Synths
                </h4>
                <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
                  Erase study room distractions. These noise profiles are synthesized dynamically using Web Audio API.
                </p>

                <div className="space-y-2">
                  {(["none", "white", "rain", "waves"] as const).map((sound) => (
                    <button
                      key={sound}
                      id={`btn-sound-${sound}`}
                      onClick={() => setAmbientSound(sound)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        ambientSound === sound
                          ? "bg-awaji-gold/10 border-awaji-gold text-neutral-800 font-bold"
                          : "bg-white border-neutral-100 hover:border-neutral-200 text-neutral-600"
                      }`}
                    >
                      <span className="capitalize">{sound === "none" ? "Mute Ambient" : sound + " Static"}</span>
                      {ambientSound === sound && <Volume2 size={13} className="text-awaji-gold animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 mt-4">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>Volume</span>
                  <span>{Math.round(audioVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-awaji-gold cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 2: ACTIVE RECALL FLASHCARDS
         ------------------------------------------------------------- */}
      {activeMethod === "recall" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3D Card Stack Review */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-8 rounded-3xl shadow-sm flex flex-col justify-between min-h-[460px]">
            <div className="w-full flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase font-bold">
                  Card Deck
                </span>
                <h3 className="text-base font-display font-black text-neutral-800 tracking-tight mt-0.5">
                  Leitner Retrieval Box
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-neutral-100 px-2.5 py-1 rounded-lg text-neutral-500">
                {flashcards.length > 0 ? `Card ${currentCardIdx + 1} of ${flashcards.length}` : "No Cards"}
              </span>
            </div>

            {flashcards.length > 0 ? (
              <div className="w-full my-auto flex flex-col gap-6">
                {/* 3D Flipping Container */}
                <div 
                  id="active-recall-card"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-64 cursor-pointer perspective-1000 relative select-none"
                  title="Click to flip the card"
                >
                  <div className={`w-full h-full duration-500 preserve-3d relative transition-transform ${isFlipped ? "rotate-y-180" : ""}`}>
                    {/* Front side (Question) */}
                    <div className="absolute inset-0 backface-hidden bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between items-center text-center">
                      <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Question Prompter</div>
                      <p className="text-base font-display font-black text-neutral-800 leading-snug max-w-md my-auto px-2">
                        {flashcards[currentCardIdx]?.front}
                      </p>
                      <div className="text-[9px] font-mono text-awaji-gold tracking-wider flex items-center gap-1.5 animate-pulse">
                        <Sparkles size={10} /> Click Card to Reveal Answer
                      </div>
                    </div>

                    {/* Back side (Answer) */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-neutral-900 border border-neutral-850 rounded-2xl p-6 shadow-xs flex flex-col justify-between items-center text-center text-white">
                      <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Explanation Answer</div>
                      <p className="text-xs sm:text-sm font-sans text-neutral-200 leading-relaxed max-w-md my-auto overflow-y-auto pr-1">
                        {flashcards[currentCardIdx]?.back}
                      </p>
                      <div className="text-[9px] font-mono text-neutral-400 tracking-wider">Click Card to Flip Back</div>
                    </div>
                  </div>
                </div>

                {/* Score / Leitner Boxes buttons */}
                <div className="flex gap-3">
                  <button
                    id="btn-recall-review"
                    onClick={() => handleMarkStatus("review")}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50 text-xs font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <HelpCircle size={14} /> Review Again
                  </button>
                  <button
                    id="btn-recall-learned"
                    onClick={() => handleMarkStatus("learned")}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 text-xs font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} /> I Got It!
                  </button>
                </div>

                {/* Deck pagination controls */}
                <div className="flex justify-between items-center border-t border-neutral-100 pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-deck-prev"
                      onClick={handlePrevCard}
                      className="w-8 h-8 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/40 flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      id="btn-deck-next"
                      onClick={handleNextCard}
                      className="w-8 h-8 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/40 flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    id="btn-delete-active-card"
                    onClick={() => handleDeleteCard(flashcards[currentCardIdx].id)}
                    className="text-[10px] font-mono text-neutral-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Trash2 size={12} /> Delete Card
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-auto py-12 flex flex-col items-center text-center gap-3">
                <Brain size={40} className="text-neutral-300 stroke-1 animate-bounce" />
                <h4 className="text-sm font-display font-bold text-neutral-600">Your flashcard deck is empty</h4>
                <p className="text-xs text-neutral-400 max-w-xs font-light">
                  Upload a PDF textbook, paste slide texts on the right, or create manual cards to trigger study intervals.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: AI Extraction & Card Creator */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* AI Generator Hub */}
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500 animate-pulse" /> AI Synthesis Hub
                </h4>
                {flashcards.length > 0 && (
                  <button
                    onClick={handleClearDeck}
                    className="text-[9px] font-mono text-neutral-400 hover:text-rose-500 cursor-pointer"
                  >
                    Clear Deck
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
                Upload your research paper, slides (.pdf / .txt) or paste lecture notes below to let Gemini generate challenging Active Recall questions automatically.
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all mb-4 flex flex-col items-center justify-center min-h-[90px] ${
                  isDragging
                    ? "border-awaji-gold bg-awaji-gold/5"
                    : "border-neutral-200/70 hover:border-neutral-300 bg-white/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  accept=".pdf,.txt,.md"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1 text-xs text-neutral-500">
                    <RefreshCw size={18} className="text-awaji-gold animate-spin" />
                    <span>Extracting academic structure...</span>
                  </div>
                ) : uploadedFileName ? (
                  <div className="flex flex-col items-center gap-1">
                    <FileText size={18} className="text-emerald-500" />
                    <span className="text-xs font-bold text-neutral-700 truncate max-w-xs">{uploadedFileName}</span>
                    <span className="text-[9px] font-mono text-neutral-400">Drag/Click to swap document</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-neutral-500">
                    <Upload size={16} className="text-neutral-400" />
                    <span className="text-xs font-medium">Drag PDF / TXT here or Browse</span>
                    <span className="text-[9px] font-mono text-neutral-400">Max size 20MB</span>
                  </div>
                )}
              </div>

              {/* Text Area fallback */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">
                    Source Text / Lecture Notes
                  </label>
                  <textarea
                    rows={4}
                    value={sourceNotes}
                    onChange={(e) => setSourceNotes(e.target.value)}
                    placeholder="Paste lecture outlines, key terms, or presentation slides here..."
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-700 bg-white"
                  />
                </div>

                {uploadError && <p className="text-[10px] text-rose-500">{uploadError}</p>}
                {flashcardGenError && <p className="text-[10px] text-rose-500">{flashcardGenError}</p>}

                <button
                  id="btn-recall-ai-generate"
                  onClick={generateAIFlashcards}
                  disabled={isGeneratingFlashcards || isUploading || !sourceNotes.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {isGeneratingFlashcards ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Synthesizing Deck...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-amber-400" /> Generate AI Flashcards
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Manual Flashcard Creator */}
            <form onSubmit={handleAddManualCard} className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                <Plus size={13} /> Add Flashcard Manually
              </h4>

              <div>
                <input
                  type="text"
                  placeholder="Front side (Question or Prompt)"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-700 bg-white"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Back side (Detailed Answer)"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-700 bg-white"
                />
              </div>

              <button
                type="submit"
                id="btn-add-manual-card"
                disabled={!newFront.trim() || !newBack.trim()}
                className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 text-neutral-700 text-[10px] font-mono uppercase tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                Add to Deck
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 3: SOCRATIC METHOD DIALOGUE
         ------------------------------------------------------------- */}
      {activeMethod === "socratic" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Dialogue Terminal */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[500px]">
            <div className="w-full flex justify-between items-center mb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-500 uppercase font-bold">
                  Socratic Dialogue
                </span>
                <h3 className="text-base font-display font-black text-neutral-800 tracking-tight mt-0.5">
                  Classical Examination Arena
                </h3>
              </div>
              <button
                id="btn-reset-socrates"
                onClick={handleResetSocrates}
                className="text-[9px] font-mono text-neutral-400 hover:text-neutral-700 transition-all flex items-center gap-1 cursor-pointer"
                title="Reset Socratic chat"
              >
                <RotateCcw size={11} /> Reset Chat
              </button>
            </div>

            {/* Chat message logs */}
            <div className="flex-1 overflow-y-auto max-h-[340px] pr-2 space-y-4 my-2 flex flex-col scrollbar-thin">
              {socraticHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                >
                  {/* Avatar bubble */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                    msg.role === "user" 
                      ? "bg-neutral-800 text-white font-mono font-bold" 
                      : "bg-indigo-50 border border-indigo-100 text-indigo-700 font-sans font-black"
                  }`}>
                    {msg.role === "user" ? "ME" : "Σ"}
                  </div>

                  {/* Bubble body */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-neutral-900 text-white rounded-tr-none"
                      : "bg-white/90 border border-neutral-200/40 text-neutral-800 rounded-tl-none shadow-2xs"
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isSocraticLoading && (
                <div className="flex gap-3 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-xs flex-shrink-0">
                    Σ
                  </div>
                  <div className="p-4 rounded-2xl text-xs bg-white/80 border border-neutral-100 text-neutral-400 rounded-tl-none flex items-center gap-1.5 animate-pulse">
                    <Sparkles size={11} className="text-indigo-500 animate-spin" /> Socrates is formulating a probing question...
                  </div>
                </div>
              )}

              {socraticError && (
                <p className="text-center text-[10px] text-rose-500 font-mono py-1">{socraticError}</p>
              )}
            </div>

            {/* Input typing field */}
            <form onSubmit={handleSocraticSend} className="flex gap-2 border-t border-neutral-100 pt-3 mt-2">
              <input
                type="text"
                value={socraticInput}
                onChange={(e) => setSocraticInput(e.target.value)}
                placeholder="Declare your premise or answer Socrates' question..."
                className="flex-1 text-xs px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white"
                disabled={isSocraticLoading}
              />
              <button
                type="submit"
                id="btn-send-socrates"
                disabled={isSocraticLoading || !socraticInput.trim()}
                className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-mono uppercase tracking-wider font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Send size={12} /> Send
              </button>
            </form>
          </div>

          {/* Right Column: Active material reference */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5 mb-2">
                  <FileText size={13} className="text-indigo-500" /> Dialectical Source Context
                </h4>
                <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
                  Provide Socratic context. Any lecture slides, research notes, or files loaded here will guide Socrates to strictly question you on this syllabus content.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all mb-4 flex flex-col items-center justify-center min-h-[90px] ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-500/5"
                      : "border-neutral-200/70 hover:border-neutral-300 bg-white/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    accept=".pdf,.txt,.md"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1 text-xs text-neutral-500">
                      <RefreshCw size={18} className="text-indigo-500 animate-spin" />
                      <span>Extracting academic structure...</span>
                    </div>
                  ) : uploadedFileName ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileText size={18} className="text-indigo-500" />
                      <span className="text-xs font-bold text-neutral-700 truncate max-w-xs">{uploadedFileName}</span>
                      <span className="text-[9px] font-mono text-neutral-400">Drag/Click to swap document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-neutral-500">
                      <Upload size={16} className="text-neutral-400" />
                      <span className="text-xs font-medium">Drag PDF / TXT here or Browse</span>
                      <span className="text-[9px] font-mono text-neutral-400">Max size 20MB</span>
                    </div>
                  )}
                </div>

                {/* Text editor */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">
                      Active Material Reference Notes
                    </label>
                    <textarea
                      rows={5}
                      value={sourceNotes}
                      onChange={(e) => setSourceNotes(e.target.value)}
                      placeholder="Paste text notes here to direct Socrates' line of questioning..."
                      className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-indigo-400 text-neutral-700 bg-white"
                    />
                  </div>

                  {sourceNotes.trim() && (
                    <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                      <span className="text-[9px] font-mono text-indigo-700">
                        📁 {sourceNotes.length} chars loaded to Socratic Mind
                      </span>
                      <button
                        onClick={() => setSourceNotes("")}
                        className="text-[9px] font-mono text-rose-500 hover:underline cursor-pointer"
                      >
                        Clear material
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Starter queries */}
              <div className="pt-4 border-t border-neutral-100 mt-4 space-y-2">
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">
                  Suggested Prompts
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => setSocraticInput("Test my understanding of the loaded material by asking a probing question.")}
                    className="text-left py-2 px-2.5 rounded-xl bg-neutral-50 hover:bg-indigo-50 hover:text-indigo-700 border border-neutral-100 text-[10px] font-mono text-neutral-500 cursor-pointer transition-all truncate"
                  >
                    💡 Test my knowledge on notes
                  </button>
                  <button
                    onClick={() => setSocraticInput("I have formulated a premise. Challenge my assumptions step-by-step.")}
                    className="text-left py-2 px-2.5 rounded-xl bg-neutral-50 hover:bg-indigo-50 hover:text-indigo-700 border border-neutral-100 text-[10px] font-mono text-neutral-500 cursor-pointer transition-all truncate"
                  >
                    🧐 Challenge my assertions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 4: FEYNMAN TECHNIQUE WORKSPACE
         ------------------------------------------------------------- */}
      {activeMethod === "feynman" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Practice Workspace */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-200/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[500px]">
            <div className="w-full flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-500 uppercase font-bold">
                  Richard Feynman Mode
                </span>
                <h3 className="text-base font-display font-black text-neutral-800 tracking-tight mt-0.5">
                  The Great Explainer Workspace
                </h3>
              </div>
              <button
                id="btn-reset-feynman"
                onClick={handleResetFeynman}
                className="text-[9px] font-mono text-neutral-400 hover:text-neutral-700 transition-all flex items-center gap-1 cursor-pointer"
                title="Reset Feynman work"
              >
                <RotateCcw size={11} /> Reset Workspace
              </button>
            </div>

            {/* Core Practice Interface */}
            <div className="flex-1 space-y-4 my-2 overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
              {!feynmanResult && !isFeynmanLoading ? (
                <form onSubmit={handleFeynmanEvaluate} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1.5 font-bold">
                      1. What Concept or Term are you Mastering?
                    </label>
                    <input
                      type="text"
                      value={feynmanConcept}
                      onChange={(e) => setFeynmanConcept(e.target.value)}
                      placeholder="e.g., Photosynthesis, Recursion, Quantum Entanglement..."
                      className="w-full text-xs px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-800 bg-white shadow-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1.5 font-bold">
                      2. Explain it in simple terms (as if teaching an 8-year-old child)
                    </label>
                    <p className="text-[10px] text-neutral-400 font-light mb-2 leading-relaxed">
                      💡 Tip: Avoid jargon. Use plain English, concrete examples, and vivid comparisons. If you get stuck, that is your learning gap!
                    </p>
                    <textarea
                      rows={8}
                      value={feynmanExplanation}
                      onChange={(e) => setFeynmanExplanation(e.target.value)}
                      placeholder="Explain the topic clearly here. Pretend you are sitting with a friendly third-grader..."
                      className="w-full text-xs p-4 rounded-xl border border-neutral-200 focus:outline-none focus:border-awaji-gold text-neutral-700 bg-white shadow-xs font-light leading-relaxed"
                      required
                    />
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 mt-1">
                      <span>Count: {feynmanExplanation.length} chars</span>
                      <span>Target: ~150-500 characters</span>
                    </div>
                  </div>

                  {feynmanError && (
                    <p className="text-[10px] text-rose-500 font-mono">{feynmanError}</p>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-feynman"
                    disabled={!feynmanConcept.trim() || !feynmanExplanation.trim()}
                    className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-mono uppercase tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    🚀 Stress-Test Explanation (Feynman API)
                  </button>
                </form>
              ) : isFeynmanLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-neutral-100 border-t-indigo-500 animate-spin flex items-center justify-center">
                    <Brain className="text-indigo-500 animate-pulse" size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-black text-neutral-800">
                      Richard Feynman is Analyzing your Explanation...
                    </h4>
                    <p className="text-xs text-neutral-400 font-light mt-1 max-w-sm">
                      Detecting jargon, measuring clarity scores, and synthesizing a beautiful analogy to cement your understanding.
                    </p>
                  </div>
                </div>
              ) : (
                /* RESULTS VIEW */
                <div className="space-y-6">
                  {/* Simplicity Header Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-emerald-50/30 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-indigo-700 uppercase tracking-wider font-extrabold block">
                        FEYNMAN SIMPLICITY RATING
                      </span>
                      <h4 className="text-lg font-display font-black text-neutral-800 mt-0.5">
                        {feynmanResult?.simplicityScore}% Clear Simplicity
                      </h4>
                      <p className="text-xs text-neutral-500 font-light mt-1">
                        {feynmanResult && feynmanResult.simplicityScore >= 80 
                          ? "Incredible work! You explained this like a true teaching master." 
                          : feynmanResult && feynmanResult.simplicityScore >= 50
                          ? "Good base explanation. Let's iron out the jargon gaps below."
                          : "A bit dense. Remember, simplicity is the ultimate sophistication."
                        }
                      </p>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center shadow-xs">
                        <span className="text-xl font-display font-black text-indigo-600">
                          {feynmanResult?.simplicityScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Jargon & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Jargon Box */}
                    <div className="bg-neutral-50 p-4 border border-neutral-200/50 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest font-extrabold block">
                          Jargon Detected ⚠️
                        </span>
                        <p className="text-[10px] text-neutral-400 font-light leading-relaxed mt-0.5 mb-2">
                          Explain these to keep it simple:
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {feynmanResult?.jargonDetected && feynmanResult.jargonDetected.length > 0 ? (
                          feynmanResult.jargonDetected.map((j, i) => (
                            <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-mono rounded-lg border border-rose-200/30">
                              {j}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">✨ No technical jargon detected! Excellent.</span>
                        )}
                      </div>
                    </div>

                    {/* Knowledge Gaps Box */}
                    <div className="bg-neutral-50 p-4 border border-neutral-200/50 rounded-2xl">
                      <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-extrabold block">
                        Knowledge Gaps 🔍
                      </span>
                      <p className="text-[10px] text-neutral-400 font-light leading-relaxed mt-0.5 mb-2">
                        Topics to detail or explore deeper:
                      </p>
                      <ul className="space-y-1 mt-2">
                        {feynmanResult?.knowledgeGaps && feynmanResult.knowledgeGaps.length > 0 ? (
                          feynmanResult.knowledgeGaps.map((g, i) => (
                            <li key={i} className="text-[10px] text-neutral-600 font-light list-disc list-inside">
                              {g}
                            </li>
                          ))
                        ) : (
                          <li className="text-[10px] text-emerald-600 font-medium list-none">✨ No critical gaps. Pure mastery!</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Analogies and Critique */}
                  <div className="space-y-4">
                    {/* Recommended Analogy */}
                    <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl">
                      <span className="text-[9px] font-mono text-amber-700 uppercase tracking-widest font-bold flex items-center gap-1">
                        💡 Richard's Recommended Analogy
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed font-light mt-1.5 whitespace-pre-line">
                        {feynmanResult?.recommendedAnalogy}
                      </p>
                    </div>

                    {/* Critique */}
                    <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold block">
                        🗣️ Coach Richard's Direct Feedback
                      </span>
                      <p className="text-xs text-neutral-600 leading-relaxed font-light mt-1.5 italic">
                        "{feynmanResult?.critique}"
                      </p>
                    </div>

                    {/* Ideal Simplification */}
                    <div className="bg-neutral-900 text-neutral-100 p-5 rounded-2xl relative border border-neutral-800">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-extrabold block">
                        🎓 Model Simple Explanation
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-light mt-2 whitespace-pre-line">
                        {feynmanResult?.improvedVersion}
                      </p>
                      <div className="mt-4 flex justify-end gap-2 border-t border-neutral-800 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(feynmanResult?.improvedVersion || "");
                            alert("Feynman explanation copied to clipboard!");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                        >
                          📋 Copy Simple Version
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Practice Again button */}
                  <button
                    onClick={() => {
                      setFeynmanResult(null);
                    }}
                    className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-all"
                  >
                    🔄 Refine & Rewrite Explanation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: How it Works & Syllabus Context */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Technique Explanation Card */}
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-xs">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2 flex items-center gap-1">
                🎓 Feynman's Core Method
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-light mb-4">
                The Feynman Technique is a simple, 4-step framework designed by Nobel Laureate physicist Richard Feynman to learn any academic concept faster and with 10x deeper retention:
              </p>

              <div className="space-y-3">
                {[
                  { num: "01", title: "Select Concept", desc: "Choose a technical term or academic formula you want to master." },
                  { num: "02", title: "Teach to a Child", desc: "Explain it in writing using the simplest language possible. No complex vocabulary." },
                  { num: "03", title: "Identify Gaps", desc: "Feynman API automatically highlights the jargon words and missing logic blocks." },
                  { num: "04", title: "Simplify & Review", desc: "Review Feynman's feedback, study his analogy, and rewrite to perfect your schema." }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-lg">
                      {step.num}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-neutral-700 leading-none">{step.title}</h5>
                      <p className="text-[10px] text-neutral-500 font-light mt-0.5 leading-normal">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Reference Helper */}
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/50 rounded-3xl p-6 shadow-xs">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2">
                📁 Base Syllabus Reference
              </h4>
              <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
                If you have loaded slides or text notes in other modules, Feynman is fully contextualized and will prioritize assessing your concept against those notes.
              </p>

              {sourceNotes.trim() ? (
                <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-600">
                    📂 {sourceNotes.substring(0, 30)}... ({sourceNotes.length} chars loaded)
                  </span>
                  <span className="text-[8px] font-mono uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg font-bold">
                    CONNECTED
                  </span>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-neutral-400 bg-neutral-50 border border-dashed border-neutral-200 p-3 rounded-xl text-center">
                  No reference material loaded. Evaluating with general knowledge.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
