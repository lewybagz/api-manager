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
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary">
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-brand-light px-4 py-12">
        {/* Enhanced Hero Section */}
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center bg-gradient-to-br from-brand-dark-secondary/90 to-brand-dark-secondary/70 backdrop-blur-xl border border-brand-blue/30 rounded-3xl shadow-2xl p-8 sm:p-16 mb-16 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-blue to-brand-primary rounded-full flex items-center justify-center mb-8 animate-pop-in shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-brand-light via-brand-blue to-brand-primary bg-clip-text text-transparent">
              Zeker
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-brand-light-secondary mb-8 max-w-3xl leading-relaxed">
            Enterprise-grade security for your API keys and credentials. Your
            secrets are encrypted on your device and never leave unencrypted.
          </p>

          {/* Enhanced Quick Actions */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {user ? (
              <>
                <button
                  className="flex items-center gap-3 bg-gradient-to-r from-brand-blue/80 to-brand-blue hover:from-brand-blue hover:to-brand-blue-hover text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm border border-brand-blue/30"
                  onClick={() => {
                    void navigate("/dashboard");
                  }}
                >
                  <FolderPlus className="h-6 w-6" />
                  Go to Dashboard
                </button>
                <button
                  className="flex items-center gap-3 bg-gradient-to-r from-brand-primary/80 to-brand-primary hover:from-brand-primary hover:to-brand-primary-dark text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm border border-brand-primary/30"
                  onClick={() => {
                    void navigate("/dashboard", {
                      state: { quickAdd: "project" },
                    });
                  }}
                >
                  <Plus className="h-6 w-6" />
                  Add Project
                </button>
                <button
                  className="flex items-center gap-3 bg-gradient-to-r from-green-600/80 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm border border-green-600/30"
                  onClick={() => {
                    void navigate("/dashboard", {
                      state: { quickAdd: "credential" },
                    });
                  }}
                >
                  <KeyRound className="h-6 w-6" />
                  Add Credential
                </button>
              </>
            ) : (
              <Link
                className="flex items-center gap-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-4 px-8 rounded-xl text-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                to="/login"
              >
                <LogIn className="h-6 w-6" />
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced Security Features Section */}
        <div className="w-full max-w-7xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-brand-light via-brand-blue to-brand-primary bg-clip-text text-transparent">
                Enterprise-Grade Security
              </span>
            </h2>
            <p className="text-lg text-brand-light-secondary max-w-2xl mx-auto">
              Built with zero-knowledge architecture and military-grade
              encryption
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-brand-blue/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Zero-Knowledge Encryption
              </h3>
              <p className="text-brand-light-secondary leading-relaxed">
                Your master password never leaves your device. We can't access
                your encrypted data, ensuring complete privacy.
              </p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                AES-256 Encryption
              </h3>
              <p className="text-brand-light-secondary leading-relaxed">
                Industry-standard encryption with 310,000 PBKDF2 iterations for
                maximum security against brute force attacks.
              </p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Secure Display
              </h3>
              <p className="text-brand-light-secondary leading-relaxed">
                Credentials are masked by default and only revealed when needed,
                protecting against shoulder surfing.
              </p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Auto-Lock Protection
              </h3>
              <p className="text-brand-light-secondary leading-relaxed">
                Automatic session timeout and memory clearing after 30 minutes
                of inactivity for enhanced security.
              </p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Brute Force Protection
              </h3>
              <p className="text-brand-light-secondary leading-relaxed">
                Rate limiting and automatic lockout after 5 failed attempts to
                prevent unauthorized access.
              </p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Regular Updates
              </h3>
              <p className="text-brand-light-secondary leading-relaxed">
                Continuous security updates and feature enhancements to keep
                your data safe and secure.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-brand-light via-brand-blue to-brand-primary bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-lg text-brand-light-secondary max-w-2xl mx-auto">
              Everything you need to manage your API credentials securely
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-fade-in">
            <div className="flex flex-col items-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-brand-blue/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FolderPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Unlimited Projects
              </h3>
              <p className="text-brand-light-secondary text-center leading-relaxed">
                Organize credentials by project with intuitive management and
                role-based access control.
              </p>
            </div>

            <div className="flex flex-col items-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Secure Storage
              </h3>
              <p className="text-brand-light-secondary text-center leading-relaxed">
                All secrets are encrypted client-side with your master password
                before being stored securely.
              </p>
            </div>

            <div className="flex flex-col items-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Master Password
              </h3>
              <p className="text-brand-light-secondary text-center leading-relaxed">
                Only you can decrypt your data. No one else, not even us, has
                access to your credentials.
              </p>
            </div>

            <div className="flex flex-col items-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-brand-light">
                Quick Add & Copy
              </h3>
              <p className="text-brand-light-secondary text-center leading-relaxed">
                Add, edit, and copy credentials with secure clipboard handling
                and instant access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
