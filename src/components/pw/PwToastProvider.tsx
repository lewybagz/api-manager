/* eslint-disable no-unused-vars */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle, AlertTriangle, Info, Loader2, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ShowOptions {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms; ignored for loading unless provided
  actionLabel?: string;
  onAction?: () => void;
}

type UpdateOptions = Partial<ShowOptions>;

interface ToastItem extends ShowOptions {
  id: string;
}

interface PwToastContextValue {
  show: (options: ShowOptions) => string;
  update: (id: string, options: UpdateOptions) => void;
  dismiss: (id: string) => void;
}

const PwToastContext = createContext<PwToastContextValue | null>(null);

function getStableId(): string {
  // Prefer crypto.randomUUID when available; fallback to timestamp-rand
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const PwToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const clearTimer = useCallback((id: string) => {
    const handle = timersRef.current[id];
    if (handle) {
      window.clearTimeout(handle);
      delete timersRef.current[id];
    }
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      timersRef.current[id] = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timersRef.current[id];
      }, Math.max(800, duration));
    },
    [clearTimer]
  );

  const show = useCallback(
    (options: ShowOptions) => {
      const id = getStableId();
      const item: ToastItem = { id, ...options };
      setToasts((prev) => [item, ...prev]);
      if (options.type !== "loading") {
        scheduleAutoDismiss(id, options.duration ?? 2800);
      }
      return id;
    },
    [scheduleAutoDismiss]
  );

  const update = useCallback(
    (id: string, options: UpdateOptions) => {
      setToasts((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...options } : t));
        return next;
      });
      // If we moved away from loading, or duration was explicitly provided, schedule dismissal
      const target = toasts.find((t) => t.id === id);
      const resultingType: ToastType | undefined = options.type ?? target?.type;
      if (resultingType && resultingType !== "loading") {
        scheduleAutoDismiss(id, options.duration ?? 2400);
      } else if (typeof options.duration === "number") {
        scheduleAutoDismiss(id, options.duration);
      }
    },
    [scheduleAutoDismiss, toasts]
  );

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer]
  );

  const value = useMemo<PwToastContextValue>(
    () => ({ show, update, dismiss }),
    [show, update, dismiss]
  );

  return (
    <PwToastContext.Provider value={value}>
      {children}
      {/* Viewport */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-1rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pw-card border border-[color:var(--pw-border)] bg-black/80 backdrop-blur-md text-[color:var(--pw-text)] shadow-xl p-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {t.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : t.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                ) : t.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                ) : t.type === "loading" ? (
                  <Loader2 className="h-4 w-4 text-red-300 animate-spin" />
                ) : (
                  <Info className="h-4 w-4 text-red-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.title}</p>
                {t.description ? (
                  <p className="text-xs text-[color:var(--pw-muted)] truncate">
                    {t.description}
                  </p>
                ) : null}
              </div>
              {t.actionLabel && t.onAction ? (
                <button
                  type="button"
                  className="pw-btn-ghost px-2 py-1 text-xs"
                  onClick={() => {
                    try {
                      t.onAction?.();
                    } finally {
                      dismiss(t.id);
                    }
                  }}
                >
                  {t.actionLabel}
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Close notification"
                className="pw-btn-ghost px-1 py-1"
                onClick={() => dismiss(t.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </PwToastContext.Provider>
  );
};

export function usePwToasts(): PwToastContextValue {
  const ctx = useContext(PwToastContext);
  if (!ctx) throw new Error("usePwToasts must be used within PwToastProvider");
  return ctx;
}
