import {
  AlertTriangle,
  Clock,
  Eye,
  Fingerprint,
  FolderPlus,
  KeyRound,
  Lock,
  LogIn,
  Plus,
  RefreshCw,
  Shield,
} from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuthStore from "../stores/authStore";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-dark text-center text-brand-light px-4 py-12">
      {/* Hero Section */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center bg-brand-dark-secondary rounded-2xl shadow-2xl p-8 sm:p-12 mb-10 animate-fade-in">
        <Shield className="h-14 w-14 text-brand-blue mb-4 animate-pop-in" />
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          API Credentials Manager
        </h1>
        <p className="text-lg text-brand-light-secondary mb-6 max-w-xl">
          Enterprise-grade security for your API keys and credentials. Your
          secrets are encrypted on your device and never leave unencrypted.
        </p>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          {user ? (
            <>
              <button
                className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-3 px-6 rounded-lg text-md shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue"
                onClick={() => {
                  void navigate("/dashboard");
                }}
              >
                <FolderPlus className="h-5 w-5" />
                Go to Dashboard
              </button>
              <button
                className="flex items-center gap-2 bg-gray-700 hover:bg-brand-blue text-white font-semibold py-3 px-6 rounded-lg text-md shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue"
                onClick={() => {
                  void navigate("/dashboard", {
                    state: { quickAdd: "project" },
                  });
                }}
              >
                <Plus className="h-5 w-5" />
                Add Project
              </button>
              <button
                className="flex items-center gap-2 bg-gray-700 hover:bg-brand-blue text-white font-semibold py-3 px-6 rounded-lg text-md shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue"
                onClick={() => {
                  void navigate("/dashboard", {
                    state: { quickAdd: "credential" },
                  });
                }}
              >
                <KeyRound className="h-5 w-5" />
                Add Credential
              </button>
            </>
          ) : (
            <Link
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-3 px-6 rounded-lg text-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue"
              to="/login"
            >
              <LogIn className="h-5 w-5" />
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Security Features Section */}
      <div className="w-full max-w-4xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">
          Enterprise-Grade Security
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
            <Fingerprint className="h-8 w-8 text-brand-blue mb-3" />
            <h3 className="text-lg font-semibold mb-2">
              Zero-Knowledge Encryption
            </h3>
            <p className="text-brand-light-secondary text-sm">
              Your master password never leaves your device. We can't access
              your encrypted data.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
            <Lock className="h-8 w-8 text-brand-blue mb-3" />
            <h3 className="text-lg font-semibold mb-2">AES-256 Encryption</h3>
            <p className="text-brand-light-secondary text-sm">
              Industry-standard encryption with 310,000 PBKDF2 iterations for
              maximum security.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
            <Eye className="h-8 w-8 text-brand-blue mb-3" />
            <h3 className="text-lg font-semibold mb-2">Secure Display</h3>
            <p className="text-brand-light-secondary text-sm">
              Credentials are masked by default and only revealed when needed.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
            <Clock className="h-8 w-8 text-brand-blue mb-3" />
            <h3 className="text-lg font-semibold mb-2">Auto-Lock Protection</h3>
            <p className="text-brand-light-secondary text-sm">
              Automatic session timeout and memory clearing after 30 minutes of
              inactivity.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
            <AlertTriangle className="h-8 w-8 text-brand-blue mb-3" />
            <h3 className="text-lg font-semibold mb-2">
              Brute Force Protection
            </h3>
            <p className="text-brand-light-secondary text-sm">
              Rate limiting and automatic lockout after 5 failed attempts.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
            <RefreshCw className="h-8 w-8 text-brand-blue mb-3" />
            <h3 className="text-lg font-semibold mb-2">Regular Updates</h3>
            <p className="text-brand-light-secondary text-sm">
              Continuous security updates and feature enhancements to keep your
              data safe.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4 animate-fade-in">
        <div className="flex flex-col items-center bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
          <FolderPlus className="h-8 w-8 text-brand-blue mb-2" />
          <h3 className="text-lg font-semibold mb-1">Unlimited Projects</h3>
          <p className="text-brand-light-secondary text-sm">
            Organize credentials by project with role-based access control.
          </p>
        </div>
        <div className="flex flex-col items-center bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
          <KeyRound className="h-8 w-8 text-brand-blue mb-2" />
          <h3 className="text-lg font-semibold mb-1">Secure Storage</h3>
          <p className="text-brand-light-secondary text-sm">
            All secrets are encrypted client-side with your master password.
          </p>
        </div>
        <div className="flex flex-col items-center bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
          <Shield className="h-8 w-8 text-brand-blue mb-2" />
          <h3 className="text-lg font-semibold mb-1">Master Password</h3>
          <p className="text-brand-light-secondary text-sm">
            Only you can decrypt your data. No one else, not even us.
          </p>
        </div>
        <div className="flex flex-col items-center bg-gray-800 rounded-xl p-6 shadow-md border border-gray-700 hover:border-brand-blue transition-all">
          <Plus className="h-8 w-8 text-brand-blue mb-2" />
          <h3 className="text-lg font-semibold mb-1">Quick Add & Copy</h3>
          <p className="text-brand-light-secondary text-sm">
            Add, edit, and copy credentials with secure clipboard handling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
