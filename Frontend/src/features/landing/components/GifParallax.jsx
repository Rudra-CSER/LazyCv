import { useRef, useEffect, useCallback } from "react";
import { ArrowDown } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 63;
// Outer wrapper is 300 vh, margin-top: -100 vh overlaps HeroScroll's last 100 vh.
// maxScroll = (300 - 100)vh = 200vh. First ~50 % of that scroll is inside the
// HeroScroll overlap zone, so timings are calibrated accordingly.
const ENTER_END    = 0.50;  // container fully in view by 50 % scroll (= 100 vh, end of overlap)
const ANIM_START   = 0.42;  // frames start when container has risen to ~85 % of viewport (0.85 × ENTER_END)
const ANIM_END     = 0.95;  // last frame at this progress

const frameUrl = (i) =>
  `/How_it_works/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

// ── Component ─────────────────────────────────────────────────────────────────
const GifParallax = () => {
  const wrapRef        = useRef(null);  // outer 300-vh div — provides scroll space
  const containerRef   = useRef(null);  // translateY-animated div
  const canvasRef      = useRef(null);
  const loadingRef     = useRef(null);
  const scrollHintRef  = useRef(null);  // fixed "Scroll to explore" hint

  const imagesRef    = useRef([]);
  const loadedRef    = useRef(0);
  const lastFrameRef = useRef(-1);

  // ── Preload all GIF frames ──────────────────────────────────────────────
  useEffect(() => {
    const images = new Array(TOTAL_FRAMES);

    const onSettle = () => {
      loadedRef.current++;
      if (loadedRef.current === TOTAL_FRAMES && loadingRef.current) {
        loadingRef.current.style.display = "none";
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img   = new Image();
      img.onload  = onSettle;
      img.onerror = onSettle; // count failures too — loading screen always clears
      img.src     = frameUrl(i + 1);
      images[i]   = img;
    }
    imagesRef.current = images;
  }, []);

  // ── Canvas sizing — keep canvas pixel dimensions in sync with CSS size ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const renderFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    const img    = imagesRef.current[index];
    if (!canvas || !img?.complete || !img?.naturalWidth) return;
    const scale = Math.min(
      canvas.width  / img.naturalWidth,
      canvas.height / img.naturalHeight,
    );
    const x   = (canvas.width  - img.naturalWidth  * scale) / 2;
    const y   = (canvas.height - img.naturalHeight * scale) / 2;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
  }, []);

  // ── Window scroll → parallax slide-in + frame animation ───────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onScroll = () => {
      const rect      = wrap.getBoundingClientRect();
      const scrolled  = -rect.top;
      const maxScroll = wrap.offsetHeight - window.innerHeight; // 200vh in px

      if (scrolled < -window.innerHeight || scrolled > maxScroll + window.innerHeight) return;

      const p = Math.max(0, Math.min(1, scrolled / maxScroll)); // 0 → 1

      // ── Parallax slide-in: translateY 100vh → 0 over [0, ENTER_END] ──────
      // Cubic ease-out so entry decelerates gently instead of popping in.
      const cnt = containerRef.current;
      if (cnt) {
        const ep       = Math.max(0, Math.min(1, p / ENTER_END));
        const epEased  = 1 - Math.pow(1 - ep, 3);
        const yVh      = ((1 - epEased) * 100).toFixed(2);
        cnt.style.transform = `translateY(${yVh}vh)`;
      }

      // ── Canvas opacity fade-in (smoothstep, completes before ENTER_END) ──
      const canvas = canvasRef.current;
      if (canvas) {
        const ft = Math.max(0, Math.min(1, p / (ENTER_END * 0.75)));
        const op = ft * ft * (3 - 2 * ft);
        canvas.style.opacity = op.toFixed(3);
      }

      // ── Frame animation — starts at ANIM_START (canvas ~50 % visible) ────
      if (p >= ANIM_START) {
        const ap = Math.max(0, Math.min(1, (p - ANIM_START) / (ANIM_END - ANIM_START)));
        const fi = Math.min(Math.round(ap * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
        if (fi !== lastFrameRef.current) {
          lastFrameRef.current = fi;
          renderFrame(fi);
        }
      } else if (lastFrameRef.current !== -1 && canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        lastFrameRef.current = -1;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [renderFrame]);

  // ── Toggle scroll hint based on whether terminal section is in view ─────
  // Hide when .landing-terminal enters viewport; re-show when user scrolls
  // back above it (boundingClientRect.top > 0 = section is below viewport).
  useEffect(() => {
    const target = document.querySelector(".landing-terminal");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const hint = scrollHintRef.current;
        if (!hint) return;
        if (entry.isIntersecting) {
          hint.style.display = "none";
        } else if (entry.boundingClientRect.top > 0) {
          // Terminal scrolled back below viewport — user is above it again
          hint.style.display = "flex";
        }
        // Terminal above viewport (user scrolled past) — keep hidden
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
    {/* Fixed scroll hint — visible from page load, hides when GIF finishes */}
    <button
      ref={scrollHintRef}
      className="gif-scroll-hint"
      onClick={(e) => {
        document.querySelector(".landing-terminal")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        e.currentTarget.style.display = "none";
      }}
    >
      <span>Scroll to explore</span>
      <ArrowDown size={16} />
    </button>

    {/* ── Outer wrapper — gives the browser a 300-vh scroll range ────────── */}
    <div ref={wrapRef} className="gif-parallax-wrap">
      {/*
        Sticky shell — stays visible throughout 300 vh.
        overflow:hidden clips the slide-in animation from below.
      */}
      <div className="gif-parallax-sticky">
        {/* This div translates from translateY(100vh) → 0 as user scrolls */}
        <div ref={containerRef} className="gif-parallax-container">
          {/*
            Fixed-aspect-ratio screen box — prevents GIF from stretching
            on portrait mobile devices.
          */}
          <div className="gif-parallax-screen">
            <canvas
              ref={canvasRef}
              className="gif-parallax-canvas"
              style={{ opacity: 0 }}
            />
            <div className="gif-parallax-vignette" />
            <div ref={loadingRef} className="gif-loading">
              <div className="gif-loading__spinner" />
              <span>Loading experience…</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default GifParallax;
