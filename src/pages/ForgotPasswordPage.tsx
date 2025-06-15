import { sendPasswordResetEmail } from "firebase/auth";
import { AlertCircle, CheckCircle, Mail, Shield } from "lucide-react";
import React, { useState } from "react";

import { auth } from "../firebase";

interface FirebaseError {
  code?: string;
  message?: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: unknown) {
      const error = err as FirebaseError;
      let message = "An error occurred. Please try again.";
      if (error.code === "auth/user-not-found") {
        message = "No account found with that email.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.message) {
        message = error.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-brand-dark-secondary/90 to-brand-dark-secondary/70 backdrop-blur-xl border border-brand-blue/30 rounded-3xl shadow-2xl px-8 py-12 flex flex-col items-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-primary rounded-full flex items-center justify-center mb-6 animate-pop-in">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Reset Password
          </h1>
          <p className="text-brand-light-secondary mb-8 text-center text-base leading-relaxed">
            Enter your email address and we'll send you a secure link to reset
            your password.
          </p>

          {submitted ? (
            <div className="flex flex-col items-center text-center w-full">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-green-400 mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We've sent a password reset link to your email address. Click
                the link to create a new password.
              </p>
              <a
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                href="/login"
              >
                Back to Login
              </a>
            </div>
          ) : (
            <form
              autoComplete="on"
              className="space-y-6 w-full animate-fade-in"
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
            >
              <div className="relative">
                <label
                  className="block text-sm font-medium text-brand-light-secondary mb-2"
                  htmlFor="forgotEmail"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    aria-label="Email address"
                    autoComplete="email"
                    className="block w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200"
                    id="forgotEmail"
                    name="forgotEmail"
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder="Enter your email address"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start p-4 bg-red-900/30 border border-red-500/50 rounded-xl animate-fade-in">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-400 leading-relaxed">
                    {error}
                  </span>
                </div>
              )}

              <button
                className="w-full bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Sending Reset Link...
                  </span>
                ) : (
                  <>Send Reset Link</>
                )}
              </button>

              <div className="text-center pt-4">
                <a
                  className="text-sm text-brand-blue hover:text-brand-blue-hover transition-colors duration-200"
                  href="/login"
                >
                  ← Back to Login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
