import type { SubmitHandler } from "react-hook-form";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import useCredentialStore, {
  type DecryptedCredential,
} from "../../stores/credentialStore";

interface CredentialFormData {
  apiKey: string;
  apiSecret: string;
  notes: string;
  serviceName: string;
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

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CredentialFormData>({
    defaultValues: {
      apiKey: "",
      apiSecret: "",
      notes: "",
      serviceName: "",
    },
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editingCredential) {
      console.log(
        `Loading existing credential: ${editingCredential.id} for editing`
      );
      setValue("serviceName", editingCredential.serviceName);
      setValue("apiKey", editingCredential.apiKey);
      setValue("apiSecret", editingCredential.apiSecret ?? "");
      setValue("notes", editingCredential.notes ?? "");
    } else {
      console.log("Initializing empty form for new credential");
      reset({
        apiKey: "",
        apiSecret: "",
        notes: "",
        serviceName: "",
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
    const hasValidFormat = /^[a-zA-Z0-9_\-.:]+$/.test(trimmedValue);
    if (!hasValidFormat) {
      console.warn("API Key validation failed: Invalid format");
      return "API Key contains invalid characters";
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
    const hasValidFormat = /^[a-zA-Z0-9_\-.:]+$/.test(trimmedValue);
    if (!hasValidFormat) {
      console.warn("API Secret validation failed: Invalid format");
      return "API Secret contains invalid characters";
    }

    console.log("API Secret validation: Passed");
    return true;
  };

  const onSubmit: SubmitHandler<CredentialFormData> = async (data) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log(`Submitting credential for project: ${projectId}`);
    console.log(
      `Form data: Service name: ${data.serviceName}, API Key length: ${String(
        data.apiKey.length
      )}, API Secret provided: ${String(
        Boolean(data.apiSecret.trim())
      )}, Notes provided: ${String(Boolean(data.notes.trim()))}`
    );

    setIsSubmitting(true);
    try {
      console.log("Preparing payload");
      const basePayload = {
        apiKey: data.apiKey.trim(),
        apiSecret:
          data.apiSecret.trim() === "" ? undefined : data.apiSecret.trim(),
        notes: data.notes.trim() === "" ? undefined : data.notes.trim(),
        serviceName: data.serviceName.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full max-w-lg rounded-lg bg-brand-dark p-6 shadow-xl">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          {editingCredential ? "Edit Credential" : "Add New Credential"}
        </h2>
        <form
          onSubmit={(e) => {
            console.log("Form submission initiated");
            return void handleSubmit(onSubmit)(e);
          }}
        >
          <div className="mb-4">
            <label
              className="mb-2 block text-sm font-medium text-gray-300"
              htmlFor="serviceName"
            >
              Service Name
            </label>
            <input
              aria-label="Service Name"
              autoComplete="organization"
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              id="serviceName"
              placeholder="e.g., AWS, Stripe, OpenAI"
              type="text"
              {...register("serviceName", {
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
            {errors.serviceName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.serviceName.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              className="mb-2 block text-sm font-medium text-gray-300"
              htmlFor="apiKey"
            >
              API Key
            </label>
            <div className="relative">
              <input
                aria-label="API Key"
                autoComplete="off"
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
                id="apiKey"
                placeholder="Enter API Key"
                type={showPassword ? "text" : "password"}
                {...register("apiKey", {
                  onBlur: clearSensitiveData,
                  onChange: (e) => {
                    console.log(
                      `API Key field changed (length: ${String(
                        (e as React.ChangeEvent<HTMLInputElement>).target.value
                          .length
                      )})`
                    );
                    handleInputChange();
                  },
                  required: "API Key is required",
                  validate: validateApiKey,
                })}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
            {errors.apiKey && (
              <p className="mt-1 text-sm text-red-500">
                {errors.apiKey.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              className="mb-2 block text-sm font-medium text-gray-300"
              htmlFor="apiSecret"
            >
              API Secret (Optional)
            </label>
            <div className="relative">
              <input
                aria-label="API Secret"
                autoComplete="off"
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
                id="apiSecret"
                placeholder="Enter API Secret"
                type={showSecret ? "text" : "password"}
                {...register("apiSecret", {
                  onBlur: clearSensitiveData,
                  onChange: (e) => {
                    console.log(
                      `API Secret field changed (length: ${String(
                        (e as React.ChangeEvent<HTMLInputElement>).target.value
                          .length
                      )})`
                    );
                    handleInputChange();
                  },
                  validate: validateApiSecret,
                })}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
            {errors.apiSecret && (
              <p className="mt-1 text-sm text-red-500">
                {errors.apiSecret.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              className="mb-2 block text-sm font-medium text-gray-300"
              htmlFor="notes"
            >
              Notes (Optional)
            </label>
            <textarea
              aria-label="Notes"
              autoComplete="off"
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              id="notes"
              placeholder="Any additional notes, e.g., usage instructions, scopes"
              rows={4}
              {...register("notes", {
                maxLength: {
                  message: "Notes must be less than 500 characters",
                  value: 500,
                },
                onChange: (e) => {
                  console.log(
                    `Notes field changed (length: ${String(
                      (e as React.ChangeEvent<HTMLTextAreaElement>).target.value
                        .length
                    )})`
                  );
                },
              })}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-500">
                {errors.notes.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50"
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
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50"
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
  );
};

export default CredentialModal;
