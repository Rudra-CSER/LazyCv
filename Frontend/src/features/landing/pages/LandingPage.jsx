import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  Brain, LogIn, ArrowRight, ArrowUpRight,
  Sparkles, Zap, MessageSquare, BarChart2, CalendarCheck,
  UploadCloud, FileEdit, BarChart,
  FileBarChart, AlertTriangle, Code2,
  Github, Twitter, Linkedin, Heart,
} from "lucide-react";
import HeroScroll from "../components/HeroScroll";
import GifParallax from "../components/GifParallax";
import CursorTrail from "../components/CursorTrail";
import VideoMarquee from "../components/VideoMarquee";
import "../landing.scss";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { Icon: Zap,           value: "30s",   label: "Full report generated"      },
  { Icon: MessageSquare, value: "10+",   label: "Custom interview questions" },
  { Icon: BarChart2,     value: "4",     label: "Dimensions scored"          },
  { Icon: CalendarCheck, value: "7-day", label: "Personalised prep roadmap"  },
];


const SAMPLE_GAPS = [
  { skill: "Container Orchestration (K8s / Helm)", gap: 71 },
  { skill: "High-throughput System Design",        gap: 54 },
  { skill: "Go Concurrency Patterns",              gap: 38 },
];

const STEPS = [
  { n: "01", Icon: UploadCloud, title: "Upload Your Resume",
    desc: "Drop in your PDF — our parser extracts skills, experience, and context from every section, even non-standard layouts." },
  { n: "02", Icon: FileEdit, title: "Describe the Role",
    desc: "Paste the job description and a quick self-introduction. The more context you give, the sharper your personalised report." },
  { n: "03", Icon: BarChart, title: "Get Your Report",
    desc: "In under 30 seconds, receive your match score, tailored questions with answers, skill gaps, and a full 7-day prep roadmap." },
];

const MARQUEE_ITEMS = [
  "AI-Powered Interview Prep", "Resume Match Score", "Skill Gap Analysis",
  "12 Interview Questions", "7-Day Roadmap", "Results in 30 Seconds",
  "Built for Job Seekers", "No Credit Card",
];

