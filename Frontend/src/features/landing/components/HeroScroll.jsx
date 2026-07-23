import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── Container height ──────────────────────────────────────────────────────────
// 450 vh gives ~350 vh of scroll distance for the 4 text slides.
const CONTAINER_VH = 450;

// ── Slide data ────────────────────────────────────────────────────────────────
// Timings rescaled from original (0–0.52) to fill the full 0–1 range so every
// slide has generous scroll breathing-room.
//
// bgNumMode controls each number's animation:
//   "sweep-down"  — 01 falls from top → bottom while text stays put
//   "sweep-up"    — 02 rises from bottom → top (mirror of 01)
//   "scale"       — 03 grows in from 0.55× as the slide enters
const SLIDES = [
  {
    start: 0.00, peak: 0.07, hold: 0.19, end: 0.23,
    bgNum: null, bgNumOpacity: 0,
    label: "Welcome",
    heading: ["LazyCv."],
    sub: "Your AI-powered interview co-pilot.",
    align: "center", accent: true,
  },
  {
    // Feature 01 — right-center; "01" sweeps top → bottom
    start: 0.23, peak: 0.33, end: 0.44,
    bgNum: "01", bgNumOpacity: 0.35, bgNumLeft: "26%", bgNumMode: "sweep-down",
    label: "Feature 01",
    heading: ["AI-Powered", "Analysis."],
    sub: "Upload your resume — get instant, deep insights.",
    align: "right", accent: false,
  },
  {
    // Feature 02 — left-center; "02" sweeps bottom → top
    start: 0.44, peak: 0.54, end: 0.65,
    bgNum: "02", bgNumOpacity: 0.35, bgNumLeft: "64%", bgNumMode: "sweep-up",
    label: "Feature 02",
    heading: ["Know Your", "Skill Gaps."],
    sub: "Pinpoint exactly what's holding you back.",
    align: "left", accent: false,
  },
  {
    // Slide 03 — "03" scales up on the left as "Ready to Start?" fades in
    start: 0.65, peak: 0.71, hold: 0.83, end: 1.00,
    bgNum: "03", bgNumOpacity: 0.20, bgNumLeft: "28%", bgNumMode: "scale",
    par: { bgNum: 0.66, label: 0.61, heading: 0.56, sub: 0.50 },
    label: "Get Started",
    heading: ["Ready to", "Start?"],
    sub: "Join thousands who landed their dream roles.",
    align: "center", accent: true,
  },
];

