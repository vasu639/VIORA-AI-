import { SessionReport } from "../types";

export interface UserReportInfo {
  displayName?: string | null;
  email?: string | null;
}

/**
 * Trigger download of any text/blob in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculate improvement metrics across an array of sessions
 */
export function calculateImprovementMetrics(sessions: SessionReport[]) {
  if (sessions.length === 0) {
    return {
      count: 0,
      initialScore: 0,
      latestScore: 0,
      scoreDelta: 0,
      avgScore: 0,
      avgCorrectness: 0,
      avgConfidence: 0,
      avgReadiness: 0,
      totalQuestions: 0,
      readinessStatus: "No Data",
      strengths: [] as string[],
      improvements: [] as string[],
      coachingTips: [] as string[],
    };
  }

  // Sort chronological (oldest first for trajectory)
  const chronological = [...sessions].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const count = chronological.length;
  const initialSession = chronological[0];
  const latestSession = chronological[count - 1];

  const initialScore = initialSession.overallScore ?? 70;
  const latestScore = latestSession.overallScore ?? 70;
  const scoreDelta = latestScore - initialScore;

  const totalScore = sessions.reduce((sum, s) => sum + (s.overallScore ?? 70), 0);
  const totalCorrectness = sessions.reduce((sum, s) => sum + (s.correctnessAverage ?? s.overallScore ?? 70), 0);
  const totalConfidence = sessions.reduce((sum, s) => sum + (s.confidenceAverage ?? s.overallScore ?? 70), 0);
  const totalReadiness = sessions.reduce((sum, s) => sum + (s.readinessPercentage ?? s.overallScore ?? 70), 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.answers?.length || 0), 0);

  const avgScore = Math.round(totalScore / count);
  const avgCorrectness = Math.round(totalCorrectness / count);
  const avgConfidence = Math.round(totalConfidence / count);
  const avgReadiness = Math.round(totalReadiness / count);

  // Consolidate unique strengths and improvements
  const strengthSet = new Set<string>();
  const improvementSet = new Set<string>();
  const postureSet = new Set<string>();

  sessions.forEach((s) => {
    (s.strengths || []).forEach((st) => strengthSet.add(st));
    (s.improvements || []).forEach((im) => improvementSet.add(im));
    (s.postureTips || []).forEach((pt) => postureSet.add(pt));
    if (s.oralPresenceTips) postureSet.add(s.oralPresenceTips);
  });

  let readinessStatus = "Developing (Needs Practice)";
  if (avgReadiness >= 85) readinessStatus = "Exam & Interview Ready (High Distinction)";
  else if (avgReadiness >= 70) readinessStatus = "Competent & Defensible";
  else if (avgReadiness >= 55) readinessStatus = "Borderline - Revision Recommended";

  return {
    count,
    initialScore,
    latestScore,
    scoreDelta,
    avgScore,
    avgCorrectness,
    avgConfidence,
    avgReadiness,
    totalQuestions,
    readinessStatus,
    strengths: Array.from(strengthSet).slice(0, 8),
    improvements: Array.from(improvementSet).slice(0, 8),
    coachingTips: Array.from(postureSet).slice(0, 6),
  };
}

/**
 * Generates an executive Markdown report for historical improvement
 */
