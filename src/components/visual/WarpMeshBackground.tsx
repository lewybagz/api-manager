import { useEffect, useRef } from "react";

/**
 * WarpMeshBackground
 * A warping lattice of grid points deformed by overlapping sine waves.
 * Fills the canvas evenly — no center focus.
 *
 * Usage:
 *   <div className="relative min-h-screen">
 *     <WarpMeshBackground />
 *     <YourContent className="relative z-10" />
 *   </div>
 */

const BG_COLOR = "#07060F";
const VIOLET = "108,80,255";
const TEAL = "60,190,180";
const COLS = 24;
const ROWS = 15;

export default function WarpMeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const c = el.getContext("2d");
    if (!c) return;

    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = c;

    let rafId = 0;
    let t = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    function pt(col: number, row: number, W: number, H: number) {
      const bx = (col / (COLS - 1)) * W;
      const by = (row / (ROWS - 1)) * H;
      const dx =
        Math.sin(t * 0.55 + row * 0.52 + col * 0.31) * 22 +
        Math.sin(t * 0.28 + col * 0.7) * 11 +
        Math.cos(t * 0.43 + row * 0.4 + col * 0.19) * 8;
      const dy =
        Math.cos(t * 0.48 + col * 0.52 + row * 0.31) * 22 +
        Math.cos(t * 0.35 + row * 0.7) * 11 +
        Math.sin(t * 0.61 + col * 0.4) * 8;
      return { x: bx + dx, y: by + dy };
    }

    function frame() {
      const W = canvas.width;
      const H = canvas.height;
      t += 0.005;

      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.lineWidth = 0.65;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const p = pt(col, row, W, H);

          if (col < COLS - 1) {
            const p2 = pt(col + 1, row, W, H);
            const w = (Math.sin(t * 0.9 + row * 0.45 + col * 0.28) + 1) / 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${w > 0.55 ? VIOLET : TEAL},${0.028 + w * 0.06})`;
            ctx.stroke();
          }

          if (row < ROWS - 1) {
            const p2 = pt(col, row + 1, W, H);
            const w = (Math.cos(t * 0.75 + col * 0.45 + row * 0.28) + 1) / 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${VIOLET},${0.025 + w * 0.05})`;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: BG_COLOR,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
