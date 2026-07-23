import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useInterview } from "../hooks/useinterview";
import "../style/interview.scss";
import "remixicon/fonts/remixicon.css";
import AnimatedBackground from "../components/AnimatedBackground";
import WizardLoader from "../components/WizardLoader";


const MOCK_REPORT = {
  _id: "xyz",
  title: "Senior Frontend Engineer",
  matchScore: 88,
  technicalQuestions: [
    {
      question: "Explain the difference between React's useEffect and useLayoutEffect.",
      intention: "Tests understanding of React rendering pipeline and side-effect timing.",
      answer: "useEffect fires asynchronously after paint; useLayoutEffect fires synchronously after DOM mutations but before paint. Use useLayoutEffect when you need to read/mutate the DOM before the browser repaints to avoid flickering.",
    },
    {
      question: "How does the Virtual DOM diffing algorithm work?",
      intention: "Assesses depth of knowledge on React internals and performance.",
      answer: "React compares the new VDOM tree with the previous one using a heuristic O(n) algorithm. It assumes elements of different types produce different trees and uses 'key' props to match children in lists, minimising actual DOM mutations.",
    },
    {
      question: "What are the trade-offs between CSS-in-JS and traditional SCSS?",
      intention: "Evaluates architectural decision-making around styling strategies.",
      answer: "CSS-in-JS enables co-location, dynamic theming, and automatic dead-code elimination but adds runtime cost and bundle size. SCSS is zero-runtime, tooling-agnostic, and familiar but requires discipline to avoid global leaks.",
    },
  ],
  behavioralQuestions: [
    {
      question: "Describe a time you had to refactor a large codebase under deadline pressure.",
      intention: "Probes ability to balance technical debt against delivery timelines.",
      answer: "Focus on how you scoped the refactor incrementally, communicated risk to stakeholders, and used feature flags or strangler-fig pattern to ship safely without a big-bang rewrite.",
    },
    {
      question: "How do you handle disagreements with a senior engineer on technical direction?",
      intention: "Evaluates communication, humility, and collaborative problem-solving.",
      answer: "Describe using data and prototypes to build consensus, escalating constructively when needed, and ultimately committing to the team decision while documenting trade-offs for future reference.",
    },
  ],
  skillGaps: [
    { skill: "TypeScript generics & advanced types", severity: "high" },
    { skill: "Web performance profiling (Lighthouse, Chrome DevTools)", severity: "high" },
    { skill: "Micro-frontend architecture", severity: "medium" },
    { skill: "GraphQL & Apollo Client", severity: "medium" },
    { skill: "CI/CD pipeline configuration", severity: "low" },
  ],
  preparationPlan: [
    { day: 1, focus: "TypeScript deep-dive", task: "Complete TypeScript generics exercises on the official playground and refactor a small project to strict mode." },
    { day: 2, focus: "React internals", task: "Read the React reconciler docs, then build a tiny custom renderer to solidify VDOM understanding." },
    { day: 3, focus: "Performance profiling", task: "Profile a sample app with Lighthouse; identify and fix at least 3 bottlenecks using memoisation and lazy loading." },
    { day: 4, focus: "System design", task: "Study micro-frontend patterns (Module Federation, single-spa). Sketch an architecture diagram for a large e-commerce site." },
    { day: 5, focus: "GraphQL", task: "Build a small Apollo Client + React app consuming a public GraphQL API (e.g. GitHub). Focus on caching strategies." },
    { day: 6, focus: "Behavioural prep", task: "Write out STAR-format answers for 5 common behavioural questions. Record yourself and review for clarity." },
    { day: 7, focus: "Mock interviews", task: "Complete 2 timed mock interviews on Pramp or Interviewing.io. Focus on communicating thought process aloud." },
  ],
};

const SECTIONS = [
  { key: "technical",  label: "Technical",  icon: "ri-code-s-slash-line" },
  { key: "behavioral", label: "Behavioral", icon: "ri-chat-3-line" },
  { key: "roadmap",    label: "Road Map",   icon: "ri-map-2-line" },
];

const severityClass = (s) =>
  s === "high" ? "gap--high" : s === "medium" ? "gap--medium" : "gap--low";

