import type { SubmitHandler } from "react-hook-form";

import { Eye, EyeOff, FileText, Key, Lock, Shield } from "lucide-react";
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
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);

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
          console.warn(
            `Notes validation failed (long digit sequence): "${word}"`
          );
          return "Notes appear to contain a key-like pattern (long number sequence). API keys should be in designated fields only.";
        }
      }

      // Check 2: Mixed letter-number words that aren't allowed variable names or numbered list items
      const hasLetters = /[a-zA-Z]/.test(word);
      const hasNumbers = /[0-9]/.test(word);

      if (hasLetters && hasNumbers) {
        if (!allowedVarPattern.test(word) && !numberedListPattern.test(word)) {
          console.warn(
            `Notes validation failed (mixed letter/number): "${word}"`
          );
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
    console.log(`Validating API Key (length: ${String(trimmedValue.length)})`);

    if (!trimmedValue) {
      console.warn("API Key validation failed: Empty value");
      return "API Key is required";
    }
    if (trimmedValue.length < 8) {
      console.warn(
        `API Key validation failed: Too short (${String(
          trimmedValue.length
        )} chars)`
      );
      return "API Key must be at least 8 characters long";
    }

    console.log("API Key validation: Passed");
    return true;
  };

  const validateApiSecret = (value: string) => {
    if (!value) return true;

    const trimmedValue = value.trim();
    console.log(
      `Validating API Secret (length: ${String(trimmedValue.length)})`
    );

    if (trimmedValue.length < 8) {
      console.warn(
        `API Secret validation failed: Too short (${String(
          trimmedValue.length
        )} chars)`
      );
      return "API Secret must be at least 8 characters long";
    }

    console.log("API Secret validation: Passed");
    return true;
  };

  const onSubmit: SubmitHandler<CredentialFormData> = async (data) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log(`Submitting credential for project: ${projectId}`);
    console.log(
      `Form data: Service name: ${data.cred_service}, API Key length: ${String(
        data.cred_key.length
      )}, API Secret provided: ${String(
        Boolean(data.cred_secret.trim())
      )}, Notes provided: ${String(Boolean(data.cred_notes.trim()))}`
    );

    setIsSubmitting(true);
    try {
      console.log("Preparing payload");
      const basePayload = {
        apiKey: data.cred_key.trim(),
        apiSecret:
          data.cred_secret.trim() === "" ? undefined : data.cred_secret.trim(),
        category: data.cred_category.trim() || "none",
        notes:
          data.cred_notes.trim() === "" ? undefined : data.cred_notes.trim(),
        serviceName: data.cred_service.trim(),
      };

      console.log(
        `Payload prepared: Service name: ${
          basePayload.serviceName
        }, API Key length: ${String(
          basePayload.apiKey.length
        )}, API Secret provided: ${String(
          Boolean(basePayload.apiSecret)
        )}, Notes provided: ${String(Boolean(basePayload.notes))}`
      );

      if (editingCredential) {
        console.log(`Updating existing credential: ${editingCredential.id}`);
        await updateCredential(editingCredential.id, projectId, basePayload);
        console.log("Credential updated successfully");
        onClose(true, "edit");
      } else {
        console.log("Creating new credential");
        const addPayload = {
          ...basePayload,
          projectId,
        };
        const newCredentialId = await addCredential(projectId, addPayload);
        console.log(
          `New credential ${
            newCredentialId
              ? `created with ID: ${newCredentialId}`
              : "creation failed"
          }`
        );
        onClose(true, "add");

        // Check if modal was opened via command palette
        const modalParam = searchParams.get("modal");
        if (modalParam === "credential") {
          console.log(
            "Modal opened via command palette, navigating to dashboard"
          );
          void navigate("/dashboard");
        }
      }
      reset();
      console.log("=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===");
    } catch (error) {
      console.error("Failed to save credential:", error);
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
        console.error(`Error stack: ${error.stack ?? "No stack trace"}`);
      }
      onClose(false);
      console.log("=== FORM SUBMISSION FAILED ===");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-brand-blue/30 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="p-6">
          {/* Enhanced Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-primary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl text-white">
                {editingCredential ? "Edit Credential" : "Add New Credential"}
              </h2>
              <p className="text-sm text-gray-400">
                {editingCredential
                  ? "Update your API credentials"
                  : "Securely store your API credentials"}
              </p>
            </div>
          </div>

          <form
            autoComplete="off"
            onSubmit={(e) => {
              console.log("Form submission initiated");
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

            {/* Enhanced Service Name Field */}
            <div className="mb-6">
              <label
                className="flex items-center space-x-2 mb-3 text-sm font-semibold text-brand-light"
                htmlFor="cred_service"
              >
                <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                <span>Service Name</span>
              </label>
              <input
                aria-autocomplete="none"
                aria-label="Service Name"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200"
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
              {errors.cred_service?.message && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  <span>{errors.cred_service.message}</span>
                </p>
              )}
            </div>

            {/* Category Field */}
            <div className="mb-6">
              <label
                className="flex items-center space-x-2 mb-3 text-sm font-semibold text-brand-light"
                htmlFor="cred_category"
              >
                <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"></div>
                <span>Category</span>
                <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                  Optional
                </span>
              </label>
              <select
                aria-label="Category"
                className="w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200"
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

            {/* Enhanced API Key Field */}
            <div className="mb-6">
              <label
                className="flex items-center space-x-2 mb-3 text-sm font-semibold text-brand-light"
                htmlFor="cred_key"
              >
                <Key className="w-4 h-4 text-brand-blue" />
                <span>API Key</span>
              </label>
              <div className="relative">
                <input
                  aria-autocomplete="none"
                  aria-label="API Key"
                  autoCapitalize="off"
                  autoComplete="new-password"
                  autoCorrect="off"
                  className="w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="cred_key"
                  inputMode="text"
                  placeholder="Enter API Key"
                  spellCheck={false}
                  type={showPassword ? "text" : "password"}
                  {...register("cred_key", {
                    onBlur: clearSensitiveData,
                    onChange: (e) => {
                      console.log(
                        `API Key field changed (length: ${String(
                          (e as React.ChangeEvent<HTMLInputElement>).target
                            .value.length
                        )})`
                      );
                      handleInputChange();
                    },
                    required: "API Key is required",
                    validate: validateApiKey,
                  })}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue p-1 rounded-lg hover:bg-brand-blue/10 transition-all duration-200"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  title={showPassword ? "Hide" : "Show"}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.cred_key?.message && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  <span>{errors.cred_key.message}</span>
                </p>
              )}
            </div>

            {/* Enhanced API Secret Field */}
            <div className="mb-6">
              <label
                className="flex items-center space-x-2 mb-3 text-sm font-semibold text-brand-light"
                htmlFor="cred_secret"
              >
                <Lock className="w-4 h-4 text-purple-400" />
                <span>API Secret</span>
                <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                  Optional
                </span>
              </label>
              <div className="relative">
                <input
                  aria-autocomplete="none"
                  aria-label="API Secret"
                  autoCapitalize="off"
                  autoComplete="new-password"
                  autoCorrect="off"
                  className="w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="cred_secret"
                  inputMode="text"
                  placeholder="Enter API Secret"
                  spellCheck={false}
                  type={showSecret ? "text" : "password"}
                  {...register("cred_secret", {
                    onBlur: clearSensitiveData,
                    onChange: (e) => {
                      console.log(
                        `API Secret field changed (length: ${String(
                          (e as React.ChangeEvent<HTMLInputElement>).target
                            .value.length
                        )})`
                      );
                      handleInputChange();
                    },
                    validate: validateApiSecret,
                  })}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue p-1 rounded-lg hover:bg-brand-blue/10 transition-all duration-200"
                  onClick={() => {
                    setShowSecret(!showSecret);
                  }}
                  title={showSecret ? "Hide" : "Show"}
                  type="button"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.cred_secret?.message && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  <span>{errors.cred_secret.message}</span>
                </p>
              )}
            </div>

            {/* Enhanced Notes Field */}
            <div className="mb-8">
              <label
                className="flex items-center space-x-2 mb-3 text-sm font-semibold text-brand-light"
                htmlFor="cred_notes"
              >
                <FileText className="w-4 h-4 text-green-400" />
                <span>Notes</span>
                <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                  Optional
                </span>
              </label>
              <textarea
                aria-autocomplete="none"
                aria-label="Notes"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200 resize-none"
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
                  onChange: (e) => {
                    console.log(
                      `Notes field changed (length: ${String(
                        (e as React.ChangeEvent<HTMLTextAreaElement>).target
                          .value.length
                      )})`
                    );
                  },
                  validate: validateNotesPotentialApiKey,
                })}
              />
              {errors.cred_notes?.message && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  <span>{errors.cred_notes.message}</span>
                </p>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                className="px-6 py-3 border border-gray-600 text-brand-light-secondary hover:bg-gray-700/50 hover:text-brand-light font-semibold rounded-xl focus:outline-none disabled:opacity-50 transition-all duration-200"
                disabled={isSubmitting}
                onClick={() => {
                  console.log("Form cancelled by user");
                  reset();
                  onClose();
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-6 py-3 bg-brand-blue hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl focus:outline-none disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? editingCredential
                    ? "Saving..."
                    : "Adding..."
                  : editingCredential
                  ? "Save Changes"
                  : "Add Credential"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CredentialModal;
