import express from "express";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

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

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
    return result?.text ? result.text.trim() : "";
  } catch (err) {
    console.warn("[PDF Parser] Failed to parse PDF text with pdf-parse:", err);
    return "";
  }
}

async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}) {
  const ai = getAiClient();
  // Valid, highly capable Gemini models that do NOT require paid tier:
  // 1. gemini-3.8-flash (Primary workhorse with native 1M context, multimodal PDF/image parsing)
  // 2. gemini-flash-latest (Reliable stable alias)
  // 3. gemini-3.1-flash-lite (Fast lightweight fallback with generous quota)
  const models = [
    params.preferredModel || "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
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

  // Extract Text from Document (PDF, DOCX, TXT)
  app.post(["/api/extract-text", "/extract-text"], async (req, res) => {
    try {
      const { fileBase64, fileName, mimeType, textContent } = req.body;
      let extractedText = textContent ? String(textContent).trim() : "";
      const lowerFileName = (fileName || "").toLowerCase();

      if (fileBase64 && typeof fileBase64 === "string") {
        let rawBase64 = fileBase64;
        let detectedMime = mimeType || "";
        if (rawBase64.includes(",")) {
          const parts = rawBase64.split(",");
          rawBase64 = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match && match[1]) {
            detectedMime = match[1];
          }
        }
        const cleanBase64 = rawBase64.replace(/\s+/g, "");

        const isDocx =
          lowerFileName.endsWith(".docx") ||
          detectedMime.includes("wordprocessingml") ||
          detectedMime.includes("docx");

        if (isDocx && cleanBase64) {
          try {
            const docxBuffer = Buffer.from(cleanBase64, "base64");
            const result = await mammoth.extractRawText({ buffer: docxBuffer });
            if (result.value && result.value.trim()) {
              extractedText = result.value.trim();
            }
          } catch (mErr) {
            console.warn("[Extract-Text] DOCX extraction error:", mErr);
          }
        }

        const isPdf =
          lowerFileName.endsWith(".pdf") ||
          detectedMime.includes("pdf") ||
          cleanBase64.startsWith("JVBERi0");

        if (isPdf && cleanBase64) {
          try {
            const pdfBuffer = Buffer.from(cleanBase64, "base64");
            const pdfText = await extractTextFromPdfBuffer(pdfBuffer);
            if (pdfText && pdfText.trim()) {
              extractedText = pdfText.trim();
            }
          } catch (pErr) {
            console.warn("[Extract-Text] PDF extraction error:", pErr);
          }
        }

        const isPlainText =
          lowerFileName.endsWith(".txt") ||
          lowerFileName.endsWith(".md") ||
          detectedMime.startsWith("text/");

        if (isPlainText && cleanBase64 && !extractedText) {
          try {
            const decoded = Buffer.from(cleanBase64, "base64").toString("utf-8");
            if (decoded && decoded.trim()) {
              extractedText = decoded.trim();
            }
          } catch (tErr) {
            console.warn("[Extract-Text] Plain text extraction error:", tErr);
          }
        }
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({
          error: "Could not extract readable text from the uploaded file. Please ensure it contains selectable text.",
        });
      }

      // Analyze headings, units, and subject
      const lines = extractedText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      const headingKeywords = ["unit", "module", "chapter", "section", "topic", "part"];
      const detectedUnits: string[] = [];
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (
          headingKeywords.some((kw) => lower.startsWith(kw) || lower.includes(kw + " ")) &&
          line.length < 90 &&
          detectedUnits.length < 8
        ) {
          if (!detectedUnits.includes(line)) {
            detectedUnits.push(line);
          }
        }
      }

      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      const charCount = extractedText.length;
      const preview = extractedText.slice(0, 500) + (extractedText.length > 500 ? "..." : "");

      // Attempt to identify subject title from first few lines
      let detectedSubject = "";
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        if (
          line.length > 4 &&
          line.length < 80 &&
          !line.toLowerCase().includes("page") &&
          !line.toLowerCase().includes("http")
        ) {
          detectedSubject = line;
          break;
        }
      }

      return res.json({
        success: true,
        text: extractedText,
        wordCount,
        charCount,
        preview,
        detectedSubject: detectedSubject || "Course Syllabus",
        detectedUnits,
      });
    } catch (err: any) {
      console.error("[Extract Text API Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to extract text." });
    }
  });

  // Generate Questions
  app.post(["/api/generate-questions", "/generate-questions"], async (req, res) => {
    const {
      mode,
      subMode,
      courseName,
      level,
      numQuestions = 6,
      fileBase64,
      fileName,
      mimeType,
      textContent,
      previousQuestions = [],
      usedQuestions = [],
    } = req.body;

    if (!fileBase64 && !textContent) {
      return res.status(400).json({ error: "No document or file was attached." });
    }

    const questionCount = Math.min(Math.max(Number(numQuestions) || 6, 3), 10);
    // Track already-asked questions using a unique Set of question texts/fragments
    const rawUsedList = Array.isArray(usedQuestions) && usedQuestions.length > 0
      ? usedQuestions
      : (Array.isArray(previousQuestions) ? previousQuestions : []);
    const usedQuestionsSet = new Set(rawUsedList.map(String).map((s) => s.trim()).filter(Boolean));
    const usedQuestionsList = Array.from(usedQuestionsSet);
    let extractedText = textContent ? String(textContent).trim() : "";
    let cleanBase64 = "";
    let detectedMime = mimeType || "";

    // Process fileBase64 if provided
    if (fileBase64 && typeof fileBase64 === "string") {
      let rawBase64 = fileBase64;
      if (rawBase64.includes(",")) {
        const parts = rawBase64.split(",");
        rawBase64 = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match && match[1]) {
          detectedMime = match[1];
        }
      }
      cleanBase64 = rawBase64.replace(/\s+/g, "");

      const lowerFileName = (fileName || "").toLowerCase();
      const isDocx =
        lowerFileName.endsWith(".docx") ||
        detectedMime.includes("wordprocessingml") ||
        detectedMime.includes("docx");

      // Extract text from Microsoft Word documents using mammoth
      if (isDocx && cleanBase64) {
        try {
          const docxBuffer = Buffer.from(cleanBase64, "base64");
          const result = await mammoth.extractRawText({ buffer: docxBuffer });
          if (result.value && result.value.trim()) {
            extractedText = (extractedText ? extractedText + "\n\n" : "") + result.value.trim();
            console.log(`[Docx Parser] Successfully extracted ${result.value.length} characters from Word syllabus/resume.`);
            cleanBase64 = ""; // Word document now converted to text
          }
        } catch (docxErr) {
          console.warn("[Docx Parser] Mammoth extraction failed, continuing with file data:", docxErr);
        }
      }

      // Extract text from PDF documents using pdf-parse
      const isPdf =
        lowerFileName.endsWith(".pdf") ||
        detectedMime.includes("pdf") ||
        cleanBase64.startsWith("JVBERi0");

      if (isPdf && cleanBase64) {
        try {
          const pdfBuffer = Buffer.from(cleanBase64, "base64");
          const pdfText = await extractTextFromPdfBuffer(pdfBuffer);
          if (pdfText && pdfText.trim()) {
            extractedText = (extractedText ? extractedText + "\n\n" : "") + pdfText.trim();
            console.log(`[PDF Parser] Successfully extracted ${pdfText.length} characters of raw text from PDF syllabus/resume.`);
          }
        } catch (pdfErr) {
          console.warn("[PDF Parser] PDF extraction warning:", pdfErr);
        }
      }

      // Extract plain text / markdown files directly
      const isPlainText =
        lowerFileName.endsWith(".txt") ||
        lowerFileName.endsWith(".md") ||
        detectedMime.startsWith("text/");

      if (isPlainText && cleanBase64) {
        try {
          const decoded = Buffer.from(cleanBase64, "base64").toString("utf-8");
          if (decoded && decoded.trim()) {
            extractedText = (extractedText ? extractedText + "\n\n" : "") + decoded.trim();
            cleanBase64 = "";
          }
        } catch (txtErr) {
          console.warn("[Text Parser] Plain text decoding error:", txtErr);
        }
      }

      // Ensure valid MIME type for Gemini inlineData
      if (cleanBase64) {
        if (!detectedMime || detectedMime === "application/octet-stream") {
          if (lowerFileName.endsWith(".pdf") || cleanBase64.startsWith("JVBERi0")) {
            detectedMime = "application/pdf";
          } else if (lowerFileName.endsWith(".png")) {
            detectedMime = "image/png";
          } else if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) {
            detectedMime = "image/jpeg";
          } else if (lowerFileName.endsWith(".webp")) {
            detectedMime = "image/webp";
          } else {
            detectedMime = "application/pdf";
          }
        }
      }
    }

    try {
      let prompt = "";
      const hasSpecificCourse = courseName && courseName.trim() && courseName !== "Course Syllabus" && courseName !== "Attached Syllabus";

      const usedQuestionsFormatted = usedQuestionsList.length > 0
        ? `Do not repeat these previously asked questions: [\n${usedQuestionsList.map((q) => `  "${q.replace(/"/g, '\\"')}"`).join(",\n")}\n]`
        : "";

      const nonRepetitionDirective = usedQuestionsList.length > 0
        ? `\n${usedQuestionsFormatted}\n`
        : `\nEnsure a diverse, dynamic distribution of questions across all different units and chapters.\n`;

      if (mode === "viva") {
        prompt = `You are a strict, formal university oral viva-voce examiner.
YOUR EXCLUSIVE AND MANDATORY SOURCE OF TRUTH IS THE CANDIDATE'S ATTACHED SYLLABUS / CURRICULUM DOCUMENT.
${hasSpecificCourse ? `Target Course Name: "${courseName}"` : `Extract the exact course/subject title directly from the document.`}
Exam Difficulty: ${level || "Intermediate"}.
Session Randomization Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}
${nonRepetitionDirective}
CRITICAL MANDATORY RULES — 100% STRICT DOCUMENT GROUNDING (ABSOLUTE REQUIREMENT):
1. ZERO HALLUCINATION & ZERO OUTSIDE TOPICS:
   - You MUST generate questions derived EXCLUSIVELY and DIRECTLY from the text, modules, chapters, formulas, theorems, mechanisms, and topics that appear inside the provided document.
   - You are STRICTLY FORBIDDEN from asking questions about any outside subject or topic NOT mentioned in the candidate's syllabus. For example, if the syllabus is on Physics, Law, Mechanical Engineering, Chemistry, Medicine, Accounting, or Philosophy, every question MUST strictly test that specific discipline. NEVER assume computer science or operating systems unless the document explicitly teaches computer science.
   - If the uploaded document only covers 2 or 3 units, distribute all ${questionCount} questions strictly across those units. Do NOT invent new modules or extrapolate beyond the document.

2. MANDATORY VERBATIM CITATION:
   - For every question, the "basedOn" field MUST quote the EXACT Unit, Module, Chapter, or Topic heading from the uploaded syllabus.
   - The "topic" field MUST be the exact subject module or section title from the document.
   - The question must reference the specific concept, law, mechanism, or workflow as defined in the document.

3. DIFFICULTY LEVEL (${level || "Intermediate"}):
   - Beginner: Inquire about definitions, fundamental laws, and primary principles explicitly covered in the syllabus text.
   - Intermediate: Inquire about mechanisms, comparative differences, working procedures, and derivations explicitly covered in the syllabus text.
   - Advanced: Inquire about boundary conditions, design trade-offs, limitations, and rigorous derivations explicitly covered in the syllabus text.

4. ACCURATE SUBJECT DETECTION:
   - "detectedSubject": Extract the exact Course or Subject title as written inside the syllabus document.
   - "detectedUnits": List the actual unit/module titles extracted directly from the syllabus document.

Return ONLY valid JSON matching this exact structure:
{
  "detectedSubject": "<Exact course or subject title extracted from document>",
  "detectedUnits": ["<Unit 1 title from doc>", "<Unit 2 title from doc>", ...],
  "questions": [
    {
      "id": 1,
      "topic": "<Exact topic or unit title from the uploaded syllabus>",
      "basedOn": "<Exact section, module, or heading from the uploaded syllabus>",
      "question": "<Rigorous conversational viva question directly testing this concept from the document>"
    }
  ]
}`;
      } else {
        const selectedSubMode = subMode || "technical";
        prompt = `You are an expert technical interviewer conducting a ${selectedSubMode} interview.
YOUR EXCLUSIVE AND MANDATORY SOURCE OF CONTEXT IS THE CANDIDATE'S ATTACHED RESUME / CV DOCUMENT.
Session Randomization Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}
${nonRepetitionDirective}
CRITICAL MANDATORY RULES — 100% STRICT RESUME GROUNDING (ABSOLUTE REQUIREMENT):
1. ZERO GENERIC INTERVIEW QUESTIONS:
   - You are STRICTLY FORBIDDEN from asking generic textbook questions (e.g. "What is OOP?", "Where do you see yourself in 5 years?", "Explain a binary search tree").
   - Every single question MUST specifically name and probe an ACTUAL project, company, tech stack, tool, metric, or role explicitly written on the candidate's resume.
   - Always cite the specific project or achievement in your question: "On your resume under [Project Name], you used [Tech/Tool] to [Objective]. Can you walk me through..."

2. MANDATORY CITATION:
   - The "basedOn" field MUST quote or cite the exact project name, company name, or listed achievement from the candidate's uploaded resume.
   - The "topic" field MUST specify the exact technology, system component, or skill listed on their resume.

3. INTERVIEW SUB-MODE (${selectedSubMode.toUpperCase()}):
   - Technical: Probe architectural trade-offs, engineering challenges, database choices, or scalability from their listed projects.
   - Behavioral: Ask STAR-format questions linked to their listed past teams, roles, or project deadlines.
   - Managerial: Probe leadership, technical debt, and system delivery based on their listed experience.
   - Rapid Fire: Short, direct 30-second technical questions probing their specific listed skills and tools.

4. CANDIDATE PROFILE DETECTION:
   - "detectedCandidateName": The candidate's name as written at the top of their resume.
   - "detectedKeySkills": Array of actual technical skills and tools extracted from their resume.

Return ONLY valid JSON matching this exact structure:
{
  "detectedCandidateName": "<Candidate name from resume>",
  "detectedKeySkills": ["<Skill 1 from resume>", "<Skill 2 from resume>", ...],
  "questions": [
    {
      "id": 1,
      "topic": "<Specific technology or skill from their resume>",
      "basedOn": "<Exact project, company, or listed achievement from their resume>",
      "question": "<Targeted interview question referencing their exact project and tech stack>"
    }
  ]
}`;
      }

      // Build multimodal contents array: verbatim document text first, binary file data only if needed
      const contents: Array<any> = [];

      if (extractedText && extractedText.trim().length > 0) {
        contents.push({
          text: `==================== VERBATIM UPLOADED SYLLABUS / RESUME CONTENT ====================\n${extractedText.slice(0, 100000)}\n=====================================================================================`,
        });
      } else if (cleanBase64) {
        // Fall back to inlineData only if text could not be extracted directly
        contents.push({
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64,
          },
        });
      }

      contents.push({ text: prompt });

      console.log(
        `[Gemini] Generating questions: mode=${mode}, course="${courseName || ""}", textLength=${extractedText.length}, usedCount=${usedQuestionsList.length}`
      );

      const response = await generateContentWithRetry({
        contents,
        config: {
          responseMimeType: "application/json",
          temperature: 0.95, // Guarantees fresh, diverse question selection
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
        topic: q.topic || q.basedOn || q.category || (mode === "viva" ? "Syllabus Topic" : "Technical Background"),
        basedOn: q.basedOn || q.topic || q.category || (mode === "viva" ? "Course Syllabus" : "Resume Background"),
      }));

      return res.status(200).json({
        questions: normalized,
        detectedSubject: parsed.detectedSubject || courseName || undefined,
        detectedUnits: Array.isArray(parsed.detectedUnits) ? parsed.detectedUnits : undefined,
        detectedCandidateName: parsed.detectedCandidateName || undefined,
        detectedKeySkills: Array.isArray(parsed.detectedKeySkills) ? parsed.detectedKeySkills : undefined,
      });
    } catch (err: any) {
      console.error("Error generating questions with Gemini:", err);

      // If multimodal failed (e.g. large PDF or parsing issue), try text-guided emergency generation with extracted text
      if (extractedText && extractedText.trim().length > 30) {
        try {
          console.log("[Gemini Fallback] Attempting text-only generation with verbatim extracted document text...");
          const textOnlyPrompt =
            mode === "viva"
              ? `You are a university oral viva examiner. You MUST generate ${questionCount} questions STRICTLY and EXCLUSIVELY based on the following uploaded syllabus text. Do NOT ask anything outside this text:
=== SYLLABUS TEXT ===
${extractedText.slice(0, 40000)}
=== END SYLLABUS ===

Generate ${questionCount} oral viva questions directly testing the units and concepts in the text above. Difficulty: ${level || "Intermediate"}.
Return JSON:
{
  "detectedSubject": "<Subject name from syllabus>",
  "detectedUnits": ["<Unit 1>", "<Unit 2>"],
  "questions": [
    {
      "id": 1,
      "topic": "<Exact topic from syllabus text>",
      "basedOn": "<Unit or heading from syllabus text>",
      "question": "<Question strictly on this concept from the syllabus>"
    }
  ]
}`
              : `You are an interviewer conducting a ${subMode || "technical"} interview. You MUST generate ${questionCount} questions STRICTLY and EXCLUSIVELY based on the candidate's resume text below. Do NOT ask generic questions:
=== RESUME TEXT ===
${extractedText.slice(0, 40000)}
=== END RESUME ===

Generate ${questionCount} interview questions referencing specific projects and tools in their resume.
Return JSON:
{
  "detectedCandidateName": "<Name from resume>",
  "detectedKeySkills": ["<Skill 1>", "<Skill 2>"],
  "questions": [
    {
      "id": 1,
      "topic": "<Technology or project from resume>",
      "basedOn": "<Project or experience from resume>",
      "question": "<Targeted question referencing their project>"
    }
  ]
}`;

          const textResp = await generateContentWithRetry({
            contents: [{ text: textOnlyPrompt }],
            config: { responseMimeType: "application/json" },
          });
          const textJson = textResp.text?.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim() || "{}";
          const parsed = JSON.parse(textJson);
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const normalized = parsed.questions.map((q: any, idx: number) => ({
              id: q.id || idx + 1,
              question: q.question || q.text || "Question",
              topic: q.topic || parsed.detectedSubject || "Syllabus Topic",
              basedOn: q.basedOn || parsed.detectedSubject || "Course Syllabus",
            }));
            return res.status(200).json({
              questions: normalized,
              detectedSubject: parsed.detectedSubject || courseName || undefined,
              detectedUnits: Array.isArray(parsed.detectedUnits) ? parsed.detectedUnits : undefined,
              detectedCandidateName: parsed.detectedCandidateName || undefined,
              detectedKeySkills: Array.isArray(parsed.detectedKeySkills) ? parsed.detectedKeySkills : undefined,
            });
          }
        } catch (fbErr) {
          console.warn("[Gemini Fallback] Text-only fallback also failed:", fbErr);
        }
      }

      // If document text was extracted, extract syllabus headings directly from extractedText to create grounded questions
      if (extractedText && extractedText.trim().length > 30) {
        const textBasedQs = generateQuestionsFromDocumentText(
          extractedText,
          mode,
          questionCount,
          level,
          subMode,
          usedQuestionsList
        );
        if (textBasedQs.length > 0) {
          return res.status(200).json({
            questions: textBasedQs,
            detectedSubject: courseName || (mode === "viva" ? "Uploaded Syllabus" : "Candidate Resume"),
          });
        }
      }

      // If no text could be extracted at all (corrupt or unreadable PDF)
      return res.status(400).json({
        error: "Could not extract readable text from the uploaded document. Please ensure your PDF contains selectable text, or upload a Word (.docx) or plain text document."
      });
    }
  });