const scoreTag = (n) =>
  n >= 85 ? ["Excellent", "tag--excellent"] :
  n >= 70 ? ["Strong",    "tag--strong"]    :
  n >= 50 ? ["Moderate",  "tag--moderate"]  :
            ["Needs Work","tag--low"];

// ── Left sidebar nav ──────────────────────────────────────
const Sidebar = ({ report, activeSection, setActiveSection, setExpandedIdx }) => {
  const circumference = 2 * Math.PI * 38;
  const [label, tagClass] = scoreTag(report.matchScore);

  return (
    <aside className="iv__sidebar">
      {report.title && (
        <div className="iv__sidebar-title">
          <i className="ri-briefcase-4-line" />
          <span>{report.title}</span>
        </div>
      )}

      <div className="iv__sidebar-score">
        <p className="iv__score-label">Match Score</p>
        <div className="iv__score-ring">
          <svg viewBox="0 0 96 96" className="iv__score-svg">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00e5ff" />
              </linearGradient>
            </defs>
            <circle cx="48" cy="48" r="38" className="iv__score-track" />
            <circle
              cx="48" cy="48" r="38"
              className="iv__score-fill"
              strokeDasharray={`${(report.matchScore / 100) * circumference} ${circumference}`}
            />
          </svg>
          <div className="iv__score-inner">
            <span className="iv__score-number">{report.matchScore}</span>
            <span className="iv__score-pct">%</span>
          </div>
        </div>
        <span className={`iv__score-tag ${tagClass}`}>{label}</span>
      </div>

      <nav className="iv__nav">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`iv__nav-item${activeSection === s.key ? " iv__nav-item--active" : ""}`}
            onClick={() => { setActiveSection(s.key); setExpandedIdx(null); }}
          >
            <i className={s.icon} />
            {s.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

// ── Centre content ─────────────────────────────────────────
const Content = ({ report, activeSection, expandedIdx, toggleExpand }) => {
  if (activeSection === "technical" && report.technicalQuestions) {
    return (
      <div className="iv__content-inner">
        <h2 className="iv__section-title">
          <i className="ri-code-s-slash-line" /> Technical Questions
        </h2>
        <p className="iv__section-sub">
          {report.technicalQuestions.length} questions tailored to the role
        </p>
        <div className="iv__qa-list">
          {report.technicalQuestions.map((q, i) => (
            <div
              key={i}
              className={`iv__qa-card${expandedIdx === i ? " iv__qa-card--open" : ""}`}
            >
              <button className="iv__qa-header" onClick={() => toggleExpand(i)}>
                <span className="iv__qa-num">Q{i + 1}</span>
                <span className="iv__qa-q">{q.question}</span>
                <i className={`iv__qa-chevron ${expandedIdx === i ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}`} />
              </button>
              {expandedIdx === i && (
                <div className="iv__qa-body">
                  <p className="iv__qa-intent">
                    <i className="ri-focus-3-line" /> {q.intention}
                  </p>
                  <p className="iv__qa-answer">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection === "behavioral" && report.behavioralQuestions) {
    return (
      <div className="iv__content-inner">
        <h2 className="iv__section-title">
          <i className="ri-chat-3-line" /> Behavioral Questions
        </h2>
        <p className="iv__section-sub">
          {report.behavioralQuestions.length} situational questions
        </p>
        <div className="iv__qa-list">
          {report.behavioralQuestions.map((q, i) => (
            <div
              key={i}
              className={`iv__qa-card${expandedIdx === i ? " iv__qa-card--open" : ""}`}
            >
              <button className="iv__qa-header" onClick={() => toggleExpand(i)}>
                <span className="iv__qa-num">B{i + 1}</span>
                <span className="iv__qa-q">{q.question}</span>
                <i className={`iv__qa-chevron ${expandedIdx === i ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}`} />
              </button>
              {expandedIdx === i && (
                <div className="iv__qa-body">
                  <p className="iv__qa-intent">
                    <i className="ri-focus-3-line" /> {q.intention}
                  </p>
                  <p className="iv__qa-answer">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection === "roadmap" && report.preparationPlan) {
    const DAY_ICONS = [
      "ri-book-open-line", "ri-server-line", "ri-speed-line",
      "ri-layout-4-line",  "ri-test-tube-line", "ri-building-2-line",
      "ri-presentation-line",
    ];
    const total = report.preparationPlan.length;
    return (
      <div className="iv__content-inner">
        <h2 className="iv__section-title">
          <i className="ri-map-2-line" /> Preparation Road Map
        </h2>
        <p className="iv__section-sub">
          <i className="ri-calendar-schedule-line" /> {total}-day structured plan
        </p>
        <div className="iv__roadmap">
          {report.preparationPlan.map((day, i) => (
            <div key={i} className="iv__day-card">
              <div className="iv__day-timeline">
                <div className="iv__day-dot">
                  <i className={DAY_ICONS[i % DAY_ICONS.length]} />
                </div>
                {i < total - 1 && <div className="iv__day-line" />}
              </div>
              <div className="iv__day-body">
                <div className="iv__day-header">
                  <span className="iv__day-badge">
                    <i className="ri-time-line" /> Day {day.day}
                  </span>
                  <h4 className="iv__day-focus">{day.focus}</h4>
                </div>
                <p className="iv__day-task">{day.task}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// ── Right panel: Skill Gaps ────────────────────────────────
const GAP_ICON = { high: "ri-alarm-warning-line", medium: "ri-alert-line", low: "ri-information-line" };

const SkillGaps = ({ report }) => (
  <aside className="iv__gaps">
    <h3 className="iv__gaps-title">
      <i className="ri-mental-health-line" /> Skill Gaps
    </h3>
    <div className="iv__gaps-list">
      {(Array.isArray(report.skillGaps)
        ? report.skillGaps
        : [report.skillGaps]
      ).map((g, i) => (
        <span key={i} className={`iv__gap-tag ${severityClass(g.severity)}`}>
          <i className={GAP_ICON[g.severity] ?? "ri-checkbox-blank-circle-line"} />
          {g.skill}
        </span>
      ))}
    </div>

    <div className="iv__gaps-legend">
      <i className="ri-alarm-warning-line iv__legend-icon gap--high" />High
      <i className="ri-alert-line iv__legend-icon gap--medium" />Medium
      <i className="ri-information-line iv__legend-icon gap--low" />Low
    </div>
  </aside>
);

// ── Component ───────────────────────────────────────────────
const Interview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { report, loading, getReportById, downloadPdf } = useInterview();
  const [activeSection, setActiveSection] = useState("technical");
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [fetchDone, setFetchDone] = useState(interviewId === "xyz");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (interviewId === "xyz") { setFetchDone(true); return; }
    setFetchDone(false);
    getReportById(interviewId).finally(() => setFetchDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const activeReport = interviewId === "xyz" ? MOCK_REPORT : report;
  const toggleExpand = (i) => setExpandedIdx(expandedIdx === i ? null : i);

  const handleDownloadPdf = async () => {
    if (interviewId === "xyz") return alert("PDF download is not available for the preview report.");
    setDownloading(true);
    const success = await downloadPdf(interviewId);
    setDownloading(false);
    if (!success) alert("Failed to generate PDF. Please try again.");
  };

  if (!fetchDone || loading) return <WizardLoader text="Loading your report" sub="Fetching your interview plan" />;
  if (!activeReport) return <main><h1>Report not found</h1></main>;

  return (
    <main className="iv">
      <AnimatedBackground />

      {/* ── App Navbar ── */}
      <nav className="app-nav">
        <button className="app-nav__back" onClick={() => navigate("/app")}>
          <i className="ri-arrow-left-line" />
          <span>Dashboard</span>
        </button>

        {activeReport.title && (
          <span className="app-nav__pill">
            <i className="ri-briefcase-4-line" />
            {activeReport.title}
          </span>
        )}

        <div className="app-nav__right">
          <button
            className={`app-nav__dl-btn${downloading ? " app-nav__dl-btn--loading" : ""}`}
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            <i className={downloading ? "ri-loader-4-line iv__spin" : "ri-download-2-line"} />
            <span>{downloading ? "Generating…" : "Download PDF"}</span>
          </button>
        </div>
      </nav>

      <div className="iv__shell">
        <Sidebar
          report={activeReport}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setExpandedIdx={setExpandedIdx}
        />

        <section className="iv__center">
          <Content
            report={activeReport}
            activeSection={activeSection}
            expandedIdx={expandedIdx}
            toggleExpand={toggleExpand}
          />
        </section>

        <SkillGaps report={activeReport} />
      </div>
    </main>
  );
};

export default Interview;
