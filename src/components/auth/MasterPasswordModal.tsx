import { AlertTriangle, InfoIcon, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";

import { ErrorCategory, logger } from "../../services/logger";
import useAuthStore from "../../stores/authStore";

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState("");
  const { isLoading, masterPasswordSet, setMasterPassword, user } =
    useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subError, setError] = useState<null | string>(null);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4 scale
  const [strengthFeedback, setStrengthFeedback] = useState("");
  const [strengthSuggestions, setStrengthSuggestions] = useState<string[]>([]);

  const calculatePasswordStrength = (currentPassword: string) => {
    const suggestions: string[] = [];

    const length = currentPassword.length;
    const hasLower = /[a-z]/.test(currentPassword);
    const hasUpper = /[A-Z]/.test(currentPassword);
    const hasNumber = /[0-9]/.test(currentPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(currentPassword);

    let finalScore = 0;
    if (length < 8) {
      finalScore = 0;
    } else if (length < 12) {
      if (hasLower && hasUpper && hasNumber && hasSymbol)
        finalScore = 2; // All variety but short
      else if ((hasLower || hasUpper) && hasNumber && hasSymbol) finalScore = 2;
      else if ((hasLower || hasUpper) && (hasNumber || hasSymbol))
        finalScore = 1; // Weak
      else finalScore = 1;
    } else if (length < 16) {
      if (hasLower && hasUpper && hasNumber && hasSymbol)
        finalScore = 3; // Good
      else if ((hasLower || hasUpper) && hasNumber && hasSymbol) finalScore = 3;
      else finalScore = 2; // Fair
    } else {
      // 16+
      if (hasLower && hasUpper && hasNumber && hasSymbol)
        finalScore = 4; // Strong
      else if ((hasLower || hasUpper) && hasNumber && hasSymbol) finalScore = 4;
      else if ((hasLower || hasUpper) && (hasNumber || hasSymbol))
        finalScore = 3; // Good
      else finalScore = 2; // Fair (long but not varied enough)
    }

    // Suggestions
    if (length === 0) {
      // No suggestions if password is empty, handled by handlePasswordChange
    } else if (length < 8) {
      suggestions.push("Make it at least 8 characters long.");
    } else if (length < 12) {
      suggestions.push(
        "Consider making it 12+ characters for better strength."
      );
    }
    if (!hasLower && length > 0)
      suggestions.push("Include lowercase letters (a-z).");
    if (!hasUpper && length > 0)
      suggestions.push("Include uppercase letters (A-Z).");
    if (!hasNumber && length > 0) suggestions.push("Include numbers (0-9).");
    if (!hasSymbol && length > 0)
      suggestions.push("Include symbols (e.g., !@#$).");

    let feedbackText = "";
    switch (finalScore) {
      case 0:
        feedbackText = length > 0 ? "Very Weak" : "";
        break; // Show feedback only if not empty
      case 1:
        feedbackText = "Weak";
        break;
      case 2:
        feedbackText = "Fair";
        break;
      case 3:
        feedbackText = "Good";
        break;
      case 4:
        feedbackText = "Strong";
        break;
      default:
        feedbackText = "";
    }

    setPasswordStrength(finalScore);
    setStrengthFeedback(feedbackText);
    // Show only relevant suggestions, max 2
    const relevantSuggestions = suggestions.filter((s) => s !== "");
    setStrengthSuggestions(relevantSuggestions.slice(0, 2));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword === "") {
      setPasswordStrength(0);
      setStrengthFeedback("");
      setStrengthSuggestions([]);
    } else {
      calculatePasswordStrength(newPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Never log password, key material, or derived key — only non-sensitive metadata.
      logger.info(ErrorCategory.AUTH, "Attempting to set master password", {
        action: "setMasterPassword",
        userId: user?.uid,
      });

      if (!password) {
        setError("Please enter your master password");
        setIsSubmitting(false);
        return;
      }

      if (passwordStrength < 2) {
        setError("Password must be at least 'Fair' strength");
        setIsSubmitting(false);
        return;
      }

      await setMasterPassword(password);

      // Never log password or key material after unlock.
      logger.info(ErrorCategory.AUTH, "Master password set successfully", {
        action: "setMasterPassword",
        userId: user?.uid,
      });

      toast.success("Master password set", {
        description: "Your master password has been set successfully",
      });

      onClose();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during verification"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (masterPasswordSet && isOpen) {
      setPassword("");
      // Reset strength indicator when modal reopens after success or if already set
      setPasswordStrength(0);
      setStrengthFeedback("");
      setStrengthSuggestions([]);
      onClose();
    }
  }, [masterPasswordSet, onClose, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsCapsLockOn(false);
      // Reset password field if modal is closed without submission, unless it was just successfully set
      if (!masterPasswordSet) {
        setPassword("");
        setPasswordStrength(0);
        setStrengthFeedback("");
        setStrengthSuggestions([]);
      }
    }
  }, [isOpen, masterPasswordSet]); // Added masterPasswordSet dependency

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Toaster position="top-right" richColors />
      <div
        aria-labelledby="master-password-title"
        aria-modal="true"
        className="w-full max-w-md space-y-5 rounded-2xl border border-zk-border bg-zk-elevated p-6 font-zk-sans text-zk-text shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)] sm:p-8"
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
            <Lock className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h2
              className="text-xl font-semibold tracking-[-0.02em] text-zk-text sm:text-2xl"
              id="master-password-title"
            >
              Master password
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              This unlocks encryption for your API credentials. It is never sent
              to our servers. If you already chose one, enter it here.
            </p>
          </div>
        </div>
        <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          <input
            aria-hidden="true"
            autoComplete="username"
            className="sr-only"
            name="username"
            readOnly
            tabIndex={-1}
            type="text"
            value={user?.email ?? ""}
          />
          <div>
            <label
              className="mb-2 block text-sm font-medium text-zk-muted"
              htmlFor="masterPassword"
            >
              Master password
            </label>
            <input
              aria-label="Master password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-3 font-zk-sans text-sm text-zk-text placeholder:text-zk-muted/50 focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30"
              id="masterPassword"
              name="masterPassword"
              onChange={handlePasswordChange}
              onKeyDown={(e) => {
                setIsCapsLockOn(e.getModifierState("CapsLock"));
              }}
              onKeyUp={(e) => {
                setIsCapsLockOn(e.getModifierState("CapsLock"));
              }}
              required
              type="password"
              value={password}
            />
            <div
              aria-live="polite"
              className="mt-2 flex items-center text-xs text-amber-200/95"
              role="alert"
              style={{ visibility: isCapsLockOn ? "visible" : "hidden" }}
            >
              <InfoIcon className="mr-1.5 inline h-4 w-4 shrink-0" />
              Caps Lock is on
            </div>

            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      passwordStrength === 0
                        ? "text-red-400"
                        : passwordStrength === 1
                          ? "text-red-300"
                          : passwordStrength === 2
                            ? "text-amber-200/90"
                            : passwordStrength === 3
                              ? "text-zk-safe"
                              : "text-zk-safe"
                    }`}
                  >
                    {strengthFeedback}
                  </span>
                </div>
                <div className="flex h-2 gap-1 overflow-hidden rounded-full">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      className={`flex-1 rounded-sm ${
                        passwordStrength >= level && level === 0
                          ? "bg-red-500/90"
                          : passwordStrength >= level && level === 1
                            ? "bg-red-400/85"
                            : passwordStrength >= level && level === 2
                              ? "bg-amber-400/85"
                              : passwordStrength >= level && level === 3
                                ? "bg-zk-safe/85"
                                : passwordStrength >= level && level === 4
                                  ? "bg-zk-safe"
                                  : "bg-zk-border"
                      }`}
                      key={level}
                    />
                  ))}
                </div>
                {strengthSuggestions.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs text-zk-muted">
                    {strengthSuggestions.map((suggestion, index) => (
                      <li className="flex items-start gap-2" key={index}>
                        {passwordStrength < 2 ? (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/90" />
                        ) : (
                          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zk-cyan/90" />
                        )}
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              className="order-1 w-full rounded-xl bg-zk-indigo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zk-indigo-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/40 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2 sm:w-auto"
              disabled={
                isLoading ||
                isSubmitting ||
                password.length === 0 ||
                passwordStrength < 2
              }
              type="submit"
            >
              {isLoading || isSubmitting ? "Working…" : "Unlock"}
            </button>
          </div>
        </form>
        {subError ? (
          <p className="rounded-lg border border-red-500/35 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            {subError}
          </p>
        ) : null}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
};

export default MasterPasswordModal;