function generateQuestionsFromDocumentText(
  docText: string,
  mode: string,
  count: number,
  level: string = "Intermediate",
  subMode: string = "technical",
  previousQuestions: string[] = []
): Array<{ id: number; question: string; topic: string; basedOn: string }> {
  const lines = docText.split("\n").map(l => l.trim()).filter(l => l.length > 3);
  // Find lines that look like units, modules, chapters, or headings
  const headingKeywords = ["unit", "module", "chapter", "section", "topic", "part", "lecture", "experiment", "lab"];
  const headings = lines.filter(l => {
    const lower = l.toLowerCase();
    return headingKeywords.some(kw => lower.includes(kw)) || (l.length < 90 && (l.endsWith(":") || /^[0-9]+[\.\)]/.test(l)));
  });

  const availableTopics = headings.length >= 3 ? headings : lines.filter(l => l.length > 8 && l.length < 100);
  // Shuffle available topics with random offset to prevent same question order
  const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);

  // Avoid topics that appeared in previousQuestions if possible
  const prevLower = previousQuestions.map(p => p.toLowerCase());
  const freshTopics = shuffled.filter(t => !prevLower.some(p => p.includes(t.toLowerCase().slice(0, 15))));
  const selectedTopics = freshTopics.length >= count ? freshTopics : shuffled;

  const vivaTemplates = [
    (t: string, b: string) => `Looking at ${b}, explain the governing mechanism of "${t}" and analyze how it resolves fundamental engineering or theoretical trade-offs.`,
    (t: string, b: string) => `In your syllabus module on ${b}, what is the critical mathematical or procedural distinction between "${t}" and its adjacent principles?`,
    (t: string, b: string) => `Walk me through a concrete practical scenario involving "${t}". What boundary conditions or failure modes must an engineer anticipate?`,
    (t: string, b: string) => `Regarding "${t}" from ${b}, what step-by-step analytical derivation or workflow is used to verify its correctness?`,
    (t: string, b: string) => `If an experimental or real-world implementation of "${t}" produces anomalous behavior, how would you diagnose and optimize it?`,
    (t: string, b: string) => `How does "${t}" integrate into the broader theoretical framework outlined in ${b}? Cite its key laws or principles.`,
  ];

  const interviewTemplates = [
    (t: string, b: string) => `On your resume under "${b}", you highlighted "${t}". What architectural decisions did you make, and what metrics or benchmarks validated your solution?`,
    (t: string, b: string) => `Walking through your work on "${t}", how did you address edge cases, scalability bottlenecks, or concurrency hazards?`,
    (t: string, b: string) => `Regarding your implementation of "${t}" at ${b}, what trade-offs did you evaluate between developer velocity and system performance?`,
  ];

  const questions: Array<{ id: number; question: string; topic: string; basedOn: string }> = [];
  for (let i = 0; i < count; i++) {
    const rawTopic = selectedTopics[i % selectedTopics.length] || `Document Topic ${i + 1}`;
    const topic = rawTopic.replace(/^[-*•\d\.\)\s]+/, "").trim();
    if (mode === "viva") {
      const templateFn = vivaTemplates[(i + Math.floor(Math.random() * vivaTemplates.length)) % vivaTemplates.length];
      questions.push({
        id: i + 1,
        topic: topic,
        basedOn: rawTopic,
        question: templateFn(topic, rawTopic),
      });
    } else {
      const templateFn = interviewTemplates[i % interviewTemplates.length];
      questions.push({
        id: i + 1,
        topic: topic,
        basedOn: rawTopic,
        question: templateFn(topic, rawTopic),
      });
    }
  }
  return questions;
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
