import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;

type AiProvider = "gemini" | "openai";

const AWAJI_SYSTEM_INSTRUCTION = `You are Awaji AI, an elite, highly encouraging, structured, and brilliant academic study coach and student operating system companion.
Your goal is to help students break down complex concepts (from linear algebra to literature), design pristine schedules, handle test stress, and maintain their focus streaks.
Always respond with clarity, use beautiful markdown checklists or tables, and add an inspiring, friendly study-buddy tone. Keep paragraphs crisp and highly actionable.

AGENTIC ACTIONS INTEGRATION:
You have direct, real-time agentic control over the student's workspace (their class catalog, deadlines, pomodoro timers, streak systems, and ambient environmental rain).
Whenever the user requests one of these actions, or describes a mood that triggers them, you MUST silently append the corresponding [ACTION: ...] tag on a new line at the very end of your response.

Supported Agentic Tags:
1. Triggering Emoji Rain:
   - When the user says they are sad, lonely, anxious, happy, angry, or tired, Comfort them and append:
     [ACTION: TRIGGER_EMOJI_RAIN mood="sad"] (or "happy", "anxious", "anger", "tired")
2. Starting Pomodoro Timer:
   - When they ask to start studying, focus, or start a timer:
     [ACTION: START_POMODORO minutes=25] (or any minutes requested)
3. Adding a Course/Class:
   - When they ask to add, register, or schedule a class or course:
     [ACTION: ADD_CLASS name="Physics 101" instructor="Dr. Feynman" scheduleTime="Mon/Wed at 10:00 AM" code="PHY101" room="Hall A" color="indigo"]
4. Adding a Deadline/Task:
   - When they ask to add an assignment, homework, quiz, exam, or deadline:
     [ACTION: ADD_DEADLINE title="Math Homework" dueDate="YYYY-MM-DD" subjectName="Physics 101" priority="high"] (priority: high, medium, or low)
5. Reinforcing Streak Core:
   - When they want to log study achievements, boost their consistency, or manually update/increment their streak:
     [ACTION: UPDATE_STREAK increment=1]

Ensure you only append the tags when requested or contextually triggered. Do not describe or write out the bracket tags in your dialogue; simply output them on a fresh line at the end.

CRITICAL FORMATTING RULES:
1. Do NOT use markdown headers starting with hash characters (e.g., '#', '##', '###', '####'). Instead, format headings as simple capitalized bold labels (e.g. "**Step 1: Concept**" or "**DIAGNOSIS:**").
2. Do NOT use excessive, broken or empty asterisks like '****'. If you need to bold a word, wrap it with double asterisks on each side (e.g., '**word**').
3. Format all tables using proper standard Markdown table notation (e.g. using pipes '|' and dashes '---' for the headers). Do not construct tables manually using dashes/underscores alone.
4. For detailed analytical breakdowns, deep dives, or extra explanations, wrap them inside HTML details disclosures like so: <details><summary>Click to view detailed analysis</summary>Your detailed text here</details>. This keeps the main chat clean and uncluttered.`;

