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
  Loader2,
  Lock,
  LogIn,
  Mail,
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
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-brand-light text-lg animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center relative overflow-hidden px-2 sm:px-0">
      {/* Enhanced SVG Background */}
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-30">
        <svg
          height="100%"
          viewBox="0 0 1600 800"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect fill="transparent" height="800" width="1600" />
          <g fillOpacity="0.1">
            <polygon
              fill="#3b82f6"
              points="800 100 0 200 0 800 1600 800 1600 200"
            />
            <polygon
              fill="#1d4ed8"
              points="800 200 0 400 0 800 1600 800 1600 400"
            />
            <polygon
              fill="#1e40af"
              points="800 300 0 600 0 800 1600 800 1600 600"
            />
            <polygon fill="#1e3a8a" points="1600 800 800 400 0 800" />
            <polygon fill="#172554" points="1280 800 800 500 320 800" />
            <polygon fill="#0f172a" points="533.3 800 1066.7 800 800 600" />
            <polygon fill="#020617" points="684.1 800 914.3 800 800 700" />
          </g>
        </svg>
      </div>

      <div className="w-full max-w-md bg-gradient-to-br from-brand-dark-secondary/90 to-brand-dark-secondary/70 backdrop-blur-xl border border-brand-blue/30 shadow-2xl rounded-3xl p-4 sm:p-8 pt-4 animate-fade-in mx-2 sm:mx-0">
        <div className="flex flex-col items-center">
          <img
            alt="Zeker Logo"
            className="h-20 w-20 sm:h-32 sm:w-32 animate-pop-in mb-2"
            src="/assets/logos/logo-192x192.png"
          />
          <h1 className="flex flex-col items-center justify-center text-3xl sm:text-4xl text-white mb-2 tracking-tight">
            <span className="flex flex-col items-center justify-center text-brand-light">
              Zeker
              <span className="text-brand-blue text-sm tracking-wide">
                Powered by Tovuti
              </span>
            </span>
          </h1>
          <p className="text-brand-light-secondary mb-8 text-center text-base leading-relaxed">
            Securely manage your API credentials in one place.
          </p>

          {isLimited && (
            <div className="w-full mb-6 p-4 bg-gradient-to-r from-red-900/40 to-red-800/30 border border-red-500/50 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-medium text-sm">
                  Account Temporarily Locked
                </p>
                <p className="text-red-300 text-xs">
                  Try again in {Math.ceil(remainingTime / 60000)} minutes
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Tab Switcher */}
          <div className="flex w-full mb-8 bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
            <button
              aria-current={!isRegister}
              className={`flex-1 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                !isRegister
                  ? "bg-brand-blue text-white shadow-lg"
                  : "text-brand-light-secondary hover:text-white hover:bg-gray-700/50"
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
              className={`flex-1 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                isRegister
                  ? "bg-brand-blue text-white shadow-lg"
                  : "text-brand-light-secondary hover:text-white hover:bg-gray-700/50"
              }`}
              onClick={() => {
                setIsRegister(true);
              }}
              type="button"
            >
              Register
            </button>
          </div>

          {/* Enhanced Login Form */}
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
              <div className="space-y-5">
                <div className="relative">
                  <label
                    className="block text-sm font-medium text-brand-light-secondary mb-2"
                    htmlFor="email"
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
                      className="block w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200 text-sm sm:text-base"
                      disabled={isSubmitting}
                      id="email"
                      name="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      placeholder="Enter your email"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label
                    className="block text-sm font-medium text-brand-light-secondary mb-2"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      aria-label="Password"
                      autoComplete="current-password"
                      className="block w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm py-3 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200 text-sm sm:text-base"
                      disabled={isSubmitting}
                      id="password"
                      name="password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      placeholder="Enter your password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-blue focus:outline-none transition-colors duration-200"
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
                <div className="flex items-start p-4 bg-red-900/30 border border-red-500/50 rounded-xl animate-fade-in">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-400 leading-relaxed">
                    {authError.message}
                  </span>
                </div>
              )}

              <button
                className="w-full bg-brand-blue hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-base"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn className="h-5 w-5 mr-3" />
                    Sign in
                  </span>
                )}
              </button>

              <div className="text-center pt-2">
                <a
                  className="text-sm text-brand-blue hover:text-brand-blue-hover transition-colors duration-200"
                  href="/forgot-password"
                >
                  Forgot your password?
                </a>
              </div>
            </form>
          )}

          {/* Enhanced Register Form */}
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
              <div className="space-y-5">
                <div className="relative">
                  <label
                    className="block text-sm font-medium text-brand-light-secondary mb-2"
                    htmlFor="registerName"
                  >
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      aria-label="Display Name"
                      autoComplete="name"
                      className="block w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200 text-sm sm:text-base"
                      id="registerName"
                      name="registerName"
                      onChange={(e) => {
                        setRegisterName(e.target.value);
                      }}
                      placeholder="Your full name"
                      required
                      type="text"
                      value={registerName}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label
                    className="block text-sm font-medium text-brand-light-secondary mb-2"
                    htmlFor="registerEmail"
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
                      className="block w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200 text-sm sm:text-base"
                      id="registerEmail"
                      name="registerEmail"
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                      }}
                      placeholder="Enter your email"
                      required
                      type="email"
                      value={registerEmail}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label
                    className="block text-sm font-medium text-brand-light-secondary mb-2"
                    htmlFor="registerPassword"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      aria-label="Password"
                      autoComplete="new-password"
                      className="block w-full rounded-xl border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm py-3 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all duration-200 text-sm sm:text-base"
                      id="registerPassword"
                      name="registerPassword"
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                      }}
                      placeholder="Create a strong password"
                      required
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerPassword}
                    />
                    <button
                      aria-label={
                        showRegisterPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-blue focus:outline-none transition-colors duration-200"
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
                  {/* Enhanced Password Strength Meter */}
                  {registerPassword && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                                passwordStrength.score >= level
                                  ? passwordStrength.color
                                  : "bg-gray-700"
                              }`}
                              key={level}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-xs font-semibold ${passwordStrength.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {registerError && (
                <div className="flex items-start p-4 bg-red-900/30 border border-red-500/50 rounded-xl animate-fade-in">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-400 leading-relaxed">
                    {registerError}
                  </span>
                </div>
              )}

              <button
                className="w-full bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-base"
                disabled={!registerName.trim() || passwordStrength.score < 4}
                type="submit"
              >
                <span className="flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-3" />
                      Create Account
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
