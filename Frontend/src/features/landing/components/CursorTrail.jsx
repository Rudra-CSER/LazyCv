import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Mouse-following SVG path-draw cursor trail.
 * Active only while the cursor is above `boundarySelector` element.
 * Uses strokeDashoffset animation to draw/erase the path in theme green.
 */
const CursorTrail = ({ boundarySelector = ".landing-postgif-cta" }) => {
  const pathRef = useRef(null);
  const pts     = useRef([]);
  const timer   = useRef(null);
  const ticking = useRef(false);
  const last    = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const path = pathRef.current;
    const MAX  = 68; // max points in the rolling buffer

    // ── helpers ──────────────────────────────────────────────────────────
    const getBoundaryY = () => {
      const el = document.querySelector(boundarySelector);
      if (!el) return Infinity;
      return el.getBoundingClientRect().top + window.scrollY;
    };

    const buildD = (p) => {
      if (p.length < 2) return "";
      let d = `M ${p[0].x} ${p[0].y}`;
      for (let i = 1; i < p.length - 1; i++) {
        const cx = (p[i].x + p[i + 1].x) / 2;
        const cy = (p[i].y + p[i + 1].y) / 2;
        d += ` Q ${p[i].x} ${p[i].y} ${cx} ${cy}`;
      }
      const l = p[p.length - 1];
      d += ` L ${l.x} ${l.y}`;
      return d;
    };

    const erase = () => {
      const d = path.getAttribute("d");
      if (!d) return;
      const len = path.getTotalLength();
      gsap.to(path, {
        strokeDashoffset: len,
        opacity: 0,
        duration: 0.55,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => {
          pts.current = [];
          path.setAttribute("d", "");
          gsap.set(path, { strokeDashoffset: 0, opacity: 0.65 });
        },
      });
    };

    const scheduleErase = () => {
      if (timer.current) timer.current.kill();
      timer.current = gsap.delayedCall(0.42, erase);
    };

    const redraw = () => {
      ticking.current = false;
      const d = buildD(pts.current);
      if (!d) return;
      path.setAttribute("d", d);
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: 0, opacity: 0.65 });
    };

    // ── mousemove handler ─────────────────────────────────────────────────
    const onMove = (e) => {
      last.current = { x: e.clientX, y: e.clientY };

      // Deactivate past the boundary element
      if (window.scrollY + e.clientY > getBoundaryY()) {
        if (pts.current.length > 0) {
          pts.current = [];
          erase();
        }
        return;
      }

      // Kill pending erase
      if (timer.current) timer.current.kill();
      gsap.killTweensOf(path);

      pts.current.push({ x: e.clientX, y: e.clientY });
      if (pts.current.length > MAX) pts.current.shift();

      // RAF-throttle DOM writes
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(redraw);
      }

      scheduleErase();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (timer.current) timer.current.kill();
      gsap.killTweensOf(path);
    };
  }, [boundarySelector]);

  return (
    <svg
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 149, // below navbar (100) would hide it behind nav; 149 sits above content, below scroll bar (200)
        overflow: "visible",
      }}
    >
      <path
        ref={pathRef}
        fill="none"
        stroke="#00ff88"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity: 0.65,
          filter: "drop-shadow(0 0 6px rgba(0,255,136,0.65))",
        }}
      />
    </svg>
  );
};

export default CursorTrail;