const pickAiProvider = (): AiProvider => {
  const preferred = (process.env.AI_PROVIDER || "").toLowerCase();
  if (preferred === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new Error("AI_PROVIDER=openai requires OPENAI_API_KEY");
    return "openai";
  }
  if (preferred === "gemini") {
    if (!process.env.GEMINI_API_KEY) throw new Error("AI_PROVIDER=gemini requires GEMINI_API_KEY");
    return "gemini";
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error("Set GEMINI_API_KEY or OPENAI_API_KEY before starting Awaji OS");
};

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const getOpenAIModel = () => process.env.OPENAI_MODEL || "gpt-4.1-mini";

async function callOpenAIResponses(body: Record<string, any>): Promise<any> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY environment variable is required");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      store: false,
      ...body,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI request failed with HTTP ${response.status}`);
  }
  return data;
}

const extractOpenAIText = (data: any): string => {
  if (typeof data?.output_text === "string") return data.output_text;
  const textParts: string[] = [];
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === "string") textParts.push(part.text);
    }
  }
  return textParts.join("\n").trim();
};

async function generateOpenAIText(
  prompt: string,
  systemInstruction?: string,
  history: any[] = []
): Promise<string> {
  const input = [
    ...history.map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: String(msg.content || ""),
    })),
    { role: "user", content: prompt },
  ];

  const data = await callOpenAIResponses({
    instructions: systemInstruction,
    input,
  });
  return extractOpenAIText(data);
}

async function generateOpenAIJson<T>(prompt: string, fallback: T, systemInstruction?: string): Promise<T> {
  const text = await generateOpenAIText(
    `${prompt}\n\nReturn only valid JSON. Do not wrap it in markdown fences.`,
    systemInstruction
  );
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned || JSON.stringify(fallback));
}

async function parseMaterialWithOpenAI(fileData: string, mimeType: string): Promise<string> {
  const prompt = "You are an elite academic material transcriber. Extract all main topics, critical formulas, definitions, key arguments, and summarized notes from the provided file. Format them beautifully in clean markdown, with bullet points, bold headers, and structured lists. Do not include introductory remarks - start directly with the title and structured notes.";
  const data = await callOpenAIResponses({
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: mimeType === "application/pdf" ? "study-material.pdf" : "study-material.txt",
            file_data: `data:${mimeType};base64,${fileData}`,
          },
          { type: "input_text", text: prompt },
        ],
      },
    ],
  });
  return extractOpenAIText(data);
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Guardian Spirit Chat Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (pickAiProvider() === "openai") {
      const text = await generateOpenAIText(message, AWAJI_SYSTEM_INSTRUCTION, history || []);
      res.json({ text });
      return;
    }

    const ai = getGeminiClient();

    // Reconstruct history structure for chat.sendMessage
    // If history is provided, we can either pass it during chats.create or use generateContent
    // Since ai.chats.create allows setting history, let's map history cleanly
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: AWAJI_SYSTEM_INSTRUCTION,
      },
      history: formattedHistory,
    });

    const result = await chat.sendMessage({ message });
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// Extract terms/notes from uploaded study material (e.g. PDF)
app.post("/api/gemini/parse-material", async (req, res) => {
  try {
    const { fileData, mimeType } = req.body;
    if (!fileData || !mimeType) {
      res.status(400).json({ error: "fileData and mimeType are required" });
      return;
    }

    if (pickAiProvider() === "openai") {
      const text = await parseMaterialWithOpenAI(fileData, mimeType);
      res.json({ text });
      return;
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        },
        "You are an elite academic material transcriber. Extract all main topics, critical formulas, definitions, key arguments, and summarized notes from the provided file. Format them beautifully in clean markdown, with bullet points, bold headers, and structured lists. Do not include introductory remarks - start directly with the title and structured notes."
      ]
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error parsing material:", error);
    res.status(500).json({ error: error.message || "Failed to extract notes from study material." });
  }
});

// Generate Flashcards from notes or parsed text
app.post("/api/gemini/generate-flashcards", async (req, res) => {
  try {
    const { notesText } = req.body;
    if (!notesText) {
      res.status(400).json({ error: "notesText is required" });
      return;
    }

    if (pickAiProvider() === "openai") {
      const prompt = `Based on the academic study notes provided below, generate a list of 5 to 10 highly effective Active Recall flashcards.
Each flashcard should target an essential concept, term, formula, or relationship.
Each item must contain "front" and "back" string fields.

Source Notes:
${notesText}`;
      const flashcards = await generateOpenAIJson<any[]>(prompt, []);
      res.json(flashcards);
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Based on the academic study notes provided below, generate a list of 5 to 10 highly effective Active Recall flashcards.
Each flashcard should target an essential concept, term, formula, or relationship.
The "front" should contain a clear, challenging question or prompt.
The "back" should contain a comprehensive, clear, and accurate answer or explanation.

Source Notes:
${notesText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of flashcards",
          items: {
            type: Type.OBJECT,
            required: ["front", "back"],
            properties: {
              front: {
                type: Type.STRING,
                description: "The prompt or question on the front side."
              },
              back: {
                type: Type.STRING,
                description: "The answer or key concept explanation on the back side."
              }
            }
          }
        }
      }
    });

    const flashcards = JSON.parse(response.text || "[]");
    res.json(flashcards);
  } catch (error: any) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards from source text." });
  }
});

// Socratic Method Dialogue Endpoint
app.post("/api/gemini/socratic-chat", async (req, res) => {
  try {
    const { message, history, sourceMaterial } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (pickAiProvider() === "openai") {
      let systemPrompt = `You are Socrates, a brilliant, deeply caring, and rigorous classical tutor.
Your pedagogical goal is to help the student master their material using cooperative argumentative dialogue (the Socratic Method).
- DO NOT give answers directly! If the student asks for an answer, challenge them to think, break down the problem, or propose a hypothesis.
- Point out contradictions or logical leaps in their reasoning with kind, probing questions.
- Encourage them to define terms precisely, find examples, or apply theories.
- Keep your turns concise (1-3 sentences) to maintain an active, conversational dialogue.
- Be supportive, but firm on rigor and deep thinking. Let them experience the joy of discovery.`;

      if (sourceMaterial) {
        systemPrompt += `\n\nYour session is strictly focused on the following source study notes/material. Limit your prompts and queries to topics covered in or relevant to this text:\n--- START MATERIAL ---\n${sourceMaterial}\n--- END MATERIAL ---`;
      }

      const text = await generateOpenAIText(message, systemPrompt, history || []);
      res.json({ text });
      return;
    }

    const ai = getGeminiClient();

    // Setup base Socratic Tutor prompt
    let systemPrompt = `You are Socrates, a brilliant, deeply caring, and rigorous classical tutor.
Your pedagogical goal is to help the student master their material using cooperative argumentative dialogue (the Socratic Method).
- DO NOT give answers directly! If the student asks for an answer, challenge them to think, break down the problem, or propose a hypothesis.
- Point out contradictions or logical leaps in their reasoning with kind, probing questions.
- Encourage them to define terms precisely, find examples, or apply theories.
- Keep your turns concise (1-3 sentences) to maintain an active, conversational dialogue.
- Be supportive, but firm on rigor and deep thinking. Let them experience the joy of discovery.`;

    if (sourceMaterial) {
      systemPrompt += `\n\nYour session is strictly focused on the following source study notes/material. Limit your prompts and queries to topics covered in or relevant to this text:\n--- START MATERIAL ---\n${sourceMaterial}\n--- END MATERIAL ---`;
    }

    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      history: formattedHistory,
    });

    const result = await chat.sendMessage({ message });
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Error in Socratic chat:", error);
    res.status(500).json({ error: error.message || "Socratic session error." });
  }
});

// Feynman Technique Evaluation Endpoint
app.post("/api/gemini/feynman-evaluate", async (req, res) => {
  try {
    const { concept, explanation, sourceMaterial } = req.body;
    if (!concept || !explanation) {
      res.status(400).json({ error: "Concept and explanation are required" });
      return;
    }

    if (pickAiProvider() === "openai") {
      let systemPrompt = `You are Richard Feynman, the legendary physicist and teacher known as the "Great Explainer."
Your pedagogical philosophy is that if you cannot explain something in simple terms to a non-expert (like an 8-year-old child), you do not truly understand it yourself.

Evaluate the student's explanation of the concept "${concept}".
- Provide a Simplicity Score (0 to 100%) reflecting how clear and jargon-free the language is.
- Detect any complex jargon terms used without simple explanation.
- Identify critical knowledge gaps or details left out.
- Recommend a highly creative, vivid real-world analogy to make it easy to grasp.
- Provide a constructive, encouraging critique.
- Provide an improved, ideal Feynman-style explanation that is incredibly simple and engaging.`;

      if (sourceMaterial) {
        systemPrompt += `\n\nReference the following study notes as the source of truth for the academic concept:\n--- START MATERIAL ---\n${sourceMaterial}\n--- END MATERIAL ---`;
      }

      const evalJson = await generateOpenAIJson(
        `Return a JSON object with these fields: simplicityScore number, jargonDetected string array, knowledgeGaps string array, recommendedAnalogy string, critique string, improvedVersion string.

Concept to explain: ${concept}
Student's explanation:
${explanation}`,
        {},
        systemPrompt
      );
      res.json(evalJson);
      return;
    }

    const ai = getGeminiClient();

    let systemPrompt = `You are Richard Feynman, the legendary physicist and teacher known as the "Great Explainer."
Your pedagogical philosophy is that if you cannot explain something in simple terms to a non-expert (like an 8-year-old child), you do not truly understand it yourself.

Evaluate the student's explanation of the concept "${concept}".
- Provide a Simplicity Score (0 to 100%) reflecting how clear and jargon-free the language is.
- Detect any complex jargon terms used without simple explanation.
- Identify critical knowledge gaps or details left out.
- Recommend a highly creative, vivid real-world analogy to make it easy to grasp.
- Provide a constructive, encouraging critique.
- Provide an improved, ideal Feynman-style explanation that is incredibly simple and engaging.`;

    if (sourceMaterial) {
      systemPrompt += `\n\nReference the following study notes as the source of truth for the academic concept:\n--- START MATERIAL ---\n${sourceMaterial}\n--- END MATERIAL ---`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Concept to explain: ${concept}\nStudent's explanation:\n${explanation}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["simplicityScore", "jargonDetected", "knowledgeGaps", "recommendedAnalogy", "critique", "improvedVersion"],
          properties: {
            simplicityScore: {
              type: Type.INTEGER,
              description: "A score from 0 to 100 indicating how simple, clear, and jargon-free the explanation is."
            },
            jargonDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of complex technical jargon words or phrases the student used without clarifying them."
            },
            knowledgeGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific missing elements, misunderstandings, or concepts they left out."
            },
            recommendedAnalogy: {
              type: Type.STRING,
              description: "An incredibly simple, fun, or creative real-world analogy."
            },
            critique: {
              type: Type.STRING,
              description: "Encouraging, constructive feedback as Richard Feynman."
            },
            improvedVersion: {
              type: Type.STRING,
              description: "An ideal, beautifully simple, analogy-driven Feynman explanation for a child."
            }
          }
        }
      }
    });

    const evalJson = JSON.parse(response.text || "{}");
    res.json(evalJson);
  } catch (error: any) {
    console.error("Error in Feynman evaluation:", error);
    res.status(500).json({ error: error.message || "Feynman evaluation failed." });
  }
});

// Custom Itinerary / Study Plan Generator with Structured JSON Schema
app.post("/api/gemini/itinerary", async (req, res) => {
  try {
    const { interests, duration, style, season } = req.body;

    const daysCount = parseInt(duration, 10) || 2;
    const selectedSubjects = Array.isArray(interests) ? interests.join(", ") : "general studies";
    const studyStyle = style || "balanced";
    const phase = season || "finals prep";

    if (pickAiProvider() === "openai") {
      const prompt = `Generate a customized academic study plan for a ${daysCount}-day intensive workshop/study period.
The student is prepping for: ${phase}.
The primary subjects or focus areas are: ${selectedSubjects}.
Their preferred study pace/style is: ${studyStyle}.
Create an authentic, motivating, and highly practical daily schedule. Include intervals for active recall, Feynman technique practice, and Pomodoro focus blocks.

Return a JSON object with:
- title string
- summary string
- days array of objects with dayNumber number, theme string, schedule array
- each schedule item has time, title, location, description, culturalSecret strings
- packingTips string array`;

      const itineraryJson = await generateOpenAIJson(prompt, {});
      res.json(itineraryJson);
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate a customized academic study plan for a ${daysCount}-day intensive workshop/study period.
The student is prepping for: ${phase}.
The primary subjects or focus areas are: ${selectedSubjects}.
Their preferred study pace/style is: ${studyStyle}.
Create an authentic, motivating, and highly practical daily schedule. Include intervals for active recall, Feynman technique practice, and Pomodoro focus blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "summary", "days", "packingTips"],
          properties: {
            title: {
              type: Type.STRING,
              description: "A highly motivating, beautifully stylized title for the study plan (e.g. 'Ascent: Your Linear Algebra & Coding Mastery').",
            },
            summary: {
              type: Type.STRING,
              description: "A 2-3 sentence inspiring cognitive summary outlining the psychological strategy for this plan.",
            },
            days: {
              type: Type.ARRAY,
              description: "The daily study schedule.",
              items: {
                type: Type.OBJECT,
                required: ["dayNumber", "theme", "schedule"],
                properties: {
                  dayNumber: {
                    type: Type.INTEGER,
                    description: "The study day number (e.g. 1, 2, 3).",
                  },
                  theme: {
                    type: Type.STRING,
                    description: "The cognitive focus or theme of this day (e.g., 'Foundation & Active Recall' or 'Complex Applications & Mock Exam').",
                  },
                  schedule: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["time", "title", "location", "description", "culturalSecret"],
                      properties: {
                        time: {
                          type: Type.STRING,
                          description: "Specific block time (e.g., '09:00 AM - 10:30 AM', 'Afternoon Focus Block').",
                        },
                        title: {
                          type: Type.STRING,
                          description: "The core learning activity or technique (e.g. 'Feynman Explainer session', 'Spaced Repetition Review').",
                        },
                        location: {
                          type: Type.STRING,
                          description: "Recommended environment (e.g. 'Silent Library Corner', 'Clean Desk with Sandalwood Incense', 'Coffee Shop').",
                        },
                        description: {
                          type: Type.STRING,
                          description: "Engaging step-by-step detail of what exactly to study, solve, or write.",
                        },
                        culturalSecret: {
                          type: Type.STRING,
                          description: "A valuable 'Study Secret' or cognitive tip (e.g., 'Do not look at social media during the 5-minute break; your brain is cementing memories!').",
                        },
                      },
                    },
                  },
                },
              },
            },
            packingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 highly effective study desk recommendations, hydration, or psychological prep tips.",
            },
          },
        },
      },
    });

    const itineraryJson = JSON.parse(response.text || "{}");
    res.json(itineraryJson);
  } catch (error: any) {
    console.error("Error in study planner endpoint:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// -------------------------------------------------------------
// Vite and Static Assets serving
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Awaji App Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
