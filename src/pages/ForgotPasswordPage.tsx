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
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-brand-dark-secondary rounded-2xl shadow-2xl px-8 py-10 sm:p-10 flex flex-col items-center animate-fade-in">
          <Shield className="h-12 w-12 text-brand-blue mb-3 animate-pop-in" />
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-brand-light-secondary mb-6 text-center text-base">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
          {submitted ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-green-400 font-semibold mb-2">
                Check your email for a password reset link.
              </p>
              <a className="text-brand-blue hover:underline mt-2" href="/login">
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
                  className="text-sm font-medium text-brand-light-secondary mb-1 block"
                  htmlFor="forgotEmail"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                  <input
                    aria-label="Email address"
                    autoComplete="email"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-3 text-white placeholder-gray-400  transition-all"
                    id="forgotEmail"
                    name="forgotEmail"
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder="Email address"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center mt-2 text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <button
                className="group relative flex w-full justify-center rounded-md bg-brand-blue px-3 py-2 text-base font-semibold text-white hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 animate-spin" /> Sending...
                  </span>
                ) : (
                  <>Send Reset Link</>
                )}
              </button>
              <div className="text-center mt-4">
                <a
                  className="text-sm text-brand-blue hover:underline"
                  href="/login"
                >
                  Back to Login
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