// ── Parallax depth multipliers ────────────────────────────────────────────────
const PARALLAX = { bgNum: 1.80, label: 0.90, heading: 0.42, sub: 0.10 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function slideOpacity(slide, p) {
  if (p <= slide.start || p >= slide.end) return 0;
  if (p <= slide.peak) return (p - slide.start) / (slide.peak - slide.start);
  const holdEnd = slide.hold ?? slide.peak;
  if (p <= holdEnd) return 1;
  return 1 - (p - holdEnd) / (slide.end - holdEnd);
}

function enterPct(slide, p) {
  if (slide.peak <= slide.start) return p >= slide.start ? 1 : 0;
  return Math.max(0, Math.min(1, (p - slide.start) / (slide.peak - slide.start)));
}

function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

// ── Component ─────────────────────────────────────────────────────────────────
const HeroScroll = () => {
  const containerRef = useRef(null);

  const slideRefs   = useRef([]);
  const labelRefs   = useRef([]);
  const headingRefs = useRef([]);
  const subRefs     = useRef([]);
  const bgNumRefs   = useRef([]);

  const fillRefs = useRef([null, null]);
  const tiltRef  = useRef(null);

  // ── Master scroll driver ──────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.config({ ignoreMobileResize: true });

      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end:   "bottom bottom",

        onUpdate(self) {
          const p = self.progress;

          // Stagger offset between text layers (in progress units).
          // Label enters first, heading follows, sub last.
          // Exit order is reversed: sub leaves first, label leaves last.
          const STAG = 0.018;

          slideRefs.current.forEach((el, i) => {
            if (!el) return;
            const slide = SLIDES[i];
            const delta = (p - slide.peak) * window.innerHeight;

            // Parent wrapper — only used for layout, not opacity
            el.style.opacity = 1;

            const lEl  = labelRefs.current[i];
            const hEl  = headingRefs.current[i];
            const sEl  = subRefs.current[i];
            const bnEl = bgNumRefs.current[i];

            const par  = slide.par ?? PARALLAX;
            const bnOp = slide.bgNumOpacity ?? 0.85;

            // Build per-element slide descriptors with staggered enter + exit timing
            const holdBase = slide.hold ?? slide.peak;

            const slideL = slide;
            const slideH = {
              ...slide,
              start: slide.start + STAG,
              peak:  Math.min(slide.peak  + STAG, holdBase - STAG),
              hold:  slide.hold != null ? holdBase - STAG        : undefined,
              end:   slide.end  - STAG,
            };
            const slideS = {
              ...slide,
              start: slide.start + STAG * 2,
              peak:  Math.min(slide.peak  + STAG * 2, holdBase - STAG * 2),
              hold:  slide.hold != null ? holdBase - STAG * 2    : undefined,
              end:   slide.end  - STAG * 2,
            };

            // Enter progress for each element (0→1 during its personal enter window)
            const epL = smoothstep(Math.max(0, Math.min(1,
              (p - slideL.start) / Math.max(0.001, slideL.peak - slideL.start))));
            const epH = smoothstep(Math.max(0, Math.min(1,
              (p - slideH.start) / Math.max(0.001, slideH.peak - slideH.start))));
            const epS = smoothstep(Math.max(0, Math.min(1,
              (p - slideS.start) / Math.max(0.001, slideS.peak - slideS.start))));

            // Y rise-from-below on enter (settles to 0 when fully in)
            const riseL = (1 - epL) * 26;
            const riseH = (1 - epH) * 40;
            const riseS = (1 - epS) * 26;

            if (lEl) {
              lEl.style.opacity   = slideOpacity(slideL, p).toFixed(3);
              lEl.style.transform = `translateY(${delta * par.label   + riseL}px)`;
            }
            if (hEl) {
              hEl.style.opacity   = slideOpacity(slideH, p).toFixed(3);
              hEl.style.transform = `translateY(${delta * par.heading + riseH}px)`;
            }
            if (sEl) {
              sEl.style.opacity   = slideOpacity(slideS, p).toFixed(3);
              sEl.style.transform = `translateY(${delta * par.sub     + riseS}px)`;
            }

            if (bnEl) {
              const mode   = slide.bgNumMode ?? "parallax";
              const tSlide = slide.end > slide.start
                ? Math.max(0, Math.min(1, (p - slide.start) / (slide.end - slide.start)))
                : 0;

              bnEl.style.opacity = (slideOpacity(slide, p) * bnOp).toFixed(3);

              if (mode === "sweep-down") {
                const yVh = (-70 + tSlide * 140).toFixed(1);
                bnEl.style.transform = `translateX(-50%) translateY(calc(-50% + ${yVh}vh))`;
              } else if (mode === "sweep-up") {
                const yVh = (70 - tSlide * 140).toFixed(1);
                bnEl.style.transform = `translateX(-50%) translateY(calc(-50% + ${yVh}vh))`;
              } else if (mode === "scale") {
                const ep    = smoothstep(enterPct(slide, p));
                const scale = (0.55 + ep * 0.45).toFixed(3);
                bnEl.style.transform = `translateX(-50%) translateY(-50%) scale(${scale})`;
              } else {
                bnEl.style.transform =
                  `translateX(-50%) translateY(calc(-50% + ${delta * par.bgNum}px))`;
              }
            }
          });

          // Fill swipers — slides 1 & 2
          [1, 2].forEach((idx) => {
            const fill = fillRefs.current[idx - 1];
            if (!fill) return;
            fill.style.transform = `scaleX(${enterPct(SLIDES[idx], p)})`;
            fill.style.opacity   = slideOpacity(SLIDES[idx], p) > 0
              ? slideOpacity(SLIDES[idx], p) : 0;
          });
        },
      });
    }, container);

    return () => ctx.revert();
  }, []); // eslint-disable-line

  // ── Slide 3: 3D tilt on hover ─────────────────────────────────────────────
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const rx   = ((e.clientY - cy) / (rect.height / 2)) * -14;
      const ry   = ((e.clientX - cx) / (rect.width  / 2)) *  14;
      gsap.to(el, {
        rotateX: rx, rotateY: ry,
        duration: 0.35, ease: "power2.out",
        transformPerspective: 700, overwrite: "auto",
      });
    };

    const onLeave = () => {
      gsap.to(el, {
        rotateX: 0, rotateY: 0,
        duration: 0.8, ease: "elastic.out(1, 0.45)",
        transformPerspective: 700, overwrite: "auto",
      });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-scroll"
      style={{ height: `${CONTAINER_VH}vh` }}
    >
      <div className="hero-sticky">

        {/* Large background wordmarks */}
        {SLIDES.map((slide, i) =>
          slide.bgNum ? (
            <div
              key={`bgn-${i}`}
              ref={(el) => (bgNumRefs.current[i] = el)}
              className="hero-bg-num"
              style={{ opacity: 0, left: slide.bgNumLeft ?? "50%" }}
            >
              {slide.bgNum}
            </div>
          ) : null
        )}

        {/* Text slides */}
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            ref={(el) => (slideRefs.current[i] = el)}
            className={`hero-slide hero-slide--${slide.align}`}
          >
            {(i === 1 || i === 2) && (
              <div
                ref={(el) => (fillRefs.current[i - 1] = el)}
                className="hero-slide__fill"
              />
            )}

            {i === 3 ? (
              <div ref={tiltRef} className="hero-slide__tilt-wrap">
                <span ref={(el) => (labelRefs.current[i] = el)} className="hero-slide__label">
                  {slide.label}
                </span>
                <h1
                  ref={(el) => (headingRefs.current[i] = el)}
                  className={`hero-slide__heading${slide.accent ? " hero-slide__heading--accent" : ""}`}
                >
                  {slide.heading.map((line, li) => (
                    <span key={li} className="hero-slide__line">{line}</span>
                  ))}
                </h1>
                <p ref={(el) => (subRefs.current[i] = el)} className="hero-slide__sub">
                  {slide.sub}
                </p>
              </div>
            ) : (
              <>
                <span ref={(el) => (labelRefs.current[i] = el)} className="hero-slide__label">
                  {slide.label}
                </span>
                <h1
                  ref={(el) => (headingRefs.current[i] = el)}
                  className={`hero-slide__heading${slide.accent ? " hero-slide__heading--accent" : ""}`}
                >
                  {slide.heading.map((line, li) => (
                    <span key={li} className="hero-slide__line">{line}</span>
                  ))}
                </h1>
                <p ref={(el) => (subRefs.current[i] = el)} className="hero-slide__sub">
                  {slide.sub}
                </p>
              </>
            )}
          </div>
        ))}

      </div>
    </div>
  );
};

export default HeroScroll;