export function generateImprovementMarkdown(sessions: SessionReport[], user?: UserReportInfo | null): string {
  const metrics = calculateImprovementMetrics(sessions);
  const candidateName = user?.displayName || user?.email?.split("@")[0] || "Candidate";
  const candidateEmail = user?.email || "N/A";
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [
    `# VIORA AI — CANDIDATE IMPROVEMENT & PROGRESS AUDIT REPORT`,
    `Generated on: ${dateStr}`,
    `Platform: Viora AI Oral Examination & Mock Interview Practice`,
    ``,
    `## 1. CANDIDATE PROFILE`,
    `- **Candidate Name:** ${candidateName}`,
    `- **Registered Email:** ${candidateEmail}`,
    `- **Total Practice Sessions:** ${metrics.count}`,
    `- **Total Questions Answered:** ${metrics.totalQuestions}`,
    `- **Overall Readiness Rating:** ${metrics.avgReadiness}% (${metrics.readinessStatus})`,
    ``,
    `## 2. PERFORMANCE & GROWTH TRAJECTORY`,
    `| Metric | Baseline (Initial) | Current (Latest) | Net Change | All-Time Average |`,
    `| :--- | :---: | :---: | :---: | :---: |`,
    `| Overall Merit Score | ${metrics.initialScore}% | ${metrics.latestScore}% | ${metrics.scoreDelta >= 0 ? `+${metrics.scoreDelta}%` : `${metrics.scoreDelta}%`} | ${metrics.avgScore}% |`,
    `| Technical Accuracy | — | — | — | ${metrics.avgCorrectness}% |`,
    `| Oral Delivery & Confidence | — | — | — | ${metrics.avgConfidence}% |`,
    `| Target Readiness Index | — | — | — | ${metrics.avgReadiness}% |`,
    ``,
    `## 3. CORE STRENGTHS MASTERED`,
    ...(metrics.strengths.length > 0
      ? metrics.strengths.map((s, idx) => `${idx + 1}. **${s}**`)
      : [`*Complete more viva/interview sessions to populate verified strengths.*`]),
    ``,
    `## 4. CRITICAL REVISION & IMPROVEMENT AREAS`,
    ...(metrics.improvements.length > 0
      ? metrics.improvements.map((i, idx) => `${idx + 1}. **${i}**`)
      : [`*No major deficiencies flagged in completed sessions.*`]),
    ``,
    `## 5. ORAL PRESENCE & NON-VERBAL COACHING`,
    ...(metrics.coachingTips.length > 0
      ? metrics.coachingTips.map((t) => `- ${t}`)
      : [`- Maintain upright posture, direct gaze with the camera lens, and speak in structured bullet points.`]),
    ``,
    `## 6. HISTORICAL SESSION AUDIT TRAIL`,
    `| # | Date | Mode | Program / Target Role | Score | Readiness | Grade |`,
    `| :-: | :--- | :--- | :--- | :-: | :-: | :-: |`,
    ...sessions.map((s, i) => {
      const date = new Date(s.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const mode = s.mode === "viva" ? "Viva Voce" : `Interview (${s.subMode || "Tech"})`;
      const target = s.meta.degreeProgram || s.meta.targetRole || s.meta.courseName || "General";
      return `| ${i + 1} | ${date} | ${mode} | ${target} | ${s.overallScore}% | ${s.readinessPercentage || s.overallScore}% | ${s.grade || "Merit"} |`;
    }),
    ``,
    `---`,
    `*Report generated autonomously by Viora AI. Grounded in candidate syllabus and resume submissions.*`,
  ];

  return lines.join("\n");
}

/**
 * Generates an executive Markdown report for a single session
 */
export function generateSessionMarkdown(session: SessionReport, user?: UserReportInfo | null): string {
  const candidateName = user?.displayName || user?.email?.split("@")[0] || "Candidate";
  const candidateEmail = user?.email || "N/A";
  const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isViva = session.mode === "viva";
  const target = isViva
    ? session.meta.degreeProgram || session.meta.courseName || "College Viva Voce"
    : session.meta.targetRole || "Technical Job Interview";

  const lines: string[] = [
    `# VIORA AI — ${isViva ? "COLLEGE VIVA VOCE" : "JOB INTERVIEW"} ASSESSMENT REPORT`,
    `Session Date: ${dateStr}`,
    `Session ID: ${session.id}`,
    ``,
    `## 1. ASSESSMENT SUMMARY`,
    `- **Candidate Name:** ${candidateName}`,
    `- **Registered Email:** ${candidateEmail}`,
    `- **Mode:** ${isViva ? "Viva Voce Oral Defense" : `Interview (${session.subMode || "Technical"})`}`,
    `- **Target / Program:** ${target}`,
    `- **Difficulty Level:** ${session.meta.level || "Standard"}`,
    `- **Grounded Document:** ${session.meta.fileName || "Uploaded Document"}`,
    ``,
    `## 2. EVALUATION METRICS`,
    `- **Overall Merit Score:** ${session.overallScore}% (${session.grade})`,
    `- **Readiness Level:** ${session.readinessPercentage}% [${session.readinessLabel}]`,
    `- **Technical Correctness Average:** ${session.correctnessAverage}%`,
    `- **Oral Confidence & Delivery Average:** ${session.confidenceAverage}%`,
    ``,
    `### READINESS VERDICT`,
    session.readinessVerdictExplanation || "Evaluation completed based on response depth and accuracy.",
    ``,
    `### EXECUTIVE APPRAISAL`,
    session.executiveSummary || "Demonstrated subject grasp.",
    ``,
    `## 3. IDENTIFIED STRENGTHS`,
    ...(session.strengths || []).map((s) => `- ${s}`),
    ``,
    `## 4. PRIORITY REVISION AREAS`,
    ...(session.improvements || []).map((i) => `- ${i}`),
    ``,
    `## 5. QUESTION-BY-QUESTION AUDIT`,
    ...session.answers.map((a, idx) => {
      const parts = [
        `### Question ${idx + 1}: ${a.questionText}`,
        `**Topic / Grounding:** ${a.topicOrGrounding || "Core Subject"}`,
        `**Candidate Response:** "${a.answerText || "No answer recorded."}"`,
        `**Score:** ${a.score || 0}/10 | **Correctness:** ${a.correctnessScore ?? "N/A"}% | **Confidence:** ${a.confidenceScore ?? "N/A"}%`,
        `**Verdict:** ${a.verdict || "Evaluated"}`,
      ];

      if (a.feedback) {
        parts.push(`**Examiner Feedback:** ${a.feedback}`);
      }
      if (a.correctAspects && a.correctAspects.length > 0) {
        parts.push(`**Accurate Aspects:**\n${a.correctAspects.map((c) => `  - ${c}`).join("\n")}`);
      }
      if (a.missingOrIncorrect && a.missingOrIncorrect.length > 0) {
        parts.push(`**Missing / Incorrect Aspects:**\n${a.missingOrIncorrect.map((m) => `  - ${m}`).join("\n")}`);
      }
      if (a.keyTakeaway) {
        parts.push(`**Takeaway Tip:** ${a.keyTakeaway}`);
      }
      parts.push(``);
      return parts.join("\n");
    }),
    `---`,
    `*Generated by Viora AI. Confidential performance record.*`,
  ];

  return lines.join("\n");
}

/**
 * Generates a self-contained, standalone, beautifully styled HTML document
 * that can be opened in any web browser, saved offline, or printed directly to PDF.
 */
export function generateImprovementHTML(sessions: SessionReport[], user?: UserReportInfo | null): string {
  const metrics = calculateImprovementMetrics(sessions);
  const candidateName = user?.displayName || user?.email?.split("@")[0] || "Candidate";
  const candidateEmail = user?.email || "Candidate Record";
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deltaFormatted = metrics.scoreDelta >= 0 ? `+${metrics.scoreDelta}%` : `${metrics.scoreDelta}%`;
  const deltaColor = metrics.scoreDelta >= 0 ? "#059669" : "#dc2626";

  const rows = sessions
    .map((s, idx) => {
      const date = new Date(s.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const mode = s.mode === "viva" ? "Viva Voce" : `Interview (${s.subMode || "Tech"})`;
      const target = s.meta.degreeProgram || s.meta.targetRole || s.meta.courseName || "General";
      return `
      <tr>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-weight:600; color:#475569;">${idx + 1}</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#1e293b;">${date}</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-weight:600; color:#0b1a33;">${mode}</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#475569;">${target}</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-weight:800; color:#0b1a33; text-align:center;">${s.overallScore}%</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#2563eb; text-align:center;">${s.readinessPercentage || s.overallScore}%</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#059669; font-weight:600; text-align:center;">${s.grade || "Merit"}</td>
      </tr>`;
    })
    .join("");

  const strengthsList = metrics.strengths
    .map(
      (s) =>
        `<li style="margin-bottom:6px; color:#1e293b;"><strong style="color:#059669;">✓</strong> ${s}</li>`
    )
    .join("");

  const improvementsList = metrics.improvements
    .map(
      (i) =>
        `<li style="margin-bottom:6px; color:#1e293b;"><strong style="color:#e11d48;">→</strong> ${i}</li>`
    )
    .join("");

  const coachingList = metrics.coachingTips
    .map(
      (c) =>
        `<li style="margin-bottom:6px; color:#475569;">• ${c}</li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Viora AI — Candidate Improvement Report (${candidateName})</title>
  <style>
    @page { margin: 15mm; size: A4; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 880px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0b1a33;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0b1a33;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #0b1a33;
      margin: 8px 0 4px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .meta-box strong { color: #0f172a; }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .metric-val {
      font-size: 26px;
      font-weight: 900;
      color: #0b1a33;
      margin-top: 4px;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #0b1a33;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 24px 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
    }
    .box-title {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 10px;
    }
    .box-green { background: #f0fdf4; border-color: #bbf7d0; }
    .box-green .box-title { color: #166534; }
    .box-rose { background: #fff1f2; border-color: #fecdd3; }
    .box-rose .box-title { color: #9f1239; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 8px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 10px 14px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .print-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: right; margin-bottom: 12px;">
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="logo-badge">VIORA AI</div>
        <h1 class="title">Candidate Improvement & Growth Audit</h1>
        <p class="subtitle">Comprehensive oral examination & mock interview progression record</p>
      </div>
      <div class="meta-box">
        <div>Candidate: <strong>${candidateName}</strong></div>
        <div>Email: <strong>${candidateEmail}</strong></div>
        <div>Date of Audit: <strong>${dateStr}</strong></div>
        <div>Total Sessions: <strong>${metrics.count}</strong></div>
      </div>
    </div>

    <!-- Core Highlights Metric Grid -->
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Initial vs Latest</div>
        <div class="metric-val">${metrics.initialScore}% → ${metrics.latestScore}%</div>
        <div style="font-size:11px; font-weight:700; color:${deltaColor}; margin-top:2px;">${deltaFormatted} Net Change</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">All-Time Average</div>
        <div class="metric-val">${metrics.avgScore}%</div>
        <div style="font-size:11px; color:#64748b; margin-top:2px;">Across all attempts</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Technical Accuracy</div>
        <div class="metric-val">${metrics.avgCorrectness}%</div>
        <div style="font-size:11px; color:#059669; margin-top:2px;">Factual precision</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Readiness Index</div>
        <div class="metric-val" style="color:#2563eb;">${metrics.avgReadiness}%</div>
        <div style="font-size:10px; font-weight:700; color:#2563eb; margin-top:2px;">${metrics.readinessStatus}</div>
      </div>
    </div>

    <!-- Strengths & Priority Areas Grid -->
    <div class="card-grid">
      <div class="box box-green">
        <div class="box-title">VERIFIED CORE STRENGTHS</div>
        <ul style="padding-left:18px; margin:0; font-size:12px;">
          ${strengthsList || "<li>Initial sessions recorded. Complete additional attempts to build competency mapping.</li>"}
        </ul>
      </div>

      <div class="box box-rose">
        <div class="box-title">CRITICAL AREAS FOR REVISION</div>
        <ul style="padding-left:18px; margin:0; font-size:12px;">
          ${improvementsList || "<li>No recurring blind spots flagged in recent evaluations.</li>"}
        </ul>
      </div>
    </div>

    <!-- Posture & Presence Coaching -->
    <div class="box" style="background:#f8fafc; margin-bottom:24px;">
      <div class="box-title" style="color:#0b1a33;">ORAL DELIVERY & NON-VERBAL COACHING SUMMARY</div>
      <ul style="padding-left:18px; margin:0; font-size:12px;">
        ${coachingList || "<li>Maintain steady eye contact with the camera and avoid trailing vocal inflections.</li>"}
      </ul>
    </div>

    <!-- Session History Ledger -->
    <div class="section-title">HISTORICAL PRACTICE ATTEMPTS LEDGER</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Assessment Mode</th>
          <th>Curriculum / Target</th>
          <th style="text-align:center;">Score</th>
          <th style="text-align:center;">Readiness</th>
          <th style="text-align:center;">Verdict</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      <div>Viora AI Oral Examination & Placement Practice Platform</div>
      <div>Confidential Candidate Growth Audit Record • Powered by Multimodal AI</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates standalone HTML report for a single session
 */
export function generateSessionHTML(session: SessionReport, user?: UserReportInfo | null): string {
  const candidateName = user?.displayName || user?.email?.split("@")[0] || "Candidate";
  const candidateEmail = user?.email || "Candidate Record";
  const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isViva = session.mode === "viva";
  const target = isViva
    ? session.meta.degreeProgram || session.meta.courseName || "College Viva Voce"
    : session.meta.targetRole || "Technical Job Interview";

  const answersHtml = session.answers
    .map((a, idx) => {
      const correctHtml =
        a.correctAspects && a.correctAspects.length > 0
          ? `<div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:8px 12px; border-radius:8px; margin-top:8px; font-size:12px; color:#166534;">
              <strong>Accurate Elements:</strong> ${a.correctAspects.join(" • ")}
             </div>`
          : "";

      const missingHtml =
        a.missingOrIncorrect && a.missingOrIncorrect.length > 0
          ? `<div style="background:#fff1f2; border:1px solid #fecdd3; padding:8px 12px; border-radius:8px; margin-top:8px; font-size:12px; color:#9f1239;">
              <strong>Missing / Areas to Clarify:</strong> ${a.missingOrIncorrect.join(" • ")}
             </div>`
          : "";

      return `
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <strong style="color:#0b1a33; font-size:13px;">Q${idx + 1}: ${a.questionText}</strong>
          <span style="background:#f1f5f9; color:#334155; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">Score: ${a.score || 0}/10</span>
        </div>
        <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Topic: ${a.topicOrGrounding || "Core Subject"}</div>
        <div style="background:#f8fafc; border-left:3px solid #cbd5e1; padding:8px 12px; font-size:12px; color:#334155; font-style:italic; margin-bottom:8px;">
          "${a.answerText || "No response recorded."}"
        </div>
        <div style="font-size:12px; color:#1e293b;">
          <strong>Examiner Critique:</strong> ${a.feedback || a.verdict || "Evaluated."}
        </div>
        ${correctHtml}
        ${missingHtml}
        ${a.keyTakeaway ? `<div style="margin-top:6px; font-size:11px; color:#2563eb; font-weight:600;">Key Takeaway: ${a.keyTakeaway}</div>` : ""}
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Viora AI — Session Assessment Audit (${target})</title>
  <style>
    @page { margin: 15mm; size: A4; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 880px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0b1a33;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .print-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: right; margin-bottom: 12px;">
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="header">
      <div>
        <div style="display:inline-block; background:#0b1a33; color:white; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:800;">VIORA AI</div>
        <h1 style="font-size:22px; font-weight:800; color:#0b1a33; margin:8px 0 4px 0;">${isViva ? "College Viva Voce Evaluation Audit" : "Technical Job Interview Audit"}</h1>
        <p style="font-size:13px; color:#64748b; margin:0;">${target} • ${session.meta.level || "Standard Difficulty"}</p>
      </div>
      <div style="text-align:right; font-size:12px; color:#475569;">
        <div>Candidate: <strong>${candidateName}</strong></div>
        <div>Date: <strong>${dateStr}</strong></div>
        <div>Score: <strong style="color:#0b1a33; font-size:15px;">${session.overallScore}% (${session.grade})</strong></div>
        <div>Readiness: <strong style="color:#2563eb;">${session.readinessPercentage || session.overallScore}%</strong></div>
      </div>
    </div>

    <div style="background:#f1f5f9; border-radius:12px; padding:16px; margin-bottom:24px; font-size:13px;">
      <strong style="color:#0b1a33; display:block; margin-bottom:4px;">Readiness Verdict & Examiner Appraisal:</strong>
      <p style="margin:0; color:#334155; line-height:1.6;">${session.readinessVerdictExplanation || session.executiveSummary || "Evaluation completed."}</p>
    </div>

    <h2 style="font-size:14px; font-weight:800; color:#0b1a33; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">Question-by-Question Evaluation Audit</h2>
    ${answersHtml}

    <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:11px; color:#94a3b8;">
      <div>Viora AI Oral Assessment System</div>
      <div>Confidential Student Record</div>
    </div>
  </div>
</body>
</html>`;
}
