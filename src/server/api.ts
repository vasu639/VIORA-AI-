import express from "express";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}) {
  const ai = getAiClient();
  // Prioritize gemini-3.1-flash-lite and gemini-3.5-flash-lite for instant response, free-tier availability, and multimodal capability
  const models = [
    params.preferredModel || "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
  ];

  let lastError: any = null;
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Calling model ${model} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        console.log(`[Gemini] Model ${model} succeeded!`);
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Attempt ${attempt} with ${model} failed:`, err?.message || err);
        // If quota exhausted or rate limit hit on this model, instantly switch to next model
        if (
          err?.message?.includes("429") ||
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.message?.includes("quota")
        ) {
          console.warn(`[Gemini] Model ${model} quota exhausted, cascading to next model...`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError;
}

export function createApiApp() {
  const app = express();

  // Allow larger payload for PDF base64 uploads (up to 30mb)
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // Netlify functions rewrite support (normalizes any prefix to /api/...)
  app.use((req, _res, next) => {
    if (req.url.startsWith("/.netlify/functions/api")) {
      req.url = req.url.replace("/.netlify/functions/api", "");
    }
    if (!req.url.startsWith("/api") && req.url !== "" && req.url !== "/") {
      req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
    }
    next();
  });

  // Health check
  app.get(["/api/health", "/health"], (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Generate Questions
  app.post(["/api/generate-questions", "/generate-questions"], async (req, res) => {
    const { mode, subMode, courseName, level, numQuestions = 6, fileBase64, mimeType, textContent } = req.body;

    if (!fileBase64 && !textContent) {
      return res.status(400).json({ error: "No document or file was attached." });
    }

    try {
      const questionCount = Math.min(Math.max(Number(numQuestions) || 6, 3), 10);

      let prompt = "";
      if (mode === "viva") {
        prompt = `You are an experienced university examiner conducting an oral viva-voce examination.
Attached is the syllabus for the course "${courseName || "Subject Syllabus"}". The student has chosen difficulty level: ${level || "Intermediate"}.

Read the syllabus and generate ${questionCount} viva questions that:
- cover the syllabus's major topics, spread roughly evenly across them
- match the ${level || "Intermediate"} difficulty (Beginner = definitions, fundamental concepts and terminology; Intermediate = explain mechanisms, workflows, and application; Advanced = architecture trade-offs, compare alternatives, justify design, and probe edge cases)
- sound like something an examiner would actually ask out loud in a 15–20 minute viva, not an exam-paper essay question. Keep questions clear, focused, and conversational.

Return ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"questions":[{"id":1,"topic":"<syllabus topic this comes from>","question":"<the question>"}]}`;
      } else {
        const selectedSubMode = subMode || "technical";
        prompt = `You are an experienced technical interviewer conducting a ${selectedSubMode} interview.
Attached is the candidate's resume/CV. Read it carefully and generate ${questionCount} interview questions that are grounded in what's actually on this resume — their specific listed skills, projects, tools, frameworks, and work experience — never a generic question that any stranger's resume would also get.

Style guide for ${selectedSubMode}:
- Technical: dig into a specific technology or project they listed; ask them to explain a real decision, architectural challenge, or trade-off from it.
- Behavioral: STAR-style questions (situation/task/action/result) about teamwork, cross-functional collaboration, conflict, or overcoming failure, tied to a role or project they actually list on the resume.
- Managerial: prioritization, delegation, system reliability, mentorship, and ownership questions scaled to their actual experience level shown on the resume.
- Rapid Fire: short, punchy questions answerable in under 30-45 seconds each, covering the breadth of their listed skills and technical stack.

