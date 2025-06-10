import { AlertTriangle, InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
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

      logger.info(ErrorCategory.AUTH, "Master password set successfully", {
        action: "setMasterPassword",
        userId: user?.uid,
      });

      toast.success("Master password set", {
        description: "Your master password has been set successfully",
      });

      onClose();
    } catch (error: unknown) {
      console.error("Master password verification error:", error);
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

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />
      <div className="bg-brand-dark-secondary p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold text-brand-light">
          Enter Master Password
        </h2>
        <p className="text-sm text-brand-light-secondary">
          This password is used to encrypt and decrypt your API credentials. It
          is not stored anywhere. If you've already set a master password,
          please enter it below.
        </p>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
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
              className="block text-sm font-medium text-brand-light-secondary mb-1"
              htmlFor="masterPassword"
            >
              Master Password:
            </label>
            <input
              aria-label="Master Password"
              autoComplete="current-password"
              className="w-full px-3 py-2 bg-brand-dark border border-brand-dark rounded-md text-brand-light focus:outline-none"
              id="masterPassword"
              name="masterPassword"
              onChange={handlePasswordChange} // Corrected order
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
              className="mt-1 text-yellow-400 text-xs flex items-center"
              role="alert"
              style={{ visibility: isCapsLockOn ? "visible" : "hidden" }}
            >
              <InfoIcon className="h-4 w-4 mr-1 inline" />
              Caps Lock is ON
            </div>

            {/* Password Strength Indicator UI */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span
                    className={`font-semibold ${
                      passwordStrength === 0
                        ? "text-red-500"
                        : passwordStrength === 1
                        ? "text-red-400"
                        : passwordStrength === 2
                        ? "text-yellow-400"
                        : passwordStrength === 3
                        ? "text-green-400"
                        : "text-green-500"
                    }`}
                  >
                    {strengthFeedback}
                  </span>
                </div>
                <div className="flex space-x-1 h-2 rounded-full overflow-hidden">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      className={`flex-1 ${
                        passwordStrength >= level && level === 0
                          ? "bg-red-500" // Very Weak
                          : passwordStrength >= level && level === 1
                          ? "bg-red-400" // Weak
                          : passwordStrength >= level && level === 2
                          ? "bg-yellow-400" // Fair
                          : passwordStrength >= level && level === 3
                          ? "bg-green-400" // Good
                          : passwordStrength >= level && level === 4
                          ? "bg-green-500" // Strong
                          : "bg-gray-700" // Default for levels not reached or placeholder
                      }`}
                      key={level} // Corrected order
                    />
                  ))}
                </div>
                {strengthSuggestions.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-xs text-brand-light-secondary space-y-0.5">
                    {strengthSuggestions.map((suggestion, index) => (
                      <li className="flex items-center" key={index}>
                        {" "}
                        {/* Corrected order */}
                        {passwordStrength < 2 ? (
                          <AlertTriangle className="h-3 w-3 mr-1.5 text-yellow-500 flex-shrink-0" />
                        ) : (
                          <InfoIcon className="h-3 w-3 mr-1.5 text-blue-400 flex-shrink-0" />
                        )}
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* End Password Strength Indicator UI */}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              className="px-4 py-2 border border-brand-light-secondary text-brand-light-secondary rounded-md hover:bg-brand-dark focus:outline-none disabled:opacity-50 order-2 sm:order-1"
              disabled={isLoading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-md focus:outline-none disabled:opacity-50 order-1 sm:order-2"
              disabled={
                isLoading ||
                isSubmitting ||
                password.length === 0 ||
                passwordStrength < 2
              }
              type="submit"
            >
              {isLoading || isSubmitting
                ? "Processing..."
                : "Set Password & Unlock"}
            </button>
          </div>
        </form>
        {subError && <p className="text-sm text-red-400">Error: {subError}</p>}
      </div>
    </div>
  );
};

export default MasterPasswordModal;
