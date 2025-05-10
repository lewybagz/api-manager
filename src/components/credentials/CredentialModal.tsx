import { useEffect, useState } from "react";
import useCredentialStore, {
  type DecryptedCredential,
} from "../../stores/credentialStore";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

interface CredentialFormData {
  serviceName: string;
  apiKey: string;
  apiSecret: string;
  notes: string;
}

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  editingCredential?: DecryptedCredential | null;
}

const CredentialModal = ({
  isOpen,
  onClose,
  projectId,
  editingCredential,
}: CredentialModalProps) => {
  const { addCredential, updateCredential } = useCredentialStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CredentialFormData>({
    defaultValues: {
      serviceName: "",
      apiKey: "",
      apiSecret: "",
      notes: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCredential) {
      setValue("serviceName", editingCredential.serviceName);
      setValue("apiKey", editingCredential.apiKey);
      setValue("apiSecret", editingCredential.apiSecret || "");
      setValue("notes", editingCredential.notes || "");
    } else {
      reset({
        serviceName: "",
        apiKey: "",
        apiSecret: "",
        notes: "",
      });
    }
  }, [editingCredential, setValue, reset]);

  const onSubmit: SubmitHandler<CredentialFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const basePayload = {
        serviceName: data.serviceName,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret.trim() === "" ? undefined : data.apiSecret,
        notes: data.notes.trim() === "" ? undefined : data.notes,
      };

      if (editingCredential) {
        await updateCredential(editingCredential.id, projectId, basePayload);
      } else {
        const addPayload = {
          ...basePayload,
          projectId: projectId,
        };
        await addCredential(projectId, addPayload);
      }
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to save credential:", error);
      // TODO: Display error to user in the modal
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="serviceName"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Service Name
            </label>
            <input
              id="serviceName"
              type="text"
              autoComplete="organization"
              aria-label="Service Name"
              {...register("serviceName", {
                required: "Service name is required",
              })}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., AWS, Stripe, OpenAI"
            />
            {errors.serviceName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.serviceName.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="apiKey"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              API Key
            </label>
            <input
              id="apiKey"
              type="text"
              autoComplete="off"
              aria-label="API Key"
              {...register("apiKey", {
                required: "API Key is required",
                validate: (value) =>
                  value.trim().length > 0 || "API Key cannot be empty",
              })}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter API Key (e.g., smtp.gmail.com, sk_live_123...)"
            />
            {errors.apiKey && (
              <p className="mt-1 text-sm text-red-500">
                {errors.apiKey.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="apiSecret"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              API Secret (Optional)
            </label>
            <input
              id="apiSecret"
              type="text"
              autoComplete="off"
              aria-label="API Secret"
              {...register("apiSecret")}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter API Secret"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              autoComplete="off"
              aria-label="Notes"
              {...register("notes")}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any additional notes, e.g., usage instructions, scopes"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isSubmitting}
              className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50"
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