Return ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"questions":[{"id":1,"basedOn":"<specific resume detail or project this draws on>","question":"<the question>"}]}`;
      }

      const contents: Array<string | { text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: prompt },
      ];

      if (fileBase64) {
        // Strip data URI prefix if present
        let cleanBase64 = fileBase64;
        let detectedMime = mimeType || "application/pdf";
        if (typeof fileBase64 === "string" && fileBase64.includes(",")) {
          const parts = fileBase64.split(",");
          cleanBase64 = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match && match[1]) {
            detectedMime = match[1];
          }
        }

        contents.push({
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64,
          },
        });
      } else if (textContent) {
        contents.push({
          text: `Document Content:\n${textContent}`,
        });
      }

      const response = await generateContentWithRetry({
        contents,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const cleanJson = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*$/gi, "")
        .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (pErr) {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON returned by AI model: " + cleanJson.slice(0, 100));
        }
      }

      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error("No question list found in AI model response.");
      }

      // Normalize questions array to guarantee standard structure
      const normalized = parsed.questions.map((q: any, idx: number) => ({
        id: q.id || idx + 1,
        question: q.question || q.text || q.prompt || "Question",
        topic: q.topic || q.basedOn || q.category || (mode === "viva" ? "Course Syllabus Topic" : "Technical Background"),
        basedOn: q.basedOn || q.topic || q.category || (mode === "viva" ? "Course Syllabus" : "Resume Background"),
      }));

      return res.status(200).json({ questions: normalized });
    } catch (err: any) {
      console.error("Error generating questions with Gemini:", err);

      // Resilient fallback questions ensure candidate is never stranded
      const fallbackQs = getResilientFallbackQuestions(mode, subMode, courseName, level, numQuestions);
      return res.status(200).json({ questions: fallbackQs });
    }
  });

function getResilientFallbackQuestions(
  mode: string,
  subMode: string = "technical",
  courseName: string = "",
  level: string = "Intermediate",
  numQuestions: number = 5
) {
  const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 10);
  if (mode === "viva") {
    const list = [
      { id: 1, topic: "Core System Architecture", question: `How would you explain the foundational principles of ${courseName || "this course"} to an examiner, and what are its primary architectural layers?` },
      { id: 2, topic: "Process Concurrency & Invariants", question: `What concurrency or race hazards commonly occur in ${courseName || "this subject"}, and how do synchronization primitives safeguard data integrity?` },
      { id: 3, topic: "Memory Management & Virtualization", question: `Walk through the mechanics of virtual address translation, page faults, and how modern page replacement policies prevent thrashing.` },
      { id: 4, topic: "Consensus & Coordination", question: `Explain the key trade-offs between consistency and availability under network partitions, and how consensus protocols reach agreement.` },
      { id: 5, topic: "Failure Recovery & Edge Cases", question: `If a primary node or worker process abruptly fails mid-transaction, what write-ahead logging or recovery protocol restores consistent state?` },
      { id: 6, topic: "Production Scalability Trade-offs", question: `Compare the monolithic approach to modern distributed or containerized deployment for this architecture. Where does the design bottleneck first?` }
    ];
    return list.slice(0, count);
  } else {
    if (subMode === "behavioral") {
      const list = [
        { id: 1, basedOn: "Stakeholder Alignment & Ambiguity", question: "Describe a project on your resume where specifications were unclear or changed late. How did you establish consensus and deliver?" },
        { id: 2, basedOn: "Architectural Disagreements", question: "Tell me about a technical debate you had with a senior teammate. How did you present evidence and reach a constructive compromise?" },
        { id: 3, basedOn: "Production Outage Resolution", question: "Walk me through the highest-stakes outage or bug you diagnosed. What was your triage sequence and what preventative measures did you implement?" },
        { id: 4, basedOn: "Mentorship & Quality Standards", question: "How do you foster high code review standards and mentor junior developers without slowing down sprint velocity?" },
        { id: 5, basedOn: "Prioritization Under Constraints", question: "When urgent bug reports clash with strategic technical debt reduction, what framework do you use to decide what gets built first?" }
      ];
      return list.slice(0, count);
    } else if (subMode === "managerial") {
      const list = [
        { id: 1, basedOn: "System Reliability & SLAs", question: "How do you structure monitoring alerts and SLIs/SLOs to ensure issues are caught before clients notice degradation?" },
        { id: 2, basedOn: "Capacity Planning & Spikes", question: "How do you architect system capacity and autoscaling to handle unforeseen 5x traffic surges without runaway cloud costs?" },
        { id: 3, basedOn: "Technical Debt Governance", question: "How do you justify major architectural refactoring investments to non-technical executive stakeholders?" },
        { id: 4, basedOn: "Cross-Team Dependencies", question: "How do you mitigate risks when your team's deliverables depend on third-party APIs or external team timelines?" }
      ];
      return list.slice(0, count);
    } else if (subMode === "rapidfire") {
      const list = [
        { id: 1, basedOn: "Runtime Internals", question: "Explain the difference between process memory heap and stack allocation in 30 seconds." },
        { id: 2, basedOn: "Database Indexing", question: "Why do B-Trees outclass binary search trees for disk-based database indexes?" },
        { id: 3, basedOn: "Distributed Caching", question: "Explain the trade-off between cache-aside and write-through caching patterns." },
        { id: 4, basedOn: "Network Transport", question: "How does TCP congestion control handle packet drops compared to UDP?" },
        { id: 5, basedOn: "API Protocols", question: "When would you prefer gRPC over REST with JSON in a high-scale microservices backend?" }
      ];
      return list.slice(0, count);
    } else {
      const list = [
        { id: 1, basedOn: "Event-Driven Data Pipelines", question: "Looking at your listed Kafka streaming experience, how did you partition topics and handle consumer group rebalancing under heavy load?" },
        { id: 2, basedOn: "Latency Optimization & Redis", question: "You highlighted reducing p99 latency down to sub-35ms. Walk through how you structured distributed keys, TTLs, and cache warming." },
        { id: 3, basedOn: "Microservices & Containerization", question: "Walk me through how you handled service discovery, circuit breaking, and database migrations during your Kubernetes rollout." },
        { id: 4, basedOn: "Concurrency & Lock Contention", question: "How did you prevent race conditions and connection pool exhaustion in your database transactions during concurrent spikes?" },
        { id: 5, basedOn: "Observability & Tracing", question: "What distributed tracing and logging architecture did you implement to diagnose multi-service request flows?" }
      ];
      return list.slice(0, count);
    }
  }
}


  // Comprehensive Body Language & Presence Coach Bank (Categorized, Diverse & Non-Repeating)
  const DIVERSE_COACH_TIPS: { category: string; label: string; tip: string }[] = [
    // 1. Eye Contact & Visual Engagement
    {
      category: "eye_contact",
      label: "Direct Lens Gaze",
      tip: "Direct your eye gaze toward the camera lens rather than looking down at your screen to simulate authentic eye contact with the interviewer."
    },
    {
      category: "eye_contact",
      label: "Anchor During Key Claims",
      tip: "Lock steady eye contact with the webcam whenever stating your core thesis or technical trade-off, using natural, relaxed blinking."
    },
    {
      category: "eye_contact",
      label: "Visual Window Alignment",
      tip: "Position your browser window directly underneath your physical webcam so looking at the question naturally keeps your eyes level with the lens."
    },
    {
      category: "eye_contact",
      label: "Thinking Without Looking Down",
      tip: "When pausing to organize your thoughts, glance straight ahead or slightly upward rather than looking down at your lap or keyboard."
    },
    {
      category: "eye_contact",
      label: "Avoid Darting Gaze",
      tip: "Keep your gaze steady and anchored — avoid rapid side-to-side eye movement while recalling complex formulas or architecture details."
    },
    {
      category: "eye_contact",
      label: "Soft Eye Focus",
      tip: "Softly relax your brow and facial muscles while looking at the camera to convey confident, friendly authority without staring aggressively."
    },

    // 2. Shoulders & Upper Body Relaxation
    {
      category: "shoulders",
      label: "Drop Shoulders Down",
      tip: "Consciously roll your shoulders back and drop them down away from your ears to release physical interview tension."
    },
    {
      category: "shoulders",
      label: "Forearms Desk Rest",
      tip: "Rest your forearms gently on the desk; this naturally relieves clavicle tightness and opens up your upper chest."
    },
    {
      category: "shoulders",
      label: "Symmetric Upper Body",
      tip: "Check for asymmetric shoulder slouching: keep both shoulders level and relaxed to project executive composure."
    },
    {
      category: "shoulders",
      label: "2-Second Reset",
      tip: "Perform a quick subtle shoulder roll between questions — releasing upper-trapezius stiffness directly improves vocal depth and resonance."
    },
    {
      category: "shoulders",
      label: "Unclench Upper Torso",
      tip: "Inhale deeply into your ribs and allow your shoulder blades to settle naturally against the back of your chair on the exhale."
    },

    // 3. Spine & Posture
    {
      category: "posture",
      label: "Tall Spine Alignment",
      tip: "Sit tall with your spine elongated and your lower back gently supported, avoiding slouching into the base of your chair."
    },
    {
      category: "posture",
      label: "Active Forward Engagement",
      tip: "Maintain a slight 5-to-10 degree forward lean toward the camera — this subtle posture communicates active interest and engagement."
    },
    {
      category: "posture",
      label: "Open Ribcage",
      tip: "Keep your chest open rather than hunching forward; an expanded ribcage gives your lungs full capacity for clear, unhurried articulation."
    },
    {
      category: "posture",
      label: "Grounded Footing",
      tip: "Plant both feet firmly flat on the floor — physical grounding provides core stability and prevents subconscious swiveling."
    },
    {
      category: "posture",
      label: "Level Chin & Head",
      tip: "Keep your chin parallel to the desk and your head balanced; avoid tilting your neck sideways or resting your cheek on your hand."
    },

    // 4. Camera Angle & Framing
    {
      category: "framing",
      label: "Eye-Level Camera Height",
      tip: "Elevate your webcam or laptop so the camera lens is exactly at eye level, ensuring the panel doesn't look down or up at you."
    },
    {
      category: "framing",
      label: "Mid-Chest Framing & Headroom",
      tip: "Position yourself so you are framed from mid-chest up, leaving roughly two inches of breathing headroom below the top border."
    },
    {
      category: "framing",
      label: "Centered Video Composition",
      tip: "Center your torso squarely within the frame so your presence feels balanced, composed, and visually anchored."
    },
    {
      category: "framing",
      label: "Frontal Soft Lighting",
      tip: "Ensure your primary light source is in front of your face rather than behind you to eliminate backlight silhouette and keep facial cues visible."
    },
    {
      category: "framing",
      label: "Optimal Lens Distance",
      tip: "Sit approximately arm's length from the screen (about 20–28 inches) so your gestures fit comfortably in view without crowding the lens."
    },

    // 5. Breathing & Vocal Composure
    {
      category: "breathing",
      label: "Diaphragmatic Inhale",
      tip: "Take a quiet, 2-second diaphragmatic breath through your nose before answering to ground your vocal pitch and calm your heart rate."
    },
    {
      category: "breathing",
      label: "Measured Cadence",
      tip: "Deliberately slow down your speaking cadence by 10% — pacing yourself conveys mastery and gives the examiner time to digest your logic."
    },
    {
      category: "breathing",
      label: "Strategic 1-Second Pauses",
      tip: "Embrace a 1-second deliberate silence between major points instead of filling gaps with vocal fillers like 'um', 'like', or 'actually'."
    },
    {
      category: "breathing",
      label: "Jaw & Facial Release",
      tip: "Slightly part your back teeth and soften your jaw; releasing facial tension immediately clarifies your vocal diction."
    },
    {
      category: "breathing",
      label: "Purposeful Hand Gestures",
      tip: "Use open-palm hand gestures within the lower frame to illustrate architectural flow, then rest hands calmly between points."
    }
  ];

  function selectNonRepeatingTip(previousTips: string[] = [], requestedCategory?: string) {
    const prevSet = new Set((previousTips || []).map((t) => t.toLowerCase().trim()));

    // Filter candidate tips
    let eligible = DIVERSE_COACH_TIPS.filter((item) => {
      const tipLower = item.tip.toLowerCase().trim();
      const labelLower = item.label.toLowerCase().trim();
      const isDuplicate = prevSet.has(tipLower) || Array.from(prevSet).some((p) => p.includes(labelLower) || p.includes(tipLower.slice(0, 30)));
      if (isDuplicate) return false;
      if (requestedCategory && requestedCategory !== "all" && item.category !== requestedCategory) {
        return false;
      }
      return true;
    });

    // If all in requested category were exhausted, relax category constraint
    if (eligible.length === 0) {
      eligible = DIVERSE_COACH_TIPS.filter((item) => {
        const tipLower = item.tip.toLowerCase().trim();
        return !prevSet.has(tipLower);
      });
    }

    // If still exhausted, cycle safely
    if (eligible.length === 0) {
      eligible = DIVERSE_COACH_TIPS;
    }

    // Pick random from eligible
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    return chosen;
  }

  // Posture & Framing Video Feedback
  app.post("/api/posture-feedback", async (req, res) => {
    const { frameBase64, previousTips = [], requestedCategory } = req.body;

    // If no video frame, provide a curated fresh tip right away
    if (!frameBase64) {
      const selected = selectNonRepeatingTip(previousTips, requestedCategory);
      return res.status(200).json({
        tip: selected.tip,
        category: selected.category,
        label: selected.label,
      });
    }

    try {
      const prompt = `You are an expert oral viva and executive interview coach analyzing a single video snapshot.
