import { useEffect, useRef } from "react";

/**
 * Draws animated topographic / contour lines on a full-screen canvas.
 *
 * Props:
 *   variant — "default" (green, home/interview pages) | "auth" (violet, login/register)
 */
const AnimatedBackground = ({ variant = "default" }) => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let t        = 0;

    const isAuth = variant === "auth";

    // ── resize ──────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── helpers ─────────────────────────────────────────────────
    const field = (x, y, time) => {
      const nx = x / canvas.width;
      const ny = y / canvas.height;
      if (isAuth) {
        // Auth variant: slower, more circular/radial waves
        return (
          Math.sin(nx * 2.5 + time * 0.18) * 0.28 +
          Math.sin(ny * 3.1 - time * 0.14) * 0.28 +
          Math.sin((nx + ny) * 3.8 + time * 0.22) * 0.22 +
          Math.cos((nx - ny) * 2.2 - time * 0.10) * 0.14 +
          Math.sin(nx * 5.0 - ny * 1.8 + time * 0.08) * 0.10 +
          Math.cos(nx * 1.2 + ny * 4.5 - time * 0.20) * 0.08
        );
      }
      // Default: original home/interview field
      return (
        Math.sin(nx * 3.8 + time * 0.28) * 0.30 +
        Math.sin(ny * 4.2 - time * 0.22) * 0.30 +
        Math.sin((nx + ny) * 2.9 + time * 0.18) * 0.20 +
        Math.cos((nx - ny) * 3.5 - time * 0.15) * 0.15 +
        Math.sin(nx * 1.5 + ny * 2.1 + time * 0.10) * 0.12 +
        Math.cos(nx * 6.0 - time * 0.35) * 0.06
      );
    };

    // ── marching squares (1-D iso-contour) ──────────────────────
    const drawContour = (level, alpha, lineWidth, glowRadius) => {
      const step = 7;
      const cols = Math.ceil(canvas.width  / step) + 1;
      const rows = Math.ceil(canvas.height / step) + 1;

      ctx.beginPath();

      for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
          const x0 = col * step, y0 = row * step;
          const x1 = x0 + step,  y1 = y0 + step;

          const v00 = field(x0, y0, t) - level;
          const v10 = field(x1, y0, t) - level;
          const v01 = field(x0, y1, t) - level;
          const v11 = field(x1, y1, t) - level;

          const lerp = (a, b, va, vb) => a + (b - a) * (-va / (vb - va));

          const edges = [];
          if (v00 * v10 < 0) edges.push([lerp(x0, x1, v00, v10), y0]);
          if (v10 * v11 < 0) edges.push([x1, lerp(y0, y1, v10, v11)]);
          if (v01 * v11 < 0) edges.push([lerp(x0, x1, v01, v11), y1]);
          if (v00 * v01 < 0) edges.push([x0, lerp(y0, y1, v00, v01)]);

          if (edges.length === 2) {
            ctx.moveTo(edges[0][0], edges[0][1]);
            ctx.lineTo(edges[1][0], edges[1][1]);
          }
        }
      }

      const color = "0,255,136"; // green across all variants

      if (glowRadius > 0) {
        ctx.shadowBlur  = glowRadius;
        ctx.shadowColor = `rgba(${color},${alpha * 0.8})`;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth   = lineWidth;
      ctx.lineCap     = "round";
      ctx.stroke();
    };

    // ── render loop ─────────────────────────────────────────────
    const DEFAULT_LEVELS = [
      [-0.60, 0.030, 0.7, 0],
      [-0.45, 0.038, 0.7, 0],
      [-0.30, 0.045, 0.8, 0],
      [-0.15, 0.055, 0.8, 0],
      [ 0.00, 0.065, 0.9, 0],
      [ 0.10, 0.080, 1.0, 4],
      [ 0.20, 0.055, 0.8, 0],
      [ 0.35, 0.045, 0.8, 0],
      [ 0.50, 0.035, 0.7, 0],
      [ 0.62, 0.025, 0.6, 0],
    ];

    // Auth: fewer, bolder contours — "portal" feel
    const AUTH_LEVELS = [
      [-0.55, 0.025, 0.6, 0],
      [-0.35, 0.035, 0.7, 0],
      [-0.15, 0.048, 0.8, 0],
      [ 0.00, 0.060, 0.9, 0],
      [ 0.12, 0.085, 1.1, 5],  // bright accent
      [ 0.28, 0.055, 0.8, 0],
      [ 0.45, 0.035, 0.7, 0],
      [ 0.60, 0.022, 0.6, 0],
    ];

    const LEVELS = isAuth ? AUTH_LEVELS : DEFAULT_LEVELS;

    const render = () => {
      // Background
      const grad = ctx.createLinearGradient(0, 0, canvas.width * 0.6, canvas.height);
      grad.addColorStop(0,   "#060d0a");
      grad.addColorStop(0.5, "#07120f");
      grad.addColorStop(1,   "#040c0a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient glow
      // Auth: glow centred-left; default: top-right
      const [gx, gy] = isAuth
        ? [canvas.width * 0.25, canvas.height * 0.55]
        : [canvas.width * 0.82, canvas.height * 0.18];

      const radial = ctx.createRadialGradient(gx, gy, 0, gx, gy, canvas.width * 0.42);
      radial.addColorStop(0,   "rgba(0,255,136,0.10)");
      radial.addColorStop(0.5, "rgba(0,200,100,0.03)");
      radial.addColorStop(1,   "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Contours
      ctx.save();
      for (const [level, alpha, width, glow] of LEVELS) {
        drawContour(level, alpha, width, glow);
      }
      ctx.restore();

      t += isAuth ? 0.006 : 0.008;
      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [variant]); // re-init if variant changes

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
};

export default AnimatedBackground;
