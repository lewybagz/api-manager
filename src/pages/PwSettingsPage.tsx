import { useState } from "react";
import useAuthStore from "../stores/authStore";
import useUserStore from "../stores/userStore";
import ProfileInformationForm from "../components/profile/ProfileInformationForm";
import PasswordSecurityForm from "../components/profile/PasswordSecurityForm";

export default function PwSettingsPage() {
  const { user } = useAuthStore();
  const { userDoc } = useUserStore();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  return (
    <div className="space-y-4">
      <div className="pw-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-red-200">Settings</h1>
            <p className="text-[color:var(--pw-muted)] text-sm">
              Manage account information and security. Since this is a password
              manager, you can also change your password here. But I would'nt
              recommend storing your password in this app because it that would
              create an infinite loop of password storage. On the contrary, if
              you wanted to store that password here, that would be completely
              viable given this app is very secure and no one will know your
              password. Where the redundancy comes in is that you would
              technically only need the password to this app in order to access
              this app, but if you can't access this app, you can't access your
              other passwords either. If you have read this far, you are either
              a developer or a very curious person. Or an idiot.
            </p>
          </div>
          <div className="bg-[color:var(--pw-card)] text-red-300 px-3 py-1 rounded-lg text-xs">
            PW Mode
          </div>
        </div>
      </div>

      <div className="pw-card p-2">
        <div className="flex border-b border-[color:var(--pw-border)] mb-2">
          <button
            className={`px-3 py-2 text-sm border-b-2 ${
              activeTab === "profile"
                ? "border-red-400 text-red-300"
                : "border-transparent text-[color:var(--pw-muted)] hover:text-red-300"
            }`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            Profile Information
          </button>
          <button
            className={`px-3 py-2 text-sm border-b-2 ${
              activeTab === "security"
                ? "border-red-400 text-red-300"
                : "border-transparent text-[color:var(--pw-muted)] hover:text-red-300"
            }`}
            onClick={() => setActiveTab("security")}
            type="button"
          >
            Password & Security
          </button>
        </div>

        <div className="p-4">
          {activeTab === "profile" ? (
            <ProfileInformationForm
              firebaseUser={user}
              initialDisplayName={userDoc?.displayName ?? ""}
              initialEmail={userDoc?.email ?? ""}
              variant="pw"
            />
          ) : (
            <PasswordSecurityForm firebaseUser={user} variant="pw" />
          )}
        </div>
      </div>
    </div>
  );
}