Previous tips already given to this user during this session (DO NOT REPEAT ANY OF THESE OR SIMILAR PHRASES):
${previousTips.slice(-6).map((t: string) => `- ${t}`).join("\n") || "- None yet"}

Focus area to evaluate: ${requestedCategory || "eye contact, shoulder relaxation, upright spine posture, or camera framing"}.
Provide ONE short, fresh, actionable coaching suggestion (1 sentence, max 25 words).
- If they look tense, suggest dropping shoulders or diaphragmatic breathing.
- If looking down, suggest aiming gaze at the camera lens.
- If framing is off, suggest eye-level camera height or headroom.
- DO NOT repeat previous tips. Return ONLY the single sentence.`;

      const response = await generateContentWithRetry({
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: frameBase64,
            },
          },
        ],
      });

      const geminiTip = response.text ? response.text.trim().replace(/^["']|["']$/g, "") : "";
      
      // Check for duplication against previousTips
      const isTooSimilar = previousTips.some(
        (prev: string) =>
          prev.toLowerCase() === geminiTip.toLowerCase() ||
          (geminiTip.length > 20 && prev.toLowerCase().includes(geminiTip.toLowerCase().slice(0, 25)))
      );

      if (geminiTip && !isTooSimilar) {
        // Detect likely category
        let detectedCategory = requestedCategory || "posture";
        const lower = geminiTip.toLowerCase();
        if (lower.includes("eye") || lower.includes("gaze") || lower.includes("look")) detectedCategory = "eye_contact";
        else if (lower.includes("shoulder") || lower.includes("tense") || lower.includes("relax")) detectedCategory = "shoulders";
        else if (lower.includes("spine") || lower.includes("lean") || lower.includes("sit") || lower.includes("chest")) detectedCategory = "posture";
        else if (lower.includes("camera") || lower.includes("frame") || lower.includes("headroom") || lower.includes("angle")) detectedCategory = "framing";
        else if (lower.includes("breath") || lower.includes("pause") || lower.includes("jaw") || lower.includes("pace")) detectedCategory = "breathing";

        return res.status(200).json({
          tip: geminiTip,
          category: detectedCategory,
          label: "Live Camera Insight",
        });
      }

      // If Gemini returned a duplicate or empty, select from non-repeating bank
      const fallbackSelected = selectNonRepeatingTip(previousTips, requestedCategory);
      return res.status(200).json({
        tip: fallbackSelected.tip,
        category: fallbackSelected.category,
        label: fallbackSelected.label,
      });
    } catch (err: any) {
      console.error("Error evaluating posture frame:", err);
      const fallbackSelected = selectNonRepeatingTip(previousTips, requestedCategory);
      return res.status(200).json({
        tip: fallbackSelected.tip,
        category: fallbackSelected.category,
        label: fallbackSelected.label,
      });
    }
  });

  // Per-Answer Evaluation (Correctness, Confidence & Genuine Merit)
  app.post("/api/evaluate-answer", async (req, res) => {
    const { question, answer, topicOrGrounding, mode, degreeOrRole } = req.body;

    if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
      return res.status(200).json({
        score: 1,
        correctnessScore: 0,
        confidenceScore: 10,
        verdict: "Question Skipped / No Answer",
        feedback: "No oral response was provided for this question. In an examination or interview, silence guarantees zero marks.",
        correctAspects: [],
        missingOrIncorrect: ["The entire question was left unanswered."],
        keyTakeaway: "Always attempt an answer by defining the core term or stating what you know about the subject.",
      });
    }

    const trimmed = answer.trim();

    try {
      const prompt = `You are a strict, objective academic viva examiner and technical hiring interviewer evaluating an oral candidate response.
