const { OpenAI } = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");

const ai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// Mirrors the section structure that pdf.service.js's buildHtml() expects.
// ─────────────────────────────────────────────────────────────────────────────
const tailoredResumeSchema = z.object({
  name: z.string()
    .describe("Candidate full name from the resume or self-description"),
  email: z.string()
    .describe("Email address, or empty string if not found"),
  phone: z.string()
    .describe("Phone number with country code if available, else empty string"),
  github: z.string()
    .describe("github.com/username format, or empty string"),
  linkedin: z.string()
    .describe("linkedin.com/in/username format, or empty string"),

  summary: z.string()
    .describe("2–3 sentence professional summary tailored to highlight fit for this specific job"),

  skills: z.array(z.object({
    category: z.string()
      .describe("Skill category name, e.g. 'Programming Languages', 'Frameworks & Libraries', 'Tools & Platforms'"),
    items: z.array(z.string())
      .describe("Skills in this category; most relevant to the job listed first"),
  })).describe("Skills grouped by category. Include only skills the candidate actually has, reordered to match job priorities"),

  projects: z.array(z.object({
    name: z.string().describe("Project name"),
    tech: z.string().describe("Tech stack, comma-separated"),
    points: z.array(z.string())
      .describe("2–3 concise bullet points emphasising aspects relevant to the target role"),
  })).describe("Projects from the candidate's background, reframed for relevance to the job"),

  experience: z.array(z.object({
    title: z.string().describe("Job title or role"),
    company: z.string().describe("Company or organisation name"),
    duration: z.string()
      .describe("Duration in 'Mon YYYY – Mon YYYY' or 'Mon YYYY – Present' format"),
    points: z.array(z.string())
      .describe("2–4 impact-driven bullet points tailored to job requirements"),
  })).describe("Work experience with bullet points rewritten to align with the job description"),

  education: z.array(z.object({
    institution: z.string().describe("University or college name"),
    degree: z.string().describe("Degree and field, e.g. 'B.Tech Computer Science'"),
    duration: z.string()
      .describe("Study period in 'Mon YYYY – Mon YYYY' format, e.g. 'Aug 2020 – Jun 2024'"),
  })).describe("Education history"),

  certifications: z.array(z.string())
    .describe("Certifications, prioritising those relevant to the job description"),

  achievements: z.array(z.string())
    .describe("Extra-curricular achievements in 'Title (Month Year)' format"),
});

// ─────────────────────────────────────────────────────────────────────────────
// AI CALL
// ─────────────────────────────────────────────────────────────────────────────
async function generateTailoredResume(resumeText, jobDescription, selfDescription, reportTitle) {
  const prompt = `You are an expert resume writer. Produce a tailored, ATS-optimised resume for a candidate applying for a specific role.

Target Job Title: ${reportTitle || "Not specified"}

Job Description:
${jobDescription}

Candidate's Uploaded Resume:
${resumeText || "Not provided"}

Candidate's Self-Description:
${selfDescription || "Not provided"}

Rules:
1. Extract REAL information only — never fabricate experience, skills, or education.
2. Rewrite the professional summary and bullet points with keywords from the job description.
3. Group and reorder skills so the most relevant to this job appear first.
4. For each project/experience, emphasise aspects that directly match job requirements.
5. Keep bullet points concise and achievement-oriented; use metrics where they appear in the source.
6. If no resume is provided, build from the self-description alone — keep it honest and minimal.
7. Return all date ranges in "Mon YYYY – Mon YYYY" or "Mon YYYY – Present" format.`;

  const response = await ai.responses.parse({
    model: "gpt-4o-mini",
    input: prompt,
    text: { format: zodTextFormat(tailoredResumeSchema, "resume") },
  });

  return response.output_parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERTER
// Turns the AI structured output into the cv object buildHtml() expects.
// ─────────────────────────────────────────────────────────────────────────────
function structuredToCv(structured, report) {
  // "Category: item1, item2, item3"
  const skillLines = (structured.skills || []).map(
    (s) => `${s.category}: ${(s.items || []).join(", ")}`
  );

  // Bullet title + plain body lines (projectBlock handles the rest)
  const projectLines = (structured.projects || []).flatMap((p) => [
    `• ${p.name}${p.tech ? ` | ${p.tech}` : ""}`,
    ...(p.points || []),
  ]);

  const expLines = (structured.experience || []).flatMap((e) => [
    `• ${e.title}${e.company ? ` | ${e.company}` : ""}`,
    ...(e.duration ? [e.duration] : []),
    ...(e.points || []),
  ]);

  // eduBlock detects date lines via month-name + dash regex
  const eduLines = (structured.education || []).flatMap((e) => [
    `• ${e.institution}`,
    ...(e.degree   ? [e.degree]   : []),
    ...(e.duration ? [e.duration] : []),
  ]);

  return {
    name:        structured.name || "Candidate",
    targetTitle: report.title   || "",
    contact: {
      email:     structured.email     || "",
      phone:     structured.phone     || "",
      github:    structured.github    || "",
      linkedin:  structured.linkedin  || "",
      portfolio: "",
    },
    summaryLines:  structured.summary ? [structured.summary] : [],
    projectLines,
    expLines,
    skillLines,
    eduLines,
    certLines:   structured.certifications || [],
    extraLines:  (structured.achievements || []).map((a) => `• ${a}`),
    hasStructure: true,
    rawFallback:  "",
    self:         "",
  };
}

module.exports = { generateTailoredResume, structuredToCv };
