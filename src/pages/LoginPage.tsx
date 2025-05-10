import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // Adjust if your firebase.ts is elsewhere
import useAuthStore from "../stores/authStore";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading, setUser, setLoading, setError } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      navigate("/dashboard");
    } catch (err: any) {
      let message = "An unexpected error occurred. Please try again.";
      if (err.code) {
        switch (err.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            message = "Invalid email or password.";
            break;
          default:
            message = err.message;
        }
      }
      setFormError(message);
      setError({ name: err.name || "AuthError", message });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center">
          <Shield className="h-10 w-10 text-brand-blue animate-spin mb-4" />
          <p className="text-brand-light text-lg animate-pulse">
            Loading authentication...
          </p>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-brand-dark-secondary rounded-2xl shadow-2xl px-8 py-10 sm:p-10 flex flex-col items-center animate-fade-in">
          <Shield className="h-12 w-12 text-brand-blue mb-3 animate-pop-in" />
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            API Manager
          </h1>
          <p className="text-brand-light-secondary mb-6 text-center text-base">
            Securely manage your API credentials in one place.
          </p>
          <h2 className="text-xl font-semibold text-white mb-6">
            Sign in to your account
          </h2>
          <form
            className="space-y-6 w-full"
            onSubmit={handleSubmit}
            autoComplete="on"
          >
            <div className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-brand-light-secondary mb-1 block"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    aria-label="Email address"
                    required
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-brand-light-secondary mb-1 block"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-label="Password"
                    required
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-10 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-blue focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {formError && (
              <div className="flex items-center mt-2 text-red-400 animate-fade-in">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">{formError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-brand-blue px-3 py-2 text-base font-semibold text-white hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 animate-spin" /> Loading...
                </span>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