Mode: ${mode === "viva" ? "University Oral Viva Voce" : "Professional Technical Interview"}
Academic Degree / Job Role Context: ${degreeOrRole || "General"}
Subject / Grounding Topic: ${topicOrGrounding || "N/A"}
Question Asked: "${question}"
Candidate's Spoken / Written Answer: "${trimmed}"

CRITICAL GRADING DIRECTIVE:
Provide a GENUINE, rigorous, uninflated evaluation. Do NOT give standard default marks like 80% or 7/10.
- If the answer is vague, trivial, mostly incorrect, or just guessing (e.g., 1-2 generic sentences, "I think maybe...", or factually wrong), score correctness low (10-40%) and confidence low (20-45%).
- If the answer is partially right with key omissions, score correctness (50-68%).
- If the answer is thorough, technically accurate with definitions and trade-offs, score correctness (75-95%).
- Rate Confidence independently based on assertiveness, conviction, structure, and absence of excessive hesitation or hedge words.

Return ONLY valid JSON in this exact structure:
{
  "correctnessScore": 75, // integer 0-100 evaluating factual/conceptual accuracy
  "confidenceScore": 80, // integer 0-100 evaluating assertiveness, clarity, conviction
  "score": 8, // integer 1-10, strictly computed as Math.max(1, Math.min(10, Math.round((correctnessScore * 0.7 + confidenceScore * 0.3) / 10)))
  "verdict": "<short 2-4 word honest status, e.g., 'Accurate & Confident', 'Partially Correct - Needs Depth', 'Hesitant Delivery', 'Factually Flawed', 'Superficial Response'>",
  "feedback": "<2-3 sentences of constructive critique: specifically evaluate the technical reasoning and delivery>",
  "correctAspects": ["<1-2 points the candidate got right>"],
  "missingOrIncorrect": ["<1-2 specific points missed, inaccurate, or needed for full marks>"],
  "keyTakeaway": "<one crisp sentence advising how to answer this in an oral viva or interview>"
}`;

      const response = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = (response.text || "{}").replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      }

      const correctness = typeof parsed.correctnessScore === "number" ? Math.max(0, Math.min(100, parsed.correctnessScore)) : 50;
      const confidence = typeof parsed.confidenceScore === "number" ? Math.max(0, Math.min(100, parsed.confidenceScore)) : 50;
      const score = typeof parsed.score === "number" ? Math.max(1, Math.min(10, parsed.score)) : Math.max(1, Math.min(10, Math.round((correctness * 0.7 + confidence * 0.3) / 10)));

      return res.status(200).json({
        correctnessScore: correctness,
        confidenceScore: confidence,
        score,
        verdict: parsed.verdict || (correctness >= 75 ? "Technically Sound" : correctness >= 50 ? "Partially Correct" : "Needs Review"),
        feedback: parsed.feedback || "Your answer was reviewed for technical accuracy and oral presence.",
        correctAspects: Array.isArray(parsed.correctAspects) ? parsed.correctAspects : [],
        missingOrIncorrect: Array.isArray(parsed.missingOrIncorrect) ? parsed.missingOrIncorrect : [],
        keyTakeaway: parsed.keyTakeaway || "Structure oral answers with definition, mechanism, and trade-off.",
      });
    } catch (err: any) {
      console.error("Error evaluating answer:", err);

      // Intelligent heuristic calculation based on actual answer substance
      const wordCount = trimmed.split(/\s+/).length;
      const lower = trimmed.toLowerCase();
      const hasHesitation = lower.includes("maybe") || lower.includes("i guess") || lower.includes("not sure") || lower.includes("probably") || lower.includes("idk") || lower.includes("don't know");

      let calculatedCorrectness = 45;
      let calculatedConfidence = 50;

      if (wordCount < 10) {
        calculatedCorrectness = 25;
        calculatedConfidence = 30;
      } else if (wordCount < 25) {
        calculatedCorrectness = 45;
        calculatedConfidence = 45;
      } else if (wordCount < 60) {
        calculatedCorrectness = 65;
        calculatedConfidence = 65;
      } else {
        calculatedCorrectness = 78;
        calculatedConfidence = 75;
      }

      if (hasHesitation) {
        calculatedConfidence = Math.max(20, calculatedConfidence - 25);
        calculatedCorrectness = Math.max(20, calculatedCorrectness - 10);
      }

      const calculatedScore = Math.max(1, Math.min(10, Math.round((calculatedCorrectness * 0.7 + calculatedConfidence * 0.3) / 10)));

      return res.status(200).json({
        correctnessScore: calculatedCorrectness,
        confidenceScore: calculatedConfidence,
        score: calculatedScore,
        verdict: calculatedCorrectness >= 70 ? "Good Foundational Answer" : calculatedCorrectness >= 45 ? "Partially Addressed" : "Needs Depth & Precision",
        feedback: `Your response provided ${wordCount} words. In an oral viva, examiners expect precise technical terminology, direct principles, and clear voice articulation without hedging.`,
        correctAspects: wordCount >= 15 ? ["Attempted core topic explanation directly"] : ["Recorded an answer"],
        missingOrIncorrect: ["Elaborate on underlying mechanisms and concrete edge cases"],
        keyTakeaway: "State the formal definition first, then explain the mechanism, and finish with a real example.",
      });
    }
  });

  // Helper for genuine letter/class grade
  function getGenuineGrade(score: number): string {
    if (score >= 85) return "Distinction (85-100%)";
    if (score >= 70) return "Pass with Merit (70-84%)";
    if (score >= 50) return "Pass (50-69%)";
    return "Needs Re-take / Fail (<50%)";
  }

  // Helper for readiness status
  function getReadinessLabel(readiness: number, isViva: boolean): string {
    if (readiness >= 85) return isViva ? "College Viva Ready (Distinction Tier)" : "Interview Ready (Strong Hire)";
    if (readiness >= 70) return isViva ? "College Viva Ready (Clear Pass)" : "Interview Ready (Hire Recommendation)";
    if (readiness >= 50) return isViva ? "Borderline — Vulnerable in University Viva" : "Borderline — Mixed Interview Feedback";
    return isViva ? "Not Ready — High Risk of Failing Viva" : "Not Interview Ready — Rejection Risk";
  }

  // Whole Session Comprehensive Evaluation (Strict Genuine Merit & Readiness %)
  app.post("/api/evaluate-session", async (req, res) => {
    const { mode, subMode, courseName, degreeProgram, targetRole, level, qaPairs, postureTips } = req.body;

    const totalQuestions = Array.isArray(qaPairs) && qaPairs.length > 0 ? qaPairs.length : 1;
    let sumCorrectness = 0;
    let sumConfidence = 0;
    let failedQuestionsCount = 0;

    (qaPairs || []).forEach((q: any) => {
      const c = typeof q.correctnessScore === "number" ? q.correctnessScore : (typeof q.score === "number" ? q.score * 10 : 50);
      const conf = typeof q.confidenceScore === "number" ? q.confidenceScore : (typeof q.score === "number" ? q.score * 10 : 50);
      sumCorrectness += c;
      sumConfidence += conf;
      if (c < 45) {
        failedQuestionsCount += 1;
      }
    });

    const calculatedCorrectness = Math.round(sumCorrectness / totalQuestions);
    const calculatedConfidence = Math.round(sumConfidence / totalQuestions);
    // Genuine merit percentage strictly weighted from candidate answers
    const calculatedMerit = Math.round(calculatedCorrectness * 0.7 + calculatedConfidence * 0.3);

    // Readiness penalty: In real viva / technical interviews, failing fundamental questions penalizes readiness heavily
    const readinessPenalty = failedQuestionsCount * 5;
    const calculatedReadiness = Math.max(5, Math.min(98, calculatedMerit - readinessPenalty));

    const isViva = mode === "viva";
    const targetLabel = isViva ? (degreeProgram || courseName || "College Degree Program") : (targetRole || "Technical Role");

    try {
      const prompt = `You are a strict, objective senior university viva voce examiner and industry hiring committee lead compiling the final assessment.
