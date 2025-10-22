import { useEffect, useRef } from "react";

interface UseSecretCodeOptions {
  resetMs?: number;
  ignoreWhenEditing?: boolean;
}

export function useSecretCode(target: string, onMatch: () => void, options: UseSecretCodeOptions = {}) {
  const { resetMs = 3000, ignoreWhenEditing = true } = options;
  const bufferRef = useRef<string>("");
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function isEditingElement(el: Element | null): boolean {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (el as HTMLElement).isContentEditable) {
        return true;
      }
      return false;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (ignoreWhenEditing && isEditingElement(document.activeElement)) {
        return;
      }

      const rawKey = typeof e.key === "string" ? e.key : "";
      if (!rawKey) return;
      const key = rawKey.length === 1 ? rawKey.toLowerCase() : "";
      if (!key) return;

      bufferRef.current = (bufferRef.current + key).slice(-target.length);

      // reset timer
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        bufferRef.current = "";
      }, resetMs);

      if (bufferRef.current === target.toLowerCase()) {
        bufferRef.current = "";
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }
        onMatch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [target, onMatch, resetMs, ignoreWhenEditing]);
}

export default useSecretCode;


