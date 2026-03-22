import { useState, useRef, useEffect } from "react";
import "../style/home.scss";
import "remixicon/fonts/remixicon.css";
import AnimatedBackground from "../components/AnimatedBackground";
import WizardLoader from "../components/WizardLoader";
import { useInterview } from "../hooks/useinterview";
import { useAuth } from "../../auth/hooks/use.auth";
import { useNavigate } from "react-router";

const Home = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setResumeFile(file);
  };
  const handleFileChange = (e) => setResumeFile(e.target.files[0]);

  const { generateReport, reports, getReports } = useInterview();
  const { user, handelLogout } = useAuth();
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadDone, setLoadDone] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const resumeInputRef = useRef();

  useEffect(() => {
    if (user) getReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleGenarateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0];
    if (!jobDescription || !selfDescription) {
      return alert("Please fill all the fields");
    }
    setSubmitting(true);
    setLoadDone(false);
    const data = await generateReport({
      jobDescription,
      selfDescription,
      resumeFile,
    });
    if (!data) {
      setSubmitting(false);
      setLoadDone(false);
      return alert("Failed to generate report. Please try again.");
    }
    setLoadDone(true);
    setTimeout(() => navigate(`/interview/${data._id}`), 400);
  };

  if (submitting) return <WizardLoader isDone={loadDone} />;

  return (
    <main className="home">
      <AnimatedBackground />

      {/* ── App Navbar ── */}
      <nav className="app-nav">
        <a href="/" className="app-nav__brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          LazyCv
        </a>

        <span className="app-nav__pill">
          <i className="ri-sparkling-2-line" /> AI Interview Prep
        </span>

        <div className="app-nav__right">
          <span className="app-nav__user">
            <i className="ri-user-3-line" />
            {user?.username}
          </span>
          <button className="app-nav__logout" onClick={handelLogout}>
            <i className="ri-logout-box-r-line" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      <div className="home__body">
        {/* ── Header ── */}
        <div className="home__header">
          <span className="home__header-badge">
            <i className="ri-sparkling-2-line" /> AI-Powered · ~30 Second Analysis
          </span>
          <h1>
            Build Your Custom{" "}
            <span className="home__header-highlight">Interview Strategy</span>
          </h1>
          <p className="home__header-sub">
            Upload your resume and paste the job description — our AI finds the
            match and builds a personalized preparation plan.
          </p>
        </div>

        {/* ── Card ── */}
        <div className="home__card">
          {/* ── Panels row ── */}
          <div className="home__panels">
            {/* Left Panel — Job Description */}
            <div className="home__panel home__panel--left">
              <div className="home__panel-header">
                <i className="ri-briefcase-4-line home__panel-icon" />
                <h2>Target Job Description</h2>
                <span className="home__badge home__badge--required">
                  REQUIRED
                </span>
              </div>
              <textarea
                className="home__textarea"
                id="job-description"
                name="job-description"
                placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={5000}
              />
              <div className="home__panel-footer">
                <span className="home__char-counter">
                  {jobDescription.length} / 5000 chars
                </span>
              </div>
            </div>

            <div className="home__divider-v" />

            {/* Right Panel — Your Profile */}
            <div className="home__panel home__panel--right">
              <div className="home__panel-header">
                <i className="ri-user-3-line home__panel-icon" />
                <h2>Your Profile</h2>
              </div>

              <div className="home__section-label">
                Upload Resume{" "}
                <span className="home__badge home__badge--best">
                  BEST RESULTS
                </span>
              </div>

              <label
                htmlFor="resume"
                className={`home__dropzone${isDragging ? " home__dropzone--active" : ""}${resumeFile ? " home__dropzone--uploaded" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <i
                  className={`home__dropzone-icon ${resumeFile ? "ri-checkbox-circle-line" : "ri-upload-cloud-2-line"}`}
                />
                <span className="home__dropzone-text">
                  {resumeFile
                    ? resumeFile.name
                    : "Click to upload or drag & drop"}
                </span>
                <span className="home__dropzone-sub">PDF or DOCX (Max 5MB)</span>
                <input
                  ref={resumeInputRef}
                  hidden
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
              </label>

              <div className="home__or-divider">
                <span>OR</span>
              </div>

              <div className="home__section-label">
                <i className="ri-quill-pen-line" /> Quick Self-Description
              </div>
              <textarea
                className="home__textarea home__textarea--profile"
                id="selfDescription"
                name="selfDescription"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
              />

              <div className="home__info-box">
                <i className="ri-information-line home__info-icon" />
                <p>
                  Either a <strong>Resume</strong> or a{" "}
                  <strong>Self Description</strong> is required to generate a
                  personalized plan.
                </p>
              </div>
            </div>
          </div>

          {/* ── Card Footer — always visible inside card ── */}
          <div className="home__card-footer">
            <span className="home__footer-note">
              <i className="ri-sparkling-2-line" /> AI-Powered Strategy Generation
              &bull; Approx 30s
            </span>
            <button
              onClick={handleGenarateReport}
              disabled={submitting}
              className="home__generate-btn"
            >
              <i className="ri-star-line" /> Generate My Interview Strategy
            </button>
          </div>
        </div>

        {/* ── Recent Reports (collapsible) ── */}
        {reports.length > 0 && (
          <section className="home__reports">
            <button
              className={`home__reports-toggle${isReportsOpen ? " home__reports-toggle--open" : ""}`}
              onClick={() => setIsReportsOpen((o) => !o)}
            >
              <span className="home__reports-toggle-left">
                <i className="ri-history-line" />
                <span>Recent Reports</span>
                <span className="home__reports-count">{reports.length}</span>
              </span>
              <i className="ri-arrow-down-s-line home__reports-chevron" />
            </button>

            <div className={`home__reports-body${isReportsOpen ? " home__reports-body--open" : ""}`}>
              <div className="home__reports-grid">
                {reports.map((r) => {
                  const score = r.matchScore ?? 0;
                  const scoreClass =
                    score >= 85 ? "home__report-score--excellent" :
                    score >= 70 ? "home__report-score--strong"    :
                    score >= 50 ? "home__report-score--moderate"  :
                                  "home__report-score--low";
                  const scoreLabel =
                    score >= 85 ? "Excellent" :
                    score >= 70 ? "Strong"    :
                    score >= 50 ? "Moderate"  : "Needs Work";
                  const date = new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  });

                  return (
                    <div
                      key={r._id}
                      className="home__report-card"
                      onClick={() => navigate(`/interview/${r._id}`)}
                    >
                      <div className="home__report-card-left">
                        <div className="home__report-icon-wrap">
                          <i className="ri-briefcase-4-line" />
                        </div>
                        <div className="home__report-info">
                          <h3 className="home__report-title">{r.title || "Untitled Position"}</h3>
                          <span className="home__report-date">
                            <i className="ri-calendar-line" /> {date}
                          </span>
                        </div>
                      </div>
                      <div className="home__report-card-right">
                        <div className={`home__report-score ${scoreClass}`}>
                          <span className="home__report-score-num">{score}%</span>
                          <span className="home__report-score-tag">{scoreLabel}</span>
                        </div>
                        <i className="ri-arrow-right-s-line home__report-arrow" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Page Footer ── */}
      <footer className="home__page-footer">
        <span className="home__page-footer-copy">
          &copy; {new Date().getFullYear()} LazyCv
        </span>
        <nav className="home__page-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </nav>
      </footer>
    </main>
  );
};

export default Home;