Assessment Mode: ${isViva ? "University College Viva Voce Examination" : "Professional Technical Job Interview"}
Target Degree / Academic Program / Role: ${targetLabel}
Subject/Course: ${courseName || "Candidate Syllabus / Resume"}
Level: ${level || subMode || "Standard"}

Candidate Answer Analysis from Active Session:
- Total Questions: ${totalQuestions}
- Questions with serious gaps (<45% correctness): ${failedQuestionsCount}
- Computed Average Technical Correctness: ${calculatedCorrectness}%
- Computed Average Oral Delivery & Confidence: ${calculatedConfidence}%
- Earned Genuine Merit Score: ${calculatedMerit}%
- Indicative Readiness Percentage: ${calculatedReadiness}%

Detailed Q&A Transcript:
${JSON.stringify(qaPairs, null, 2)}

Camera & Posture Tips Noted:
${JSON.stringify(postureTips || [], null, 2)}

CRITICAL GRADING DIRECTIVE:
1. NEVER output a standard 80% or 82%. Award the GENUINE, uninflated merit percentage earned by the candidate.
   - If the candidate provided weak, superficial, or incorrect answers, output the true low score (e.g. 25%, 38%, 52%).
   - If the candidate gave rigorous, accurate, deep answers, output the earned high score (e.g. 78%, 88%, 94%).
