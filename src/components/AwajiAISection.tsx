import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Sparkles, Trash2, Copy, CheckCircle, Terminal, HelpCircle, BookOpen, Code, Cpu } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const STUDENT_TEMPLATE_GROUPS = [
  {
    category: "Structured Prompts",
    items: [
      {
        title: "📝 Draft Study Guide",
        prompt: "Draft a custom, comprehensive study guide with core concepts, bullet points, and key questions for the topic of: "
      },
      {
        title: "🔬 Complex Proof",
        prompt: "Provide a detailed step-by-step breakdown and mathematical/logical proof explaining: "
      },
      {
        title: "💻 Debug Code",
        prompt: "Analyze the following snippet, identify the bugs, explain the root cause, and write a clean, optimized solution:\n\n```\n// paste your code here\n```"
      },
      {
        title: "📖 Practice Quiz",
        prompt: "Generate a 5-question multi-choice mock quiz with detailed answer explanations for: "
      }
    ]
  }
];

const INTRO_MSG: ChatMessage = {
  id: "greet",
  role: "assistant",
  content: `Hello there! I am Awaji AI, your cognitive study co-pilot.

I am wired to assist with active syllabus breakdowns, coding, math proofs, or custom quizzes. 

Select one of the **Student Templates** on the left to prefill an academic request, or simply type your question below. Let's study!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function AwajiAISection() {
  const currentUser = typeof window !== "undefined" ? (localStorage.getItem("awaji_current_user") || "guest") : "guest";
  const userKey = "awaji_ai_messages_" + currentUser.toLowerCase();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [INTRO_MSG];
  });
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setMessages([INTRO_MSG]);
  }, [userKey]);

  useEffect(() => {
    localStorage.setItem(userKey, JSON.stringify(messages));
  }, [messages, userKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    const sanitized = text.replace(/<[^>]*>/g, "").trim();
    if (!sanitized || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: sanitized,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sanitized,
          history: historyPayload.slice(0, -1) // pass all previous history except the current prompt
        })
      });

      if (!res.ok) throw new Error("Connection failed");

      const data = await res.json();
      const rawText = data.text || "Apologies, I couldn't formulate an answer. Could you ask me again?";
      
      // Parse action tags [ACTION: TYPE param="val"]
      const actionRegex = /\[ACTION:\s*([A-Z_]+)([^\]]*)\]/g;
      let match;
      const cleanText = rawText.replace(/\[ACTION:\s*[A-Z_]+[^\]]*\]/g, "").trim();

      // Reset regex index to scan all matches
      actionRegex.lastIndex = 0;
      while ((match = actionRegex.exec(rawText)) !== null) {
        const type = match[1];
        const paramsStr = match[2];
        const params: any = {};
        
        // Parse key-values: key="value" or key=value
        const paramRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
        let pMatch;
        while ((pMatch = paramRegex.exec(paramsStr)) !== null) {
          const key = pMatch[1];
          const val = pMatch[2] || pMatch[3] || pMatch[4];
          params[key] = val;
        }
        
        // Dispatch custom global event for the action
        window.dispatchEvent(new CustomEvent("awaji_ai_action", {
          detail: { type, payload: params }
        }));
      }

      const assistantMsg: ChatMessage = {
        id: "reply-" + Date.now(),
        role: "assistant",
        content: cleanText || "Processed action successfully.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const errReply: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "🚨 *Awaji link interrupted.* The backend model is temporarily unresponsive. Check your internet connection or try again shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your current tutoring session?")) {
      setMessages([INTRO_MSG]);
      localStorage.removeItem(userKey);
    }
  };

  const handleCopyText = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format response text cleanly with rich markdown, tables, and HTML details tags
  const formatMessageText = (content: string) => {
    // Clean up raw markdown heading hashes (e.g., #, ##, ###, ####) and excessive asterisks (e.g., ****)
    let processed = content;
    processed = processed.replace(/^#+\s*/gm, "");
    processed = processed.replace(/\*{4,}/g, "");
    processed = processed.replace(/\*\*\s*\*\*/g, "");

    return (
      <div className="markdown-body text-neutral-800 space-y-2">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 border border-neutral-200 rounded-xl shadow-xs">
                <table className="w-full text-left border-collapse text-xs text-neutral-800">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-neutral-100 text-neutral-700 font-semibold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-bold border-r border-neutral-200 last:border-r-0 text-neutral-700">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 border-b border-r border-neutral-150 last:border-r-0 text-neutral-600 font-light leading-relaxed">
                {children}
              </td>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-neutral-50/50 even:bg-neutral-50/30 last:children:border-b-0">
                {children}
              </tr>
            ),
            details: ({ children }) => (
              <details className="my-3 border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-xs transition-all group">
                {children}
              </details>
            ),
            summary: ({ children }) => (
              <summary className="px-4 py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-bold text-xs cursor-pointer select-none flex items-center gap-1.5 border-b border-neutral-100 outline-none">
                <span className="text-indigo-500 font-mono text-[10px] select-none group-open:rotate-90 transition-transform">▶</span>
                {children}
              </summary>
            ),
            p: ({ children }) => (
              <p className="leading-relaxed font-light mb-2 last:mb-0">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 my-2 text-neutral-700 font-light pl-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 my-2 text-neutral-700 font-light pl-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-neutral-950">
                {children}
              </strong>
            ),
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeText = String(children).replace(/\n$/, "");
              const isBlock = match || codeText.includes("\n");

              if (!isBlock) {
                return (
                  <code className="px-1.5 py-0.5 bg-neutral-150 font-mono text-[10px] rounded text-indigo-750 border border-neutral-200" {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <div className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-[11px] text-neutral-300 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400">
                    <span className="uppercase tracking-wider font-bold">{match ? match[1] : "code"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(codeText);
                      }}
                      className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={10} />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            },
          }}
        >
          {processed}
        </ReactMarkdown>
      </div>
    );
  };


  return (
    <div className="max-w-4xl mx-auto bg-white border border-neutral-200/50 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px] justify-between text-left animate-fade-in" id="ai-section">
      {/* Chatbox Header */}
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-neutral-900 border border-neutral-800 text-awaji-gold rounded-xl">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="font-display font-black text-neutral-800 text-xs">
              Awaji AI Assistant
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
              Academic Engine v1.5
            </p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Trash2 size={11} />
          <span>Reset Session Log</span>
        </button>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] space-y-1 ${isUser ? "text-right" : "text-left"}`}>
                <div
                  className={`relative p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-neutral-900 text-neutral-100 rounded-tr-none font-medium shadow-xs"
                      : "bg-neutral-50 border border-neutral-150 text-neutral-800 rounded-tl-none font-light"
                  }`}
                >
                  {/* Copy option for assistant message */}
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.content, msg.id)}
                      className="absolute top-2.5 right-2.5 text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-md cursor-pointer"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <CheckCircle size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  )}

                  <div className="pr-4 whitespace-pre-wrap">
                    {isUser ? msg.content : formatMessageText(msg.content)}
                  </div>
                </div>
                <span className="text-[9px] text-neutral-400 font-mono block px-1">
                  {isUser ? "Student" : "Awaji AI"} • {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-50 border border-neutral-150 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400 italic">
                Awaji Engine compiling response...
              </span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-225" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Dock */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            id="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask for an outline, proof, code review, quiz, or custom study task..."
            className="flex-1 bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-150 disabled:opacity-50 font-medium"
          />
          <button
            type="submit"
            id="btn-ai-send"
            disabled={isLoading || !input.trim()}
            className="px-5 bg-neutral-950 hover:bg-black text-white rounded-xl flex items-center justify-center cursor-pointer transition-all border border-neutral-950 disabled:opacity-85"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
