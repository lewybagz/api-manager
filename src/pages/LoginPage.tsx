import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Shield,
  UserPlus,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { ErrorCategory, logger } from "../services/logger";
import useAuthStore from "../stores/authStore";
import useRateLimitStore from "../stores/rateLimitStore";

function getPasswordStrength(password: string): {
  color: string;
  label: string;
  score: number;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  let label = "Very Weak";
  let color = "bg-red-500";
  if (score >= 5) {
    label = "Strong";
    color = "bg-green-500";
  } else if (score >= 4) {
    label = "Good";
    color = "bg-yellow-500";
  } else if (score >= 3) {
    label = "Fair";
    color = "bg-orange-400";
  } else if (score >= 2) {
    label = "Weak";
    color = "bg-red-400";
  }
  return { color, label, score };
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerError, setRegisterError] = useState<null | string>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLimited, setIsLimited] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerPassword),
    [registerPassword]
  );

  const navigate = useNavigate();
  const {
    error: authError,
    isLoading,
    setError: authSetError,
    setUser,
    user,
  } = useAuthStore();
  const {
    addFailedAttempt,
    getRemainingLockoutTime,
    isRateLimited,
    resetAttempts,
  } = useRateLimitStore();

  useEffect(() => {
    if (user) {
      void navigate("/dashboard");
    }
  }, [user, navigate]);

  // Update remaining time every second if rate limited
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const checkRateLimit = async () => {
      const limited = await isRateLimited(email);
      setIsLimited(limited);
      if (limited) {
        interval = setInterval(() => {
          void (async () => {
            const time = await getRemainingLockoutTime(email);
            setRemainingTime(time);
            if (time <= 0) {
              clearInterval(interval);
            }
          })();
        }, 1000);
      }
    };
    void checkRateLimit();
    return () => {
      clearInterval(interval);
    };
  }, [email, isRateLimited, getRemainingLockoutTime]);

  const validateForm = () => {
    if (!email || !password) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    authSetError(null);

    try {
      logger.info(ErrorCategory.AUTH, "Attempting login", {
        action: "login",
        email,
      });

      // Check rate limiting
      const isLimited = await isRateLimited(email);
      if (isLimited) {
        const remainingTime = await getRemainingLockoutTime(email);
        const minutes = Math.ceil(remainingTime / 60000);
        logger.warn(ErrorCategory.AUTH, "Login attempt while rate limited", {
          action: "login",
          email,
          remainingTime: minutes,
        });
        authSetError(
          new Error(
            `Too many failed attempts. Please try again in ${String(
              minutes
            )} minutes.`
          )
        );
        setIsSubmitting(false);
        return;
      }

      // Attempt login
      logger.info(ErrorCategory.AUTH, "Attempting Firebase authentication", {
        action: "login",
        email,
      });
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Clear rate limit on successful login
      await resetAttempts(email);

      // Set user in auth store
      setUser(userCredential.user);

      logger.info(ErrorCategory.AUTH, "Login successful", {
        action: "login",
        userId: userCredential.user.uid,
      });

      // Navigate to dashboard
      void navigate("/dashboard");
    } catch (error: unknown) {
      logger.error(ErrorCategory.AUTH, "Login failed", {
        action: "login",
        code: (error as { code?: string }).code,
        error,
      });
      if ((error as { code?: string }).code === "auth/invalid-credential") {
        // Add failed attempt
        await addFailedAttempt(email);
        authSetError(new Error("Invalid email or password"));
      } else if (
        (error as { code?: string }).code === "auth/too-many-requests"
      ) {
        authSetError(
          new Error(
            "Too many failed attempts. Please try again later or reset your password."
          )
        );
      } else {
        authSetError(
          new Error(
            (error as Error).message || "An error occurred during login"
          )
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);

    if (!registerName.trim()) {
      logger.warn(
        ErrorCategory.VALIDATION,
        "Registration attempt without name",
        {
          action: "register",
          email: registerEmail,
        }
      );
      setRegisterError("Name is required.");
      setRegisterLoading(false);
      return;
    }

    if (passwordStrength.score < 4) {
      logger.warn(
        ErrorCategory.VALIDATION,
        "Registration attempt with weak password",
        {
          action: "register",
          email: registerEmail,
          passwordStrength: passwordStrength.score,
        }
      );
      setRegisterError("Password is too weak.");
      setRegisterLoading(false);
      return;
    }

    try {
      logger.info(ErrorCategory.AUTH, "Attempting registration", {
        action: "register",
        email: registerEmail,
        name: registerName,
      });

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );

      // Create Firestore user doc
      const userDoc = {
        createdAt: serverTimestamp(),
        displayName: registerName,
        email: registerEmail,
        roles: ["user"],
        uid: userCredential.user.uid,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userDoc);

      logger.info(ErrorCategory.AUTH, "Registration successful", {
        action: "register",
        userId: userCredential.user.uid,
      });

      setUser(userCredential.user);
      void navigate("/dashboard");
    } catch (err: unknown) {
      let message = "An unexpected error occurred. Please try again.";
      const error = err as { code?: string; message?: string };
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            logger.warn(
              ErrorCategory.AUTH,
              "Registration attempt with existing email",
              {
                action: "register",
                email: registerEmail,
                error: err,
              }
            );
            message = "This email address is already in use.";
            break;
          case "auth/weak-password":
            logger.warn(
              ErrorCategory.VALIDATION,
              "Registration attempt with weak password",
              {
                action: "register",
                email: registerEmail,
                error: err,
              }
            );
            message = "Password should be at least 6 characters.";
            break;
          default:
            logger.error(ErrorCategory.AUTH, "Registration failed", {
              action: "register",
              email: registerEmail,
              error: err,
            });
            message = error.message ?? "An unexpected error occurred.";
        }
      }
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  if ((isLoading && !user) || registerLoading) {
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

          {isLimited && (
            <div className="w-full mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-400" />
              <p className="text-red-400">
                Too many failed attempts. Please try again in{" "}
                {String(Math.ceil(Number(remainingTime) / 60000))} minutes.
              </p>
            </div>
          )}

          <div className="flex w-full mb-6">
            <button
              aria-current={!isRegister}
              className={`flex-1 py-2 rounded-l-lg text-lg font-semibold transition-all ${
                !isRegister
                  ? "bg-brand-blue text-white"
                  : "bg-gray-800 text-brand-light-secondary hover:bg-brand-blue hover:text-white"
              }`}
              onClick={() => {
                setIsRegister(false);
              }}
              type="button"
            >
              Sign In
            </button>
            <button
              aria-current={isRegister}
              className={`flex-1 py-2 rounded-r-lg text-lg font-semibold transition-all ${
                isRegister
                  ? "bg-brand-blue text-white"
                  : "bg-gray-800 text-brand-light-secondary hover:bg-brand-blue hover:text-white"
              }`}
              onClick={() => {
                setIsRegister(true);
              }}
              type="button"
            >
              Register
            </button>
          </div>
          {/* Login Form */}
          {!isRegister && (
            <form
              autoComplete="on"
              className="space-y-6 w-full animate-fade-in"
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
            >
              {/* Hidden username field for accessibility */}
              <input
                aria-hidden="true"
                autoComplete="username"
                className="sr-only"
                name="username"
                readOnly
                tabIndex={-1}
                type="text"
                value={email}
              />
              <div className="space-y-4">
                <div className="relative">
                  <label
                    className="text-sm font-medium text-brand-light-secondary mb-1 block"
                    htmlFor="email"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      aria-label="Email address"
                      autoComplete="email"
                      className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                      disabled={isSubmitting}
                      id="email"
                      name="email"
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
                <div className="relative">
                  <label
                    className="text-sm font-medium text-brand-light-secondary mb-1 block"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      aria-label="Password"
                      autoComplete="current-password"
                      className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-10 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                      disabled={isSubmitting}
                      id="password"
                      name="password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      placeholder="Password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-blue focus:outline-none"
                      disabled={isSubmitting}
                      onClick={() => {
                        setShowPassword((v) => !v);
                      }}
                      tabIndex={-1}
                      type="button"
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
              {authError && (
                <div className="flex items-center mt-2 text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{authError.message}</span>
                </div>
              )}
              <button
                className="group relative flex w-full justify-center rounded-md bg-brand-blue px-3 py-2 text-base font-semibold text-white hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
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
              <div className="text-right mt-2">
                <a
                  className="text-sm text-brand-blue hover:underline focus:outline-none"
                  href="/forgot-password"
                >
                  Forgot password?
                </a>
              </div>
            </form>
          )}
          {/* Register Form */}
          {isRegister && (
            <form
              autoComplete="on"
              className="space-y-6 w-full animate-fade-in"
              onSubmit={(e) => {
                void handleRegister(e);
              }}
            >
              {/* Hidden username field for accessibility */}
              <input
                aria-hidden="true"
                autoComplete="username"
                className="sr-only"
                name="username"
                readOnly
                tabIndex={-1}
                type="text"
                value={registerEmail}
              />
              <div className="space-y-4">
                <div className="relative">
                  <label
                    className="text-sm font-medium text-brand-light-secondary mb-1 block"
                    htmlFor="registerName"
                  >
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      aria-label="Display Name"
                      autoComplete="name"
                      className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-3 pr-3 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                      id="registerName"
                      name="registerName"
                      onChange={(e) => {
                        setRegisterName(e.target.value);
                      }}
                      placeholder="Your name (required)"
                      required
                      type="text"
                      value={registerName}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label
                    className="text-sm font-medium text-brand-light-secondary mb-1 block"
                    htmlFor="registerEmail"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      aria-label="Email address"
                      autoComplete="email"
                      className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                      id="registerEmail"
                      name="registerEmail"
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                      }}
                      placeholder="Email address"
                      required
                      type="email"
                      value={registerEmail}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label
                    className="text-sm font-medium text-brand-light-secondary mb-1 block"
                    htmlFor="registerPassword"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      aria-label="Password"
                      autoComplete="new-password"
                      className="block w-full rounded-md border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-10 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue transition-all"
                      id="registerPassword"
                      name="registerPassword"
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                      }}
                      placeholder="Password"
                      required
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerPassword}
                    />
                    <button
                      aria-label={
                        showRegisterPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-blue focus:outline-none"
                      onClick={() => {
                        setShowRegisterPassword((v) => !v);
                      }}
                      tabIndex={-1}
                      type="button"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {/* Password Strength Meter */}
                  {registerPassword && (
                    <div className="mt-2 flex flex-col items-start justify-start gap-px">
                      <div
                        className={`h-1 rounded w-24 ${passwordStrength.color} transition-all`}
                      />
                      <span
                        className={`text-xs font-semibold ${passwordStrength.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {registerError && (
                <div className="flex items-center mt-2 text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{registerError}</span>
                </div>
              )}
              <button
                className="group relative flex w-full justify-center rounded-md bg-brand-blue px-3 py-2 text-base font-semibold text-white hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={!registerName.trim() || passwordStrength.score < 4}
                type="submit"
              >
                <span className="flex items-center">
                  {isLoading ? (
                    <>
                      <Shield className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Register
                    </>
                  )}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