2. Compute "readinessPercentage" (integer 0-100):
   - For College Viva: The genuine percentage readiness to face external university professors and viva examiners for their degree without failing.
   - For Job Interview: The genuine percentage readiness to clear a real-world technical bar and receive a job offer.
3. Determine "readinessLabel":
   - 85-100%: "${isViva ? "College Viva Ready (Distinction Tier)" : "Interview Ready (Strong Hire)"}"
   - 70-84%: "${isViva ? "College Viva Ready (Clear Pass)" : "Interview Ready (Hire Recommendation)"}"
   - 50-69%: "${isViva ? "Borderline — Vulnerable in University Viva" : "Borderline — Mixed Interview Feedback"}"
   - <50%: "${isViva ? "Not Ready — High Risk of Failing Viva" : "Not Interview Ready — Rejection Risk"}"
4. Provide "readinessVerdictExplanation": 2-3 sentences explaining exactly what an external college viva professor or hiring manager would conclude about this candidate right now.

Return ONLY valid JSON in this exact structure:
{
  "overallScore": ${calculatedMerit}, // genuine merit percentage 0-100 strictly reflecting the candidate's answers
  "correctnessAverage": ${calculatedCorrectness}, // 0-100
  "confidenceAverage": ${calculatedConfidence}, // 0-100
  "readinessPercentage": ${calculatedReadiness}, // 0-100 genuine readiness for college viva or job interview
  "readinessLabel": "<one of the readiness labels above>",
  "readinessVerdictExplanation": "<2-3 sentences explaining their college viva or job readiness>",
  "grade": "<'Distinction (85-100%)', 'Pass with Merit (70-84%)', 'Pass (50-69%)', or 'Needs Re-take / Fail (<50%)'>",
  "executiveSummary": "<2-3 sentences summarizing the candidate's performance honestly>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<critical area for improvement 1>", "<critical area for improvement 2>"],
  "oralPresenceTips": "<1-2 sentences on delivery, posture, pacing, and eye contact>"
}`;

      const response = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = (response.text || "{}").replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      }

      // Validate scores to avoid arbitrary overrides
      const overallScore = typeof parsed.overallScore === "number" ? Math.max(5, Math.min(100, parsed.overallScore)) : calculatedMerit;
      const correctnessAverage = typeof parsed.correctnessAverage === "number" ? Math.max(0, Math.min(100, parsed.correctnessAverage)) : calculatedCorrectness;
      const confidenceAverage = typeof parsed.confidenceAverage === "number" ? Math.max(0, Math.min(100, parsed.confidenceAverage)) : calculatedConfidence;
      const readinessPercentage = typeof parsed.readinessPercentage === "number" ? Math.max(5, Math.min(99, parsed.readinessPercentage)) : calculatedReadiness;

      return res.status(200).json({
        overallScore,
        correctnessAverage,
        confidenceAverage,
        readinessPercentage,
        readinessLabel: parsed.readinessLabel || getReadinessLabel(readinessPercentage, isViva),
        readinessVerdictExplanation: parsed.readinessVerdictExplanation || (isViva
          ? `With a ${readinessPercentage}% viva readiness score, the candidate demonstrates ${readinessPercentage >= 70 ? "adequate preparation to pass external college examiners" : "vulnerabilities that could lead to low marks in university oral defense"}.`
          : `With a ${readinessPercentage}% interview readiness score, hiring teams would evaluate this candidate as ${readinessPercentage >= 70 ? "clearing the baseline bar" : "needing stronger technical depth before an offer"}.`),
        grade: parsed.grade || getGenuineGrade(overallScore),
        executiveSummary: parsed.executiveSummary || `The candidate achieved a genuine score of ${overallScore}% with ${correctnessAverage}% technical correctness and ${confidenceAverage}% oral confidence.`,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ["Direct answers to prompts", "Good composure during questioning"],
        improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0 ? parsed.improvements : ["Deepen architectural and mathematical trade-offs", "Reduce hesitation and state definitions first"],
        oralPresenceTips: parsed.oralPresenceTips || "Speak in a measured, calm tempo and maintain gaze forward toward the examiner.",
      });
    } catch (err: any) {
      console.error("Error evaluating session:", err);

      return res.status(200).json({
        overallScore: calculatedMerit,
        correctnessAverage: calculatedCorrectness,
        confidenceAverage: calculatedConfidence,
        readinessPercentage: calculatedReadiness,
        readinessLabel: getReadinessLabel(calculatedReadiness, isViva),
        readinessVerdictExplanation: isViva
          ? `Based on mathematical scoring across all ${totalQuestions} viva questions, you have a ${calculatedReadiness}% college viva readiness score for ${targetLabel}. ${calculatedReadiness >= 70 ? "You are on track to pass your external viva." : "External examiners will probe deeper on weak fundamentals; revision is strongly advised."}`
          : `Based on mathematical scoring across all ${totalQuestions} interview questions, you have a ${calculatedReadiness}% technical interview readiness score for ${targetLabel}. ${calculatedReadiness >= 70 ? "You meet the core competency threshold." : "Expect interviewers to press for deeper architectural understanding."}`,
        grade: getGenuineGrade(calculatedMerit),
        executiveSummary: `Evaluated across ${totalQuestions} questions with a genuine merit score of ${calculatedMerit}% (Technical Correctness: ${calculatedCorrectness}%, Oral Delivery: ${calculatedConfidence}%).`,
        strengths: [
          calculatedCorrectness >= 65 ? "Solid technical definitions" : "Good attempt across question set",
          calculatedConfidence >= 65 ? "Clear oral articulation and pace" : "Maintained focus under questioning",
        ],
        improvements: [
          "Provide deeper mechanical reasoning and concrete real-world constraints",
          "Structure answers with formal definition, inner mechanism, and practical trade-off",
        ],
        oralPresenceTips: "Speak with measured pacing, keep eye contact aligned with the camera, and pause 1 second before answering.",
      });
    }
  });

  return app;
}
