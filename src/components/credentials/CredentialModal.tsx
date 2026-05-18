import type { SubmitHandler } from "react-hook-form";

import { Eye, EyeOff, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";

import useCredentialStore, {
  type DecryptedCredential,
} from "../../stores/credentialStore";

interface CredentialFormData {
  cred_category: string;
  cred_key: string;
  cred_notes: string;
  cred_secret: string;
  cred_service: string;
}

interface CredentialModalProps {
  editingCredential?: DecryptedCredential | null;
  isOpen: boolean;
  onClose: (success?: boolean, action?: "add" | "edit") => void;
  projectId: string;
}

const zkField =
  "w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-3 font-zk-sans text-sm text-zk-text transition-colors placeholder:text-zk-muted/50 focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30";
const zkLabel = "mb-2 block text-sm font-medium text-zk-muted";
const zkOptionalBadge =
  "ml-2 inline-flex rounded-full border border-zk-border bg-zk-base/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zk-muted";

const CredentialModal = ({
  editingCredential,
  isOpen,
  onClose,
  projectId,
}: CredentialModalProps) => {
  const { addCredential, updateCredential } = useCredentialStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CredentialFormData>({
    defaultValues: {
      cred_category: "none",
      cred_key: "",
      cred_notes: "",
      cred_secret: "",
      cred_service: "",
    },
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [inputTimeout, setInputTimeout] = useState<
    ReturnType<typeof setTimeout> | null
  >(null);

  const validateNotesPotentialApiKey = (value: string): boolean | string => {
    if (!value || value.trim() === "") {
      return true; // Empty notes are fine
    }

    const notes = value;
    // Split by characters that are NOT (alphanumeric, _, -, .)
    // This extracts "words" that could be variable names or key-like strings.
    const words = notes.split(/[^a-zA-Z0-9_.-]+/).filter(Boolean);

    // Allows patterns like: API_KEY, API_V2, MY-CONFIG.1, ALL-CAPS-NAME
    const allowedVarPattern = /^[A-Z0-9]+(?:[_.-][A-Z0-9]+)*$/;
    // Allows numbered list items like: 1., 12.
    const numberedListPattern = /^\d+\.$/;
    // Detects 4 or more consecutive digits
    const longDigitSequencePattern = /\d{4,}/;

    for (const word of words) {
      // Check 1: More than 3 consecutive digits within the word
      if (longDigitSequencePattern.test(word)) {
        if (!allowedVarPattern.test(word)) {
          return "Notes appear to contain a key-like pattern (long number sequence). API keys should be in designated fields only.";
        }
      }

      // Check 2: Mixed letter-number words that aren't allowed variable names or numbered list items
      const hasLetters = /[a-zA-Z]/.test(word);
      const hasNumbers = /[0-9]/.test(word);

      if (hasLetters && hasNumbers) {
        if (!allowedVarPattern.test(word) && !numberedListPattern.test(word)) {
          return "Notes appear to contain a key-like pattern (mixed letters/numbers not matching allowed variable styles like MY_VAR_1). API keys should be in designated fields only.";
        }
      }
    }

    return true; // All checks passed
  };

  useEffect(() => {
    if (editingCredential) {
      setValue("cred_category", editingCredential.category ?? "none");
      setValue("cred_key", editingCredential.apiKey);
      setValue("cred_notes", editingCredential.notes ?? "");
      setValue("cred_secret", editingCredential.apiSecret ?? "");
      setValue("cred_service", editingCredential.serviceName);
    } else {
      reset({
        cred_category: "none",
        cred_key: "",
        cred_notes: "",
        cred_secret: "",
        cred_service: "",
      });
    }
  }, [editingCredential, setValue, reset]);

  const clearSensitiveData = () => {
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    const timeout = setTimeout(() => {
      setShowPassword(false);
      setShowSecret(false);
    }, 30000);
    setInputTimeout(timeout);
  };

  const handleInputChange = () => {
    clearSensitiveData();
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    const timeout = setTimeout(() => {
      setShowPassword(false);
      setShowSecret(false);
    }, 30000);
    setInputTimeout(timeout);
  };

  const validateApiKey = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "API Key is required";
    }
    if (trimmedValue.length < 8) {
      return "API Key must be at least 8 characters long";
    }

    return true;
  };

  const validateApiSecret = (value: string) => {
    if (!value) return true;

    const trimmedValue = value.trim();

    if (trimmedValue.length < 8) {
      return "API Secret must be at least 8 characters long";
    }

    return true;
  };

  const onSubmit: SubmitHandler<CredentialFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const basePayload = {
        apiKey: data.cred_key.trim(),
        apiSecret:
          data.cred_secret.trim() === "" ? undefined : data.cred_secret.trim(),
        category: data.cred_category.trim() || "none",
        notes:
          data.cred_notes.trim() === "" ? undefined : data.cred_notes.trim(),
        serviceName: data.cred_service.trim(),
      };

      if (editingCredential) {
        await updateCredential(editingCredential.id, projectId, basePayload);
        onClose(true, "edit");
      } else {
        const addPayload = {
          ...basePayload,
          projectId,
        };
        await addCredential(projectId, addPayload);
        onClose(true, "add");

        // Check if modal was opened via command palette
        const modalParam = searchParams.get("modal");
        if (modalParam === "credential") {
          void navigate("/dashboard");
        }
      }
      reset();
    } catch (error) {
      onClose(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zk-border bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
        <div className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
              <Shield className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-zk-text">
                {editingCredential ? "Edit credential" : "Add credential"}
              </h2>
              <p className="text-sm text-zk-muted">
                {editingCredential
                  ? "Update encrypted fields for this entry."
                  : "Stored encrypted in your vault."}
              </p>
            </div>
          </div>

          <form
            autoComplete="off"
            onSubmit={(e) => {
              return void handleSubmit(onSubmit)(e);
            }}
            role="presentation"
          >
            {/* Offscreen honeypot fields to pacify password managers */}
            <div
              aria-hidden="true"
              style={{
                height: 0,
                left: -99999,
                overflow: "hidden",
                position: "absolute",
                width: 0,
              }}
            >
              <input
                autoComplete="username"
                name="username"
                readOnly
                tabIndex={-1}
                type="text"
                value=""
              />
              <input
                autoComplete="new-password"
                name="password"
                readOnly
                tabIndex={-1}
                type="password"
                value=""
              />
            </div>

            <div className="mb-5">
              <label className={zkLabel} htmlFor="cred_service">
                Service name
              </label>
              <input
                aria-autocomplete="none"
                aria-label="Service name"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className={zkField}
                data-1p-ignore
                data-form-type="other"
                data-lpignore="true"
                id="cred_service"
                inputMode="text"
                placeholder="e.g., AWS, Stripe, OpenAI"
                spellCheck={false}
                type="text"
                {...register("cred_service", {
                  maxLength: {
                    message: "Service name must be less than 50 characters",
                    value: 50,
                  },
                  minLength: {
                    message: "Service name must be at least 2 characters",
                    value: 2,
                  },
                  pattern: {
                    message: "Service name contains invalid characters",
                    value: /^[a-zA-Z0-9\s\-_]+$/,
                  },
                  required: "Service name is required",
                })}
              />
              {errors.cred_service?.message ? (
                <p className="mt-2 text-sm text-red-200/90">
                  {errors.cred_service.message}
                </p>
              ) : null}
            </div>

            <div className="mb-5">
              <label className={zkLabel} htmlFor="cred_category">
                Category
                <span className={zkOptionalBadge}>Optional</span>
              </label>
              <select
                aria-label="Category"
                className={zkField}
                id="cred_category"
                {...register("cred_category")}
              >
                <option value="none">None</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="database">Database</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="devops">DevOps</option>
                <option value="mobile">Mobile</option>
                <option value="analytics">Analytics</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-5">
              <label className={zkLabel} htmlFor="cred_key">
                API key
              </label>
              <div className="relative">
                <input
                  aria-autocomplete="none"
                  aria-label="API key"
                  autoCapitalize="off"
                  autoComplete="new-password"
                  autoCorrect="off"
                  className={`${zkField} pr-12`}
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="cred_key"
                  inputMode="text"
                  placeholder="Enter your API key"
                  spellCheck={false}
                  type={showPassword ? "text" : "password"}
                  {...register("cred_key", {
                    onBlur: clearSensitiveData,
                    onChange: () => {
                      handleInputChange();
                    },
                    required: "API Key is required",
                    validate: validateApiKey,
                  })}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zk-muted transition-colors hover:bg-zk-base/80 hover:text-zk-text"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  title={showPassword ? "Hide" : "Show"}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.cred_key?.message ? (
                <p className="mt-2 text-sm text-red-200/90">
                  {errors.cred_key.message}
                </p>
              ) : null}
            </div>

            <div className="mb-5">
              <label className={zkLabel} htmlFor="cred_secret">
                API secret
                <span className={zkOptionalBadge}>Optional</span>
              </label>
              <div className="relative">
                <input
                  aria-autocomplete="none"
                  aria-label="API secret"
                  autoCapitalize="off"
                  autoComplete="new-password"
                  autoCorrect="off"
                  className={`${zkField} pr-12`}
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="cred_secret"
                  inputMode="text"
                  placeholder="Enter your API secret (if applicable)"
                  spellCheck={false}
                  type={showSecret ? "text" : "password"}
                  {...register("cred_secret", {
                    onBlur: clearSensitiveData,
                    onChange: () => {
                      handleInputChange();
                    },
                    validate: validateApiSecret,
                  })}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zk-muted transition-colors hover:bg-zk-base/80 hover:text-zk-text"
                  onClick={() => {
                    setShowSecret(!showSecret);
                  }}
                  title={showSecret ? "Hide" : "Show"}
                  type="button"
                >
                  {showSecret ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.cred_secret?.message ? (
                <p className="mt-2 text-sm text-red-200/90">
                  {errors.cred_secret.message}
                </p>
              ) : null}
            </div>

            <div className="mb-6">
              <label className={zkLabel} htmlFor="cred_notes">
                Notes
                <span className={zkOptionalBadge}>Optional</span>
              </label>
              <textarea
                aria-autocomplete="none"
                aria-label="Notes"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className={`${zkField} resize-none`}
                data-1p-ignore
                data-form-type="other"
                data-lpignore="true"
                id="cred_notes"
                inputMode="text"
                placeholder="Any additional notes, e.g., usage instructions, scopes"
                rows={4}
                spellCheck={false}
                {...register("cred_notes", {
                  maxLength: {
                    message: "Notes must be less than 500 characters",
                    value: 500,
                  },
                  onChange: () => {},
                  validate: validateNotesPotentialApiKey,
                })}
              />
              {errors.cred_notes?.message ? (
                <p className="mt-2 text-sm text-red-200/90">
                  {errors.cred_notes.message}
                </p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => {
                  reset();
                  onClose();
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zk-indigo py-3 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>
                      {editingCredential ? "Saving…" : "Adding…"}
                    </span>
                  </>
                ) : (
                  <span>
                    {editingCredential ? "Save changes" : "Create credential"}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CredentialModal;
