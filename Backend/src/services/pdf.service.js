const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
// ENV DETECTION
// @sparticuz/chromium only works in serverless (Lambda/Linux) environments.
// For local development, point Puppeteer at the system Chrome installation.
// ─────────────────────────────────────────────────────────────────────────────
function findLocalChrome() {
  const platform = process.platform;
  const candidates =
    platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          path.join(
            process.env.LOCALAPPDATA || "",
            "Google\\Chrome\\Application\\chrome.exe"
          ),
          path.join(
            process.env.LOCALAPPDATA || "",
            "Chromium\\Application\\chrome.exe"
          ),
        ]
      : platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
        ];

  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

async function getPuppeteerLaunchOptions() {
  // Use @sparticuz/chromium when deployed (Render, Lambda, any Linux server).
  // Fall back to local system Chrome only during Windows/macOS development.
  const isDeployed =
    process.env.NODE_ENV === "production" ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.RENDER; // Render injects RENDER=true automatically

  if (isDeployed) {
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }

  const localChrome = findLocalChrome();
  if (!localChrome) {
    throw new Error(
      "No Chrome/Chromium binary found for local development. " +
        "Install Google Chrome or set NODE_ENV=production to use @sparticuz/chromium."
    );
  }

  return {
    executablePath: localChrome,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trimLines(text) {
  return (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION SPLITTER
// Splits raw resume text into named sections using common header patterns.
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_HEADERS = [
  "PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE", "PROFILE", "ABOUT ME", "ABOUT",
  "ACADEMIC PROJECTS", "PROJECTS", "PORTFOLIO",
  "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EXPERIENCE", "EMPLOYMENT", "WORK HISTORY",
  "SKILLS SUMMARY", "TECHNICAL SKILLS", "SKILLS", "CORE COMPETENCIES",
  "EDUCATION", "ACADEMIC BACKGROUND", "ACADEMIC QUALIFICATIONS",
  "CERTIFICATIONS", "CERTIFICATES", "LICENSES",
  "EXTRA-CURRICULAR", "EXTRACURRICULAR", "ACTIVITIES", "ACHIEVEMENTS",
  "AWARDS", "HONORS", "PUBLICATIONS", "LANGUAGES", "VOLUNTEER", "INTERESTS",
];

function splitSections(text) {
  const allLines = trimLines(text);
  const sections = {};
  let currentKey = "__header__";
  sections[currentKey] = [];

  for (const line of allLines) {
    // Check if this line is a section header (case-insensitive, allowing trailing colon/spaces)
    const normalized = line.replace(/:?\s*$/, "").trim().toUpperCase();
    const match = SECTION_HEADERS.find(
      (h) => normalized === h || normalized.startsWith(h)
    );
    if (match) {
      currentKey = match;
      if (!sections[currentKey]) sections[currentKey] = [];
    } else {
      sections[currentKey].push(line);
    }
  }
  return sections;
}

function getSection(sections, ...keys) {
  for (const k of keys) {
    for (const key of Object.keys(sections)) {
      if (key.toUpperCase().startsWith(k.toUpperCase()) && sections[key].length) {
        return sections[key];
      }
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
function extractContact(text) {
  return {
    email:     (text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)         || [])[0] || "",
    phone:     (text.match(/(?:\+?\d[\d\s\-\.\(\)]{8,14}\d)/)      || [])[0] || "",
    github:    (text.match(/github\.com\/[\w\-]+/i)                 || [])[0] || "",
    linkedin:  (text.match(/linkedin\.com\/in\/[\w\-]+/i)           || [])[0] || "",
    portfolio: (text.match(/(?:[\w\-]+\.(?:dev|io|me|app|xyz))\/[\w\-]*/i) || [])[0] || "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE FULL CV DATA FROM REPORT
// ─────────────────────────────────────────────────────────────────────────────
function parseCvData(report) {
  const raw = (report.resumeText || "").trim();
  const self = (report.selfDescription || "").trim();
  const source = raw.length > 40 ? raw : self;

  const sections = splitSections(source);
  const contact  = extractContact(source);

  // Name — first clean line of header block
  const headerLines = sections["__header__"] || [];
  const name = headerLines.find(
    (l) => !l.match(/[@\d\+]/) && l.length > 2 && l.length < 70
  ) || "Candidate";

  // Summary
  const summaryLines = getSection(sections,
    "PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE", "PROFILE", "ABOUT"
  );

  // Projects
  const projectLines = getSection(sections,
    "ACADEMIC PROJECTS", "PROJECTS", "PORTFOLIO"
  );

  // Experience
  const expLines = getSection(sections,
    "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EXPERIENCE", "EMPLOYMENT"
  );

  // Skills — each line typically: "Category: item1, item2"
  const skillLines = getSection(sections,
    "SKILLS SUMMARY", "TECHNICAL SKILLS", "SKILLS", "CORE COMPETENCIES"
  );

  // Education — each entry roughly: "Institution, Location\nDegree\nDate"
  const eduLines = getSection(sections, "EDUCATION", "ACADEMIC");

  // Certifications
  const certLines = getSection(sections, "CERTIF", "LICENSES");

  // Extra-curricular / Achievements
  const extraLines = getSection(sections,
    "EXTRA-CURRICULAR", "EXTRACURRICULAR", "ACTIVITIES", "ACHIEVEMENTS", "AWARDS"
  );

  // Fallback: if no sections found, use raw text
  const hasStructure = summaryLines.length || projectLines.length ||
    expLines.length || skillLines.length || eduLines.length;

  return {
    name,
    targetTitle: report.title || "",
    contact,
    summaryLines,
    projectLines,
    expLines,
    skillLines,
    eduLines,
    certLines,
    extraLines,
    hasStructure,
    rawFallback: hasStructure ? "" : source,
    self,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/** Renders a section block matching the PDF format:
 *  bold heading + full-width rule, then content lines */
function section(title, contentHtml) {
  if (!contentHtml) return "";
  return `
  <div class="sec">
    <div class="sec-head">${esc(title)}</div>
    <div class="sec-body">${contentHtml}</div>
  </div>`;
}

/** Bullet list — strips leading bullet chars the raw text may already have */
function bulletList(linesArr) {
  if (!linesArr.length) return "";
  return `<ul>${linesArr
    .map((l) => `<li>${esc(l.replace(/^[•·▸▪\-\*]\s*/, ""))}</li>`)
    .join("")}</ul>`;
}

/** Skills section — bold "Category:" prefix, rest as normal text */
function skillsBlock(linesArr) {
  return linesArr
    .map((l) => {
      const colonIdx = l.indexOf(":");
      if (colonIdx > 0 && colonIdx < 30) {
        const label = l.slice(0, colonIdx + 1);
        const rest  = l.slice(colonIdx + 1);
        return `<p class="skill-line"><strong>${esc(label)}</strong>${esc(rest)}</p>`;
      }
      return `<p class="skill-line">${esc(l)}</p>`;
    })
    .join("");
}

/** Education block — tries to pair up institution / degree / date lines */
function eduBlock(linesArr) {
  // Group lines into entries separated by blank-ish patterns
  const entries = [];
  let current = [];

  for (const line of linesArr) {
    // A new entry usually starts with a bullet or an institution-like line
    if (line.match(/^[•·▸▪\-\*]/) && current.length) {
      entries.push(current);
      current = [line.replace(/^[•·▸▪\-\*]\s*/, "")];
    } else {
      current.push(line.replace(/^[•·▸▪\-\*]\s*/, ""));
    }
  }
  if (current.length) entries.push(current);

  return entries
    .map((entry) => {
      // Try to find a date range (e.g. "Nov 2023 – June 2026")
      const dateLineIdx = entry.findIndex((l) =>
        l.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d\d|19\d\d)/i)
        && l.match(/[-–—]|present/i)
      );
      const dateLine = dateLineIdx >= 0 ? entry.splice(dateLineIdx, 1)[0] : "";

      const institution = entry[0] || "";
      const rest        = entry.slice(1);

      return `
      <div class="edu-entry">
        <div class="edu-row">
          <span class="edu-inst">${esc(institution)}</span>
          ${dateLine ? `<span class="edu-date">${esc(dateLine)}</span>` : ""}
        </div>
        ${rest.map((l) => `<div class="edu-sub">${esc(l)}</div>`).join("")}
      </div>`;
    })
    .join("");
}

/** Projects / Experience — bold project name line, description lines below */
function projectBlock(linesArr) {
  const entries = [];
  let current = null;

  for (const line of linesArr) {
    const stripped = line.replace(/^[•·▸▪\-\*]\s*/, "");
    // A line starting with a bullet that has ≤100 chars and no trailing period
    // is treated as a project/entry title
    const isBullet = line.match(/^[•·▸▪\-\*]/);
    const isTitle  = isBullet && stripped.length < 110 && !stripped.endsWith(".");

    if (isTitle) {
      if (current) entries.push(current);
      current = { title: stripped, body: [] };
    } else if (current) {
      current.body.push(stripped);
    } else {
      // Preamble line before any bullet
      entries.push({ title: null, body: [stripped] });
    }
  }
  if (current) entries.push(current);

  return entries
    .map((e) =>
      e.title
        ? `<div class="proj-entry">
            <p class="proj-title">• <strong>${esc(e.title)}</strong></p>
            ${e.body.map((b) => `<p class="proj-body">${esc(b)}</p>`).join("")}
           </div>`
        : e.body.map((b) => `<p class="proj-body">${esc(b)}</p>`).join("")
    )
    .join("");
}

/** Extra-curricular — bold title, optional date right-aligned, description */
function extraBlock(linesArr) {
  const entries = [];
  let current = null;

  for (const line of linesArr) {
    const stripped = line.replace(/^[•·▸▪\-\*]\s*/, "");
    const isBullet = line.match(/^[•·▸▪\-\*]/);

    // Extract trailing date like "(June 2024)" or "(Apr 2025 – Present)"
    const dateMatch = stripped.match(/\(([^)]{4,30})\)\s*$/);
    const dateStr   = dateMatch ? dateMatch[1] : "";
    const titleStr  = dateMatch ? stripped.slice(0, dateMatch.index).trim() : stripped;

    if (isBullet) {
      if (current) entries.push(current);
      current = { title: titleStr, date: dateStr, body: [] };
    } else if (current) {
      current.body.push(stripped);
    }
  }
  if (current) entries.push(current);

  return entries
    .map((e) => `
      <div class="extra-entry">
        <div class="extra-row">
          <span>• <strong>${esc(e.title)}</strong></span>
          ${e.date ? `<span class="extra-date">(${esc(e.date)})</span>` : ""}
        </div>
        ${e.body.map((b) => `<p class="extra-body">${esc(b)}</p>`).join("")}
      </div>`)
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL HTML ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────
function buildHtml(cv) {
  // Contact line — only include non-empty items
  const contactParts = [
    cv.contact.email    && esc(cv.contact.email),
    cv.contact.github   && `GitHub`,
    cv.contact.linkedin && `LinkedIn`,
    cv.contact.phone    && `Mobile: ${esc(cv.contact.phone)}`,
    cv.contact.portfolio && esc(cv.contact.portfolio),
  ].filter(Boolean);
  const contactLine = contactParts.join("&nbsp;&nbsp;&nbsp;");

  // Sections
  const summaryHtml = cv.summaryLines.length
    ? `<p class="summary-text">${esc(cv.summaryLines.join(" "))}</p>`
    : "";

  const projOrExpHtml = cv.projectLines.length
    ? projectBlock(cv.projectLines)
    : cv.expLines.length
      ? projectBlock(cv.expLines)
      : "";

  const expHtml = cv.projectLines.length && cv.expLines.length
    ? projectBlock(cv.expLines)
    : "";

  const skillsHtml  = skillsBlock(cv.skillLines);
  const educHtml    = eduBlock(cv.eduLines);
  const certHtml    = bulletList(cv.certLines);
  const extraHtml   = extraBlock(cv.extraLines);

  const fallbackHtml = cv.rawFallback
    ? `<p style="font-size:11.5px;color:#333;white-space:pre-wrap;line-height:1.6">${esc(cv.rawFallback)}</p>`
    : "";

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
/* ── Reset ── */
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { font-size:12px; }
body {
  font-family: 'Times New Roman', Times, serif;
  background: #fff;
  color: #000;
  line-height: 1.45;
  width: 210mm;
  padding: 14mm 16mm 12mm;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Header ── */
.hdr {
  text-align: center;
  margin-bottom: 6px;
}
.hdr-name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #000;
  font-family: 'Times New Roman', Times, serif;
}
.hdr-contact {
  font-size: 11px;
  color: #000;
  margin-top: 3px;
}

/* ── Section ── */
.sec {
  margin-bottom: 10px;
  page-break-inside: avoid;
}
.sec-head {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #000;
  border-bottom: 1.5px solid #000;
  padding-bottom: 2px;
  margin-bottom: 6px;
}
.sec-body {
  font-size: 11.5px;
  color: #111;
}

/* ── Summary ── */
.summary-text {
  font-size: 11.5px;
  line-height: 1.55;
  color: #111;
}

/* ── Skills ── */
.skill-line {
  font-size: 11.5px;
  line-height: 1.55;
  margin-bottom: 1px;
}
.skill-line strong { color: #000; }

/* ── Projects / Experience ── */
.proj-entry  { margin-bottom: 6px; }
.proj-title  { font-size: 11.5px; line-height: 1.5; }
.proj-body   { font-size: 11px; color: #222; padding-left: 12px; line-height: 1.5; }

/* ── Education ── */
.edu-entry  { margin-bottom: 7px; page-break-inside: avoid; }
.edu-row    { display: flex; justify-content: space-between; align-items: baseline; }
.edu-inst   { font-size: 11.5px; font-weight: 700; color: #000; }
.edu-date   { font-size: 11px; color: #111; white-space: nowrap; margin-left: 8px; }
.edu-sub    { font-size: 11px; color: #222; padding-left: 0; margin-top: 1px; }

/* ── Certifications bullet list ── */
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
ul li {
  font-size: 11.5px;
  line-height: 1.55;
  padding-left: 12px;
  position: relative;
  margin-bottom: 2px;
}
ul li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #000;
}

/* ── Extra-curricular ── */
.extra-entry { margin-bottom: 5px; page-break-inside: avoid; }
.extra-row   { display: flex; justify-content: space-between; align-items: baseline; font-size: 11.5px; }
.extra-date  { font-size: 11px; white-space: nowrap; margin-left: 8px; color: #111; }
.extra-body  { font-size: 11px; color: #222; padding-left: 12px; line-height: 1.5; margin-top: 1px; }

/* ── Footer ── */
.ftr {
  margin-top: 12px;
  border-top: 1px solid #ccc;
  padding-top: 5px;
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #888;
  font-family: 'Segoe UI', Arial, sans-serif;
}
</style>
</head>
<body>

<!-- ── Name & Contact ── -->
<div class="hdr">
  <div class="hdr-name">${esc(cv.name)}</div>
  <div class="hdr-contact">${contactLine || "&nbsp;"}</div>
</div>

${summaryHtml   ? section("Professional Summary", summaryHtml)   : ""}
${projOrExpHtml ? section(cv.projectLines.length ? "Academic Projects" : "Professional Experience", projOrExpHtml) : ""}
${expHtml       ? section("Professional Experience", expHtml)    : ""}
${skillsHtml    ? section("Skills Summary", skillsHtml)          : ""}
${educHtml      ? section("Education", educHtml)                 : ""}
${certHtml      ? section("Certifications", certHtml)            : ""}
${extraHtml     ? section("Extra-Curricular Achievements", extraHtml) : ""}
${fallbackHtml  ? section("Professional Background", fallbackHtml) : ""}

<div class="ftr">
  <span>Generated by LazyCv · AI-powered CV builder</span>
  <span>${today}</span>
</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUPPETEER HELPER — shared by both exports
// ─────────────────────────────────────────────────────────────────────────────
async function htmlToPdf(html) {
  const launchOptions = await getPuppeteerLaunchOptions();
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // ── Force single-page output ───────────────────────────────────────────
    // A4 at 96 dpi = 794 x 1122 px. If the rendered content is taller,
    // scale the whole body down so everything fits on exactly one page.
    await page.evaluate(() => {
      const A4_H = 1122;
      const h = document.body.scrollHeight;
      if (h > A4_H) {
        const scale = A4_H / h;
        document.body.style.transform = `scale(${scale})`;
        document.body.style.transformOrigin = "top left";
        document.body.style.width = `${Math.ceil(100 / scale)}%`;
        document.body.style.overflow = "hidden";
        document.body.style.height = `${A4_H}px`;
      }
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generatePdf(report)
 * Legacy path: parses raw resumeText from a Mongoose report object.
 */
async function generatePdf(report) {
  const data = typeof report.toObject === "function" ? report.toObject() : report;
  const cv   = parseCvData(data);
  return htmlToPdf(buildHtml(cv));
}

/**
 * generatePdfFromCv(cv)
 * AI-tailored path: accepts a pre-built cv object (from resume.service.js)
 * and renders it directly into the same template — no re-parsing needed.
 */
async function generatePdfFromCv(cv) {
  return htmlToPdf(buildHtml(cv));
}

module.exports = { generatePdf, generatePdfFromCv };