// ── Component ──────────────────────────────────────────────────────────────
const LandingPage = () => {
  const progressRef = useRef(null);

  // ── Lenis smooth scroll ────────────────────────────────────────────────
  // Drives all page scrolling with inertia/lag so it never feels instant.
  // Wired into GSAP's ticker so ScrollTrigger positions stay accurate.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,          // inertia length — higher = more lag/float
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
      smoothWheel: true,
      wheelMultiplier: 0.9,   // slightly slower wheel so it feels weighty
      touchMultiplier: 1.8,   // keep touch responsive on mobile
    });

    // Let GSAP drive Lenis on every frame — eliminates jank between the two
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0); // Lenis handles lag itself

    // Keep ScrollTrigger scroll positions in sync with Lenis virtual scroll
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  // Scroll progress bar
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Magnetic CTA ──────────────────────────────────────────────────────────
  useEffect(() => {
    const btn = document.querySelector(".hero-intro__cta");
    if (!btn) return;
    const RADIUS = 140, STRENGTH = 0.40;
    const onMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        const pull = 1 - dist / RADIUS;
        gsap.to(btn, { x: dx * pull * STRENGTH, y: dy * pull * STRENGTH, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      } else {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)", overwrite: "auto" });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); gsap.set(btn, { x: 0, y: 0 }); };
  }, []);

  // ── GSAP scroll animations ────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const ST = { toggleActions: "play none none none" };

      // ── Word-split utility ─────────────────────────────────────────────────
      // Wraps each word in overflow:hidden so inner spans can slide up from below.
      // Only safe to call on elements with PLAIN text (no HTML children).
      const splitWords = (selector) =>
        gsap.utils.toArray(selector).flatMap((el) => {
          const words = el.textContent.trim().split(/\s+/);
          el.innerHTML = words
            .map((w) => `<span class="split-wrap"><span class="split-word">${w}</span></span>`)
            .join("\u00a0"); // non-breaking space keeps word spacing
          return Array.from(el.querySelectorAll(".split-word"));
        });

      // ── 1. Hero intro — cinematic entrance ────────────────────────────────
      gsap.from(".hero-intro__glow",
        { scale: 0.08, opacity: 0, duration: 3.0, ease: "power2.out" });
      gsap.from(".hero-intro__bg-grid",
        { opacity: 0, duration: 2.2, delay: 0.4, ease: "power1.in" });

      gsap.timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".hero-intro__eyebrow",
          { clipPath: "inset(0 100% 0 0)", opacity: 0, x: -12 },
          { clipPath: "inset(0 0% 0 0)", opacity: 1, x: 0, duration: 1.0, ease: "power3.inOut" },
          0.18)
        .from(".hero-intro__heading",
          { opacity: 0, y: -55, scale: 1.07, rotateX: -10, transformPerspective: 900, duration: 1.45 },
          0.30)
        .fromTo(".hero-intro__sub",
          { opacity: 0, y: 28, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05, ease: "power2.out", clearProps: "filter" },
          0.85)
        .from(".hero-intro__highlight",
          { opacity: 0, scale: 0.65, rotateX: 18, transformPerspective: 600, duration: 0.9, ease: "elastic.out(1, 0.5)" },
          0.92)
        // Each avatar springs in individually — feels organic, not mechanical
        .from(".hero-intro__avatar",
          { opacity: 0, scale: 0, duration: 0.65, stagger: 0.08, ease: "back.out(2.2)" },
          1.10)
        .from(".hero-intro__social-text",
          { opacity: 0, x: 18, duration: 0.6, ease: "power2.out" },
          1.38)
        // CTA + hint enter together — button bounces in with elastic spring
        .from(".hero-intro__cta, .hero-intro__cta-hint",
          { opacity: 0, scale: 0.5, y: 20, duration: 1.3,
            stagger: 0.12, ease: "elastic.out(1, 0.48)" },
          1.28);

      // ── 2. Hero parallax (scrubbed) ───────────────────────────────────────
      gsap.to(".hero-intro__glow", {
        yPercent: -60, scale: 1.25, ease: "none",
        scrollTrigger: { trigger: ".hero-intro", start: "top top", end: "bottom top", scrub: 2 },
      });
      gsap.to(".hero-intro__content", {
        y: -100, opacity: 0, ease: "none",
        scrollTrigger: { trigger: ".hero-intro", start: "40% top", end: "bottom top", scrub: 1 },
      });

      // ── 3. Post-GIF CTA ───────────────────────────────────────────────────
      gsap.to(".landing-postgif-cta__grid", {
        yPercent: -30, ease: "none",
        scrollTrigger: { trigger: ".landing-postgif-cta", start: "top bottom", end: "bottom top", scrub: 1.5 },
      });
      gsap.fromTo(".landing-postgif-cta__eyebrow",
        { opacity: 0, x: -28 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-postgif-cta", start: "top 82%", ...ST } });
      // Word-reveal on heading
      const postgifWords = splitWords(".landing-postgif-cta__heading");
      gsap.from(postgifWords, {
        yPercent: 110, opacity: 0, stagger: 0.055, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: ".landing-postgif-cta", start: "top 79%", ...ST },
      });
      gsap.fromTo(".landing-postgif-cta__sub",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-postgif-cta", start: "top 75%", ...ST } });
      gsap.fromTo(".landing-postgif-cta .postgif-cta-button",
        { opacity: 0, y: 36, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "back.out(1.8)",
          scrollTrigger: { trigger: ".landing-postgif-cta", start: "top 73%", ...ST } });

      // ── 4. Marquee — GSAP infinite loop ───────────────────────────────────
      gsap.to(".landing-marquee__track", {
        xPercent: -50, ease: "none", duration: 22, repeat: -1,
      });

      // ── 5. Stats ──────────────────────────────────────────────────────────
      // Spring entrance from center outward
      gsap.fromTo(".stat-item",
        { opacity: 0, y: 55, scale: 0.82 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9,
          stagger: { amount: 0.5, from: "center" },
          ease: "back.out(1.8)",
          scrollTrigger: { trigger: ".landing-stats", start: "top 82%", ...ST } });
      // Icon flip-in
      gsap.fromTo(".stat-item__icon",
        { rotateY: -90, opacity: 0 },
        { rotateY: 0, opacity: 1, duration: 0.7,
          stagger: { amount: 0.5, from: "center" },
          ease: "power3.out",
          scrollTrigger: { trigger: ".landing-stats", start: "top 80%", ...ST } });
      // Number counter — animate stat values that are pure integers
      gsap.utils.toArray(".stat-item__value").forEach((el) => {
        const num = parseInt(el.textContent, 10);
        const raw = el.textContent.trim();
        if (!isNaN(num) && raw === String(num)) {
          gsap.from(el, {
            textContent: 0, duration: 1.8, ease: "power2.out",
            snap: { textContent: 1 },
            scrollTrigger: { trigger: ".landing-stats", start: "top 80%", ...ST },
          });
        }
      });

      // ── 6. Terminal ───────────────────────────────────────────────────────
      gsap.fromTo(".landing-terminal .landing-features__eyebrow",
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-terminal", start: "top 82%", ...ST } });
      const terminalWords = splitWords(".landing-terminal .landing-features__heading");
      gsap.from(terminalWords, {
        yPercent: 110, opacity: 0, stagger: 0.045, duration: 0.75, ease: "power3.out",
        scrollTrigger: { trigger: ".landing-terminal", start: "top 80%", ...ST },
      });
      gsap.fromTo(".terminal-block",
        { opacity: 0, y: 60, scale: 0.96, rotateX: 4 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.3,
          ease: "power3.out", transformPerspective: 1200,
          scrollTrigger: { trigger: ".landing-terminal", start: "top 76%", ...ST } });
      gsap.fromTo(".terminal-line",
        { opacity: 0, x: -32 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: "power2.out",
          scrollTrigger: { trigger: ".terminal-block", start: "top 72%", ...ST } });
      gsap.to(".terminal-block__body", {
        yPercent: -4, ease: "none",
        scrollTrigger: { trigger: ".landing-terminal", start: "top bottom", end: "bottom top", scrub: 1.5 },
      });

      // ── 7. Features ───────────────────────────────────────────────────────
      gsap.fromTo(".landing-features .landing-features__eyebrow",
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-features", start: "top 82%", ...ST } });
      const featureWords = splitWords(".landing-features .landing-features__heading");
      gsap.from(featureWords, {
        yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: ".landing-features", start: "top 80%", ...ST },
      });

      // ── 8. Report preview ─────────────────────────────────────────────────
      gsap.fromTo(".landing-report .landing-features__eyebrow",
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-report", start: "top 82%", ...ST } });
      const reportWords = splitWords(".landing-report .landing-features__heading");
      gsap.from(reportWords, {
        yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".landing-report", start: "top 80%", ...ST },
      });
      gsap.fromTo(".report-preview",
        { opacity: 0, x: 55, y: 20, scale: 0.97, rotateY: -3 },
        { opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0, duration: 1.5,
          ease: "power3.out", transformPerspective: 1400,
          scrollTrigger: { trigger: ".landing-report", start: "top 76%", ...ST } });
      // Metric values count up
      gsap.utils.toArray(".report-metric__val").forEach((el) => {
        const num = parseInt(el.textContent, 10);
        if (!isNaN(num)) {
          gsap.from(el, {
            textContent: 0, duration: 1.6, ease: "power2.out",
            snap: { textContent: 1 },
            scrollTrigger: { trigger: ".report-preview", start: "top 78%", ...ST },
          });
        }
      });

      // ── 9. How it works ───────────────────────────────────────────────────
      gsap.fromTo(".landing-how .landing-features__eyebrow",
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-how", start: "top 82%", ...ST } });
      const howWords = splitWords(".landing-how .landing-features__heading");
      gsap.from(howWords, {
        yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".landing-how", start: "top 80%", ...ST },
      });
      gsap.utils.toArray(".how-step").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, x: i % 2 === 0 ? -80 : 80, y: 20, rotateY: i % 2 === 0 ? 8 : -8 },
          { opacity: 1, x: 0, y: 0, rotateY: 0, duration: 1.0,
            ease: "power3.out", transformPerspective: 1000,
            scrollTrigger: { trigger: el, start: "top 88%", ...ST } });
      });

      // ── 10. CTA section ───────────────────────────────────────────────────
      gsap.fromTo(".landing-cta__glow",
        { scale: 0.2, opacity: 0 },
        { scale: 1, opacity: 1, ease: "none",
          scrollTrigger: { trigger: ".landing-cta", start: "top bottom", end: "top 35%", scrub: 2 } });
      gsap.to(".landing-cta__grid", {
        yPercent: -20, ease: "none",
        scrollTrigger: { trigger: ".landing-cta", start: "top bottom", end: "bottom top", scrub: 1.5 },
      });
      gsap.fromTo(".landing-cta__badge",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: ".landing-cta", start: "top 82%", ...ST } });
      // CTA heading slides in as two lines from below (has <br/> so no word-split)
      gsap.fromTo(".landing-cta__heading",
        { opacity: 0, y: 80, scale: 0.93 },
        { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: "power3.out",
          scrollTrigger: { trigger: ".landing-cta", start: "top 80%", ...ST } });
      gsap.fromTo(".landing-cta__sub",
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.85, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-cta", start: "top 77%", ...ST } });
      gsap.fromTo(".landing-cta .postgif-cta-button",
        { opacity: 0, y: 40, scale: 0.90 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "back.out(1.8)",
          scrollTrigger: { trigger: ".landing-cta", start: "top 74%", ...ST } });
      gsap.fromTo(".landing-cta .cta-login-hint",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6,
          scrollTrigger: { trigger: ".landing-cta", start: "top 72%", ...ST } });

      // ── 11. Footer ────────────────────────────────────────────────────────
      gsap.fromTo(".landing-footer__brand-col",
        { opacity: 0, x: -48 },
        { opacity: 1, x: 0, duration: 1.0, ease: "power3.out",
          scrollTrigger: { trigger: ".landing-footer", start: "top 88%", ...ST } });
      gsap.fromTo(".landing-footer__col",
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: ".landing-footer", start: "top 86%", ...ST } });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing">

      <CursorTrail boundarySelector=".landing-postgif-cta" />

      <div className="scroll-progress-track">
        <div ref={progressRef} className="scroll-progress-bar" />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <Link to="/" className="landing-nav__brand">
          <Brain size={20} /> LazyCv
        </Link>
        <div className="landing-nav__actions">
          <Link to="/login" className="landing-nav__login">
            <LogIn size={15} /> Log in
          </Link>
          <Link to="/register" className="landing-nav__cta">
            Get Started <ArrowRight size={14} className="nav-cta-arrow" />
          </Link>
        </div>
      </nav>

      {/* ── Hero intro ──────────────────────────────────────────────── */}
      <section className="hero-intro">
        <div className="hero-intro__bg-grid" />
        <div className="hero-intro__glow" />
        <div className="hero-intro__content">
          <p className="hero-intro__eyebrow">
            Analyze.&nbsp;&nbsp;Prepare.&nbsp;&nbsp;Get Hired.
          </p>
          <h1 className="hero-intro__heading">
            Why are<br />
            you <span className="hero-intro__highlight">lazy?</span>
          </h1>
          <p className="hero-intro__sub">
            LazyCv does the hard work so you don't have to. Upload your resume,
            describe the role — get your full interview report in seconds.
          </p>
          <div className="hero-intro__social-proof">
            <div className="hero-intro__avatars">
              <span className="hero-intro__avatar">RK</span>
              <span className="hero-intro__avatar">AM</span>
              <span className="hero-intro__avatar">SP</span>
              <span className="hero-intro__avatar">LT</span>
            </div>
            <p className="hero-intro__social-text">
              <strong>500+</strong> interviews already prepped
            </p>
          </div>
          <Link to="/register" className="hero-intro__cta">
            <span className="hero-intro__cta-dot" />
            Get Your Free Report
            <ArrowRight size={22} className="btn-arrow" />
          </Link>
          <p className="hero-intro__cta-hint">
            ✓&nbsp;Free &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Results in 30 sec
          </p>
        </div>
      </section>

      <HeroScroll />
      <GifParallax />

      {/* ── Post-GIF CTA ─────────────────────────────────────────────── */}
      <div className="landing-postgif-cta" data-reveal>
        <div className="landing-postgif-cta__grid" />
        <p className="landing-postgif-cta__eyebrow">
          <Sparkles size={13} /> You've seen what it does
        </p>
        <h2 className="landing-postgif-cta__heading">
          Ready to see your own report?
        </h2>
        <p className="landing-postgif-cta__sub">
          Free to try. No credit card. Results in under 30 seconds.
        </p>
        <Link to="/register" className="postgif-cta-button">
          Get My Interview Report <ArrowUpRight size={16} className="btn-arrow" />
        </Link>
        <p className="landing-postgif-cta__hint">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

      {/* ── Marquee strip ───────────────────────────────────────────── */}
      <div className="landing-marquee" aria-hidden="true">
        <div className="landing-marquee__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="landing-marquee__group">
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="landing-marquee__item">
                  <span className="landing-marquee__dot">✦</span>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <section className="landing-stats">
        <div className="landing-stats__inner">
          {STATS.map((s, i) => (
            <div key={i} className="stat-item" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="stat-item__icon"><s.Icon size={22} /></div>
              <span className="stat-item__value">{s.value}</span>
              <span className="stat-item__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Terminal block ───────────────────────────────────────────── */}
      <section className="landing-terminal">
        <div className="landing-terminal__inner">
          <p className="landing-features__eyebrow">Under the hood</p>
          <h2 className="landing-features__heading">
            From upload to report in seconds
          </h2>
          <div className="terminal-block">
            <div className="terminal-block__bar">
              <span className="terminal-block__dot terminal-block__dot--red" />
              <span className="terminal-block__dot terminal-block__dot--yellow" />
              <span className="terminal-block__dot terminal-block__dot--green" />
              <span className="terminal-block__bar-title">lazycv — analyze</span>
            </div>
            <div className="terminal-block__body">
              <div className="terminal-line">
                <span className="terminal-line__prompt">$</span>
                <span className="terminal-line__cmd">lazycv analyze --resume resume.pdf --job "Senior Engineer, Stripe"</span>
              </div>
              <div className="terminal-line terminal-line--blank" />
              <div className="terminal-line">
                <span className="terminal-line__check">✓</span>
                <span className="terminal-line__text">Parsing resume &amp; extracting skills</span>
                <span className="terminal-line__time">0.3s</span>
              </div>
              <div className="terminal-line">
                <span className="terminal-line__check">✓</span>
                <span className="terminal-line__text">Matching against job description</span>
                <span className="terminal-line__time">0.8s</span>
              </div>
              <div className="terminal-line">
                <span className="terminal-line__check">✓</span>
                <span className="terminal-line__text">Generating 12 tailored interview questions</span>
                <span className="terminal-line__time">1.1s</span>
              </div>
              <div className="terminal-line">
                <span className="terminal-line__check">✓</span>
                <span className="terminal-line__text">Identifying skill gaps &amp; ranking by impact</span>
                <span className="terminal-line__time">0.4s</span>
              </div>
              <div className="terminal-line">
                <span className="terminal-line__check">✓</span>
                <span className="terminal-line__text">Building 7-day personalised prep roadmap</span>
                <span className="terminal-line__time">0.2s</span>
              </div>
              <div className="terminal-line terminal-line--blank" />
              <div className="terminal-line terminal-line--result">
                <span className="terminal-line__label">Match Score</span>
                <span className="terminal-line__score">84%</span>
                <span className="terminal-line__bar">████████░░</span>
              </div>
              <div className="terminal-line terminal-line--output">
                <span className="terminal-line__arrow">→</span>
                <span className="terminal-line__text">Report ready at</span>
                <span className="terminal-line__path">/dashboard/report-2kx9p</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="landing-features__inner">
          <p className="landing-features__eyebrow">What you get</p>
          <h2 className="landing-features__heading">
            Everything you need to ace the interview
          </h2>
        </div>
        <VideoMarquee />
      </section>

      {/* ── Sample report preview ────────────────────────────────────── */}
      <section className="landing-report">
        <div className="landing-report__inner">
          <p className="landing-features__eyebrow">Sample output</p>
          <h2 className="landing-features__heading">
            This is what lands in your dashboard
          </h2>
          <div className="report-preview">
            <div className="report-preview__header">
              <div className="report-preview__title">
                <FileBarChart size={16} />
                <span>Interview Report</span>
                <span className="report-preview__dot" />
                <span className="report-preview__live">Generated just now</span>
              </div>
              <span className="report-preview__role">Software Engineer · Stripe</span>
            </div>
            <div className="report-preview__metrics">
              <div className="report-metric report-metric--primary">
                <span className="report-metric__val">84<span className="report-metric__unit">%</span></span>
                <span className="report-metric__label">Match Score</span>
                <div className="report-metric__bar">
                  <div className="report-metric__fill" style={{ width: "84%" }} />
                </div>
              </div>
              <div className="report-metric">
                <span className="report-metric__val">12</span>
                <span className="report-metric__label">Interview Questions</span>
                <span className="report-metric__sub">5 technical · 7 behavioural</span>
              </div>
              <div className="report-metric">
                <span className="report-metric__val">4</span>
                <span className="report-metric__label">Skill Gaps Found</span>
                <span className="report-metric__sub">ranked by impact</span>
              </div>
              <div className="report-metric">
                <span className="report-metric__val">7</span>
                <span className="report-metric__label">Day Prep Plan</span>
                <span className="report-metric__sub">day-by-day roadmap</span>
              </div>
            </div>
            <div className="report-preview__gaps">
              <p className="report-preview__section-label">
                <AlertTriangle size={13} /> Top skill gaps to address
              </p>
              <div className="gap-list">
                {SAMPLE_GAPS.map((g) => (
                  <div key={g.skill} className="gap-row">
                    <span className="gap-row__label">{g.skill}</span>
                    <div className="gap-row__track">
                      <div className="gap-row__fill" style={{ width: `${g.gap}%` }} />
                    </div>
                    <span className="gap-row__pct">{g.gap}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="landing-how">
        <div className="landing-how__inner">
          <p className="landing-features__eyebrow">How it works</p>
          <h2 className="landing-features__heading">Three steps to interview-ready</h2>
          <div className="landing-how__steps">
            {STEPS.map((s, i) => (
              <div key={s.n} className="how-step" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className="how-step__header">
                  <span className="how-step__number">{s.n}</span>
                  <div className="how-step__step-icon"><s.Icon size={18} /></div>
                </div>
                <h3 className="how-step__title">{s.title}</h3>
                <p className="how-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="landing-cta__glow" />
        <div className="landing-cta__grid" />
        <div className="landing-cta__inner">
          <span className="landing-cta__badge">
            <Sparkles size={12} /> Free to try
          </span>
          <h2 className="landing-cta__heading">
            Stop guessing.<br />Start preparing.
          </h2>
          <p className="landing-cta__sub">
            Upload your resume, describe the role — get a full interview report in under 30 seconds. No credit card required.
          </p>
          <Link to="/register" className="postgif-cta-button">
            Get My Interview Report <ArrowUpRight size={16} className="btn-arrow" />
          </Link>
          <p className="cta-login-hint">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer__grid" />
        <div className="landing-footer__inner">
          <div className="landing-footer__brand-col">
            <Link to="/" className="landing-footer__brand">
              <Brain size={20} /> LazyCv
            </Link>
            <p className="landing-footer__tagline">
              AI-powered interview preparation.<br />Built to get you hired.
            </p>
            <div className="landing-footer__social">
              <a href="#" className="landing-footer__social-link" aria-label="GitHub"><Github size={16} /></a>
              <a href="#" className="landing-footer__social-link" aria-label="Twitter"><Twitter size={16} /></a>
              <a href="#" className="landing-footer__social-link" aria-label="LinkedIn"><Linkedin size={16} /></a>
            </div>
          </div>
          <div className="landing-footer__col">
            <p className="landing-footer__col-heading">Product</p>
            <Link to="/register" className="landing-footer__link">Get Started</Link>
            <Link to="/login"    className="landing-footer__link">Log In</Link>
            <Link to="/app"      className="landing-footer__link">Dashboard</Link>
          </div>
          <div className="landing-footer__col">
            <p className="landing-footer__col-heading">Features</p>
            <span className="landing-footer__link">Resume Match Score</span>
            <span className="landing-footer__link">Interview Questions</span>
            <span className="landing-footer__link">Skill Gap Roadmap</span>
            <span className="landing-footer__link">Prep Roadmap</span>
          </div>
          <div className="landing-footer__col">
            <p className="landing-footer__col-heading">Company</p>
            <span className="landing-footer__link">About</span>
            <span className="landing-footer__link">Privacy Policy</span>
            <span className="landing-footer__link">Terms of Service</span>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <p className="landing-footer__copy">© 2026 LazyCv. All rights reserved.</p>
          <p className="landing-footer__copy">
            Built with <Heart size={12} style={{ color: "#00ff88", display: "inline", verticalAlign: "middle" }} /> by Rudra_CSER.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
