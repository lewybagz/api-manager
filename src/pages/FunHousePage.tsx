import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Stage = "idle" | "glitch" | "jitter" | "corrupt" | "lock" | "blackout";

const FunHousePage: React.FC = () => {
  const [stage, setStage] = useState<Stage>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [showFakeModal, setShowFakeModal] = useState(false);
  const [glitchOn] = useState(false);
  const [restoreCountdown, setRestoreCountdown] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const timersRef = useRef<number[]>([]);
  const restoreBtnRef = useRef<HTMLButtonElement | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const startBreak = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setStage("glitch");

    timersRef.current.push(window.setTimeout(() => setStage("jitter"), 2000));
    timersRef.current.push(
      window.setTimeout(() => {
        setStage("corrupt");
        setShowFakeModal(true);
      }, 5000)
    );
    timersRef.current.push(window.setTimeout(() => setStage("lock"), 8000));
    timersRef.current.push(
      window.setTimeout(() => setStage("blackout"), 10000)
    );
  }, [isRunning]);

  const restore = useCallback(() => {
    if (restoreCountdown > 0) return; // Prevent multiple clicks during countdown

    setRestoreCountdown(30);
    const countdownInterval = setInterval(() => {
      setRestoreCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearTimers();
          setShowFakeModal(false);
          setStage("idle");
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimers, restoreCountdown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === "blackout") {
        restore();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, restore]);

  useEffect(() => {
    if (stage === "blackout") {
      // Focus the restore button for accessibility
      const id = window.setTimeout(() => {
        restoreBtnRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(id);
    }
  }, [stage]);

  const containerClass = useMemo(() => {
    const base = "relative min-h-[60vh] p-6";
    if (stage === "glitch") return base + " fh-glitch";
    if (stage === "jitter") return base + " fh-jitter fh-blur";
    if (stage === "corrupt") return base + " fh-jitter fh-blur fh-tint";
    if (stage === "lock") return base + " fh-dim pointer-events-none";
    return base;
  }, [stage]);

  return (
    <div className="pw-theme">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl">How TF Did You Get Here?</h1>
          <div className="text-sm text-[color:var(--pw-muted)] mt-4">
            {showFullText ? (
              <div>
                <p className="mb-4">
                  Who’s in my bed? <br /> Integer efficitur tellus nibh, ut
                  maximus ipsum sodales id. Duis aliquam, leo et laoreet
                  eleifend, nisl est gravida eros, ac ornare eros nulla a nisl.
                  Quisque nisl mauris, varius in tincidunt eget, feugiat eget
                  nisl. Duis nunc enim, consectetur sed dolor id, rutrum euismod
                  arcu. Proin mattis, risus sit amet ultricies congue, augue
                  risus aliquet ligula, eu sodales orci ante in felis. In
                  lobortis vulputate dapibus. Sed at imperdiet leo. Aliquam
                  varius ut massa sed ultricies. Proin ultrices mollis elit vel
                  suscipit. Vivamus commodo lectus ac nisi ultricies, vitae
                  condimentum felis fermentum. Suspendisse potenti. Sed tempor
                  pulvinar metus sit amet imperdiet. Fusce consectetur odio non
                  magna vulputate imperdiet. Integer iaculis luctus nisi eget
                  facilisis. Fusce massa dolor, vestibulum ac metus vel, aliquam
                  vestibulum nulla.
                </p>
                <p className="mb-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam
                  et quam non massa vehicula bibendum sed non ipsum. Donec
                  ullamcorper elit mauris, a hendrerit tellus tincidunt vel. In
                  non purus fermentum, tempus nulla porttitor, sodales mi.
                  Curabitur velit nunc, dictum eu lorem vitae, eleifend feugiat
                  odio. Nulla sagittis vehicula est sit amet rutrum. Curabitur
                  aliquet velit sit amet aliquam sollicitudin. Ut tempus dolor a
                  neque maximus, quis commodo magna interdum. Ut porta leo a ex
                  malesuada, non elementum eros feugiat. Pellentesque auctor
                  felis nec dui tempor dictum. Suspendisse tortor dui, rutrum
                  sed elit sit amet, gravida ornare magna. Etiam luctus nunc
                  velit, eget mollis massa facilisis id. Aliquam auctor diam sed
                  finibus accumsan. Sed a dolor ipsum. Fusce dapibus sed metus
                  ac viverra. Nam sollicitudin enim interdum blandit
                  condimentum. Morbi vitae quam in felis malesuada sodales sed
                  eu nibh.
                </p>
                <p className="mb-4">
                  Phasellus interdum massa sit amet maximus pellentesque.
                  Integer aliquam lacinia dui, nec luctus nulla. Nam varius,
                  tellus sed molestie lacinia, massa dui commodo libero, sit
                  amet ultricies nisl leo ac eros. Pellentesque et magna id
                  mauris faucibus suscipit non nec tortor. Vestibulum at magna
                  pellentesque, dapibus leo sit amet, dignissim metus.
                  Pellentesque habitant morbi tristique senectus et netus et
                  malesuada fames ac turpis egestas. Nunc vel imperdiet lacus,
                  at posuere enim.
                </p>
                <p className="mb-4">
                  Praesent tempus tellus sit amet nisl cursus, in pharetra orci
                  scelerisque. Curabitur sed faucibus nunc. Sed venenatis ex
                  eget urna tincidunt, pellentesque blandit tortor pharetra. Ut
                  enim mauris, rhoncus vitae ultricies ac, dapibus ac nibh.
                  Phasellus rutrum, nulla ut consequat efficitur, massa risus
                  commodo mauris, non fermentum mi erat porttitor nibh.
                  Curabitur ultrices dapibus ante, id maximus felis porttitor a.
                  Quisque eu placerat sem, eget semper mauris. Sed in dui vitae
                  mauris molestie tristique vel sed lorem. Proin ac lectus eu
                  ante malesuada vulputate sit amet sed dolor. Nam condimentum
                  euismod eros, eu faucibus tortor elementum non. Lorem ipsum
                  dolor sit amet, consectetur adipiscing elit. Duis eu tristique
                  dolor, id tristique urna. Quisque commodo risus condimentum
                  nibh dapibus ullamcorper.
                </p>
                <p className="mb-4">
                  Phasellus accumsan massa non rhoncus feugiat. Sed mattis
                  posuere urna lobortis laoreet. Nunc ornare lacinia ornare.
                  Praesent pretium libero non condimentum mollis. Nam at risus
                  dolor. Aenean ante arcu, tincidunt sed sem bibendum, porta
                  feugiat lectus. Proin est elit, tincidunt a finibus eget,
                  facilisis ac mauris. Praesent sit amet erat consequat,
                  hendrerit tortor eu, mattis neque. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit. Suspendisse sit amet purus
                  tristique, rutrum elit a, tristique est. Cras et vulputate
                  odio. Aenean scelerisque at leo vel porttitor. Integer
                  hendrerit eros at enim euismod luctus nec ut dui.
                </p>
                <button
                  className="pw-btn-ghost text-xs mt-2"
                  onClick={() => setShowFullText(false)}
                >
                  Show Less
                </button>
              </div>
            ) : (
              <div>
                <p className="">
                  Who’s in my bed? <br /> Integer efficitur tellus nibh, ut
                  maximus ipsum sodales id. Duis aliquam, leo et laoreet
                  eleifend, nisl est gravida eros, ac ornare eros nulla a nisl.
                  Quisque nisl mauris, varius in tincidunt eget, feugiat eget
                  nisl. Duis nunc enim, consectetur sed dolor id, rutrum euismod
                  arcu. Proin mattis, risus sit amet ultricies congue, augue
                  risus aliquet ligula, eu sodales orci ante in felis. In
                  lobortis vulputate dapibus. Sed at imperdiet leo. Aliquam
                  varius ut massa sed ultricies. Proin ultrices mollis elit vel
                  suscipit. Vivamus commodo lectus ac nisi ultricies, vitae
                  condimentum felis fermentum. Suspendisse potenti. Sed tempor
                  pulvinar metus sit amet imperdiet. Fusce consectetur odio non
                  magna vulputate imperdiet. Integer iaculis luctus nisi eget
                  facilisis. Fusce massa dolor, vestibulum ac metus vel, aliquam
                  vestibulum nulla.
                </p>
                <button
                  className="pw-btn-ghost text-xs mt-2"
                  onClick={() => setShowFullText(true)}
                >
                  See More
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pw-card p-4 mb-6 w-fit">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="pw-btn-primary"
              onClick={startBreak}
              disabled={isRunning}
            >
              Maybe Touch Me?
            </button>
          </div>
        </div>

        <div className={containerClass}>
          <GlitchLayer active={glitchOn || stage === "glitch"} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pw-card p-4">
              <h3 className="text-lg mb-4">Decrypting Your Data</h3>
              <FakeEncrypting />
            </div>
            <div className="pw-card p-4">
              <h3 className="text-lg mb-4">See Some Titties</h3>
              <ShyButton>View Now</ShyButton>
            </div>
            <div className="pw-card p-4">
              <h3 className="text-lg mb-4">
                Check Out Our Discord{" "}
                <span className="text-xs text-[color:var(--pw-muted)]">
                  (This Button Is Real)
                </span>
              </h3>
              <MatrixRain />
            </div>
            <div className="pw-card p-4">
              <h3 className="text-lg mb-4">Get a Free $100 Gift Card</h3>
              <button
                className="pw-btn-ghost bg-pw-accent-1 text-white font-bold"
                onClick={() => setShowFakeModal(true)}
              >
                Redeem Now
              </button>
            </div>
          </div>

          {showFakeModal && stage !== "blackout" && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70">
              <div className="pw-card p-6 max-w-sm w-full text-center">
                <h3 className="text-xl mb-2">500 Internal Server Error</h3>
                <button
                  className="pw-btn-primary"
                  onClick={() => setShowFakeModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {stage === "blackout" && (
            <div
              className="fixed inset-0 z-50 bg-black text-red-500 flex flex-col items-center justify-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="fh-blackout-title"
              aria-describedby="fh-blackout-desc"
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  restoreBtnRef.current?.focus();
                }
              }}
            >
              <div className="text-center px-6 max-w-lg">
                <h2 id="fh-blackout-title" className="text-3xl mb-3">
                  Critical Breach Detected
                </h2>
                <p id="fh-blackout-desc" className="mb-6">
                  Your passwords have been leaked. System integrity compromised.
                </p>
                {restoreCountdown > 0 ? (
                  <div className="mb-6">
                    <div className="text-6xl font-bold text-red-500 mb-2">
                      {restoreCountdown}
                    </div>
                    <p className="text-lg text-red-300">
                      Initiating system recovery...
                    </p>
                  </div>
                ) : (
                  <button
                    ref={restoreBtnRef}
                    className="pw-btn-primary"
                    onClick={restore}
                  >
                    Restore App
                  </button>
                )}
                <p className="mt-3 text-xs text-red-300/70">
                  Press ESC to restore
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GlitchLayer: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 fh-glitch-layer">
      {/* decorative glitch lines */}
      <div className="absolute inset-0 fh-scanline" />
      <div className="absolute inset-0 fh-chroma" />
    </div>
  );
};

const ShyButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        const awayX = -dx / (dist || 1);
        const awayY = -dy / (dist || 1);
        const tx = awayX * 80;
        const ty = awayY * 80;
        el.style.transform = `translate(${tx}px, ${ty}px)`;
      } else {
        el.style.transform = "translate(0px, 0px)";
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <button ref={ref} className="pw-btn-ghost relative">
      {children}
    </button>
  );
};

const FakeEncrypting: React.FC = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + Math.random() * 1.5));
    }, 800);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div>
      <div className="mb-2 text-sm">
        Decrypting All Your Shit... Please Wait…
      </div>
      <div className="h-2 w-full bg-white/10 rounded">
        <div
          className="h-2 bg-red-500 rounded"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId = 0;
    let drops: number[] = [];
    const columnWidth = 12; // spacing between columns

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.ceil(canvas.width / columnWidth);
      drops = Array(columns).fill(0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#22d3ee";
      ctx.font = "16px monospace";
      drops.forEach((y, i) => {
        const text = String.fromCharCode(0x30a0 + Math.random() * 96);
        const x = i * columnWidth;
        ctx.fillText(text, x, y);
        // Slower fall speed
        drops[i] = y > canvas.height + Math.random() * 200 ? 0 : y + 6;
      });
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [running]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button className="pw-btn-ghost" onClick={() => setRunning((v) => !v)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="40"
            height="40"
            viewBox="0 0 48 48"
          >
            <path
              fill="#8c9eff"
              d="M40,12c0,0-4.585-3.588-10-4l-0.488,0.976C34.408,10.174,36.654,11.891,39,14c-4.045-2.065-8.039-4-15-4s-10.955,1.935-15,4c2.346-2.109,5.018-4.015,9.488-5.024L18,8c-5.681,0.537-10,4-10,4s-5.121,7.425-6,22c5.162,5.953,13,6,13,6l1.639-2.185C13.857,36.848,10.715,35.121,8,32c3.238,2.45,8.125,5,16,5s12.762-2.55,16-5c-2.715,3.121-5.857,4.848-8.639,5.815L33,40c0,0,7.838-0.047,13-6C45.121,19.425,40,12,40,12z M17.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C21,28.209,19.433,30,17.5,30z M30.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C34,28.209,32.433,30,30.5,30z"
            ></path>
          </svg>
          <span className="ml-2 text-sm">
            {running ? "Stop" : "Take Me To Discord"}
          </span>
        </button>
      </div>
      {running &&
        createPortal(
          <div className="fixed inset-0 z-40 pointer-events-none">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>,
          document.body
        )}
    </div>
  );
};

export default FunHousePage;
