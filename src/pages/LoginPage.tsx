import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
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
import { Link, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { ErrorCategory, logger } from "../services/logger";
import useAuthStore from "../stores/authStore";
import useRateLimitStore from "../stores/rateLimitStore";
import useUserStore from "../stores/userStore";
import { applyBranding } from "../utils/appBranding";
import { getPasswordStrength } from "../utils/passwordStrength";

const fieldBase =
  "block w-full rounded-xl border border-zk-border bg-zk-base/80 py-3 pl-12 pr-4 font-zk-sans text-sm text-zk-text placeholder:text-zk-muted/50 transition-colors focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30 sm:text-base";

const fieldPassword =
  "block w-full rounded-xl border border-zk-border bg-zk-base/80 py-3 pl-12 pr-12 font-zk-sans text-sm text-zk-text placeholder:text-zk-muted/50 transition-colors focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30 sm:text-base";

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
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("remember_me");
      return raw ? JSON.parse(raw) === true : false;
    } catch {
      return false;
    }
  });

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerPassword),
    [registerPassword],
  );

  const navigate = useNavigate();
  const {
    error: authError,
    isLoading,
    setError: authSetError,
    user,
  } = useAuthStore();
  const { userDoc } = useUserStore();
  const {
    addFailedAttempt,
    getRemainingLockoutTime,
    isRateLimited,
    resetAttempts,
  } = useRateLimitStore();

  useEffect(() => {
    try {
      localStorage.setItem("appType", "api");
    } catch {
      void 0;
    }
    applyBranding();
  }, []);

  useEffect(() => {
    if (!user || !userDoc) return;
    if (userDoc.appType === "pw") {
      void signOut(auth);
      authSetError(
        new Error(
          "This account is for Zeker Passwords. Use the password app sign-in instead.",
        ),
      );
      return;
    }
    void navigate("/dashboard");
  }, [user, userDoc, navigate, authSetError]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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

  const validateForm = () => Boolean(email && password);

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

      const isLimitedNow = await isRateLimited(email);
      if (isLimitedNow) {
        const rem = await getRemainingLockoutTime(email);
        const minutes = Math.ceil(rem / 60000);
        logger.warn(ErrorCategory.AUTH, "Login attempt while rate limited", {
          action: "login",
          email,
          remainingTime: minutes,
        });
        authSetError(
          new Error(
            `Too many failed attempts. Please try again in ${String(minutes)} minutes.`,
          ),
        );
        setIsSubmitting(false);
        return;
      }

      logger.info(ErrorCategory.AUTH, "Attempting Firebase authentication", {
        action: "login",
        email,
      });
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await resetAttempts(email);

      logger.info(ErrorCategory.AUTH, "Login successful", {
        action: "login",
        userId: userCredential.user.uid,
      });
    } catch (error: unknown) {
      logger.error(ErrorCategory.AUTH, "Login failed", {
        action: "login",
        code: (error as { code?: string }).code,
        error,
      });
      if ((error as { code?: string }).code === "auth/invalid-credential") {
        await addFailedAttempt(email);
        authSetError(new Error("Invalid email or password"));
      } else if (
        (error as { code?: string }).code === "auth/too-many-requests"
      ) {
        authSetError(
          new Error(
            "Too many failed attempts. Please try again later or reset your password.",
          ),
        );
      } else {
        authSetError(
          new Error(
            (error as Error).message || "An error occurred during login",
          ),
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
        },
      );
      setRegisterError("Please add your name.");
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
        },
      );
      setRegisterError("Choose a stronger password.");
      setRegisterLoading(false);
      return;
    }

    try {
      logger.info(ErrorCategory.AUTH, "Attempting registration", {
        action: "register",
        email: registerEmail,
        name: registerName,
      });

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword,
      );

      const trialEndsAt = Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );
      const newUserDoc = {
        appType: "api" as const,
        createdAt: serverTimestamp(),
        displayName: registerName,
        email: registerEmail,
        roles: ["user"],
        trialEndsAt,
        uid: userCredential.user.uid,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), newUserDoc);

      logger.info(ErrorCategory.AUTH, "Registration successful", {
        action: "register",
        userId: userCredential.user.uid,
      });

      await useUserStore.getState().fetchUserDoc(userCredential.user.uid);
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
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
              },
            );
            message = "That email is already registered.";
            break;
          case "auth/weak-password":
            message = "Password should be at least 6 characters.";
            break;
          default:
            logger.error(ErrorCategory.AUTH, "Registration failed", {
              action: "register",
              email: registerEmail,
              error: err,
            });
            message = error.message ?? message;
        }
      }
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  if ((isLoading && !user) || registerLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent font-zk-sans text-zk-text">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-zk-indigo" />
          <p className="text-sm text-zk-muted">Signing you in…</p>
        </div>
      </div>
    );
  }

  const tabActive =
    "rounded-lg bg-zk-indigo py-2 text-sm font-semibold text-white shadow-sm";
  const tabIdle =
    "rounded-lg py-2 text-sm font-semibold text-zk-muted transition-colors hover:bg-zk-elevated/50 hover:text-zk-text";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-4 py-10 font-zk-sans text-zk-text sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zk-violet/40 via-zk-base to-zk-surface"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-zk-indigo/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-zk-indigo/5 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zk-border bg-zk-elevated/40 p-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col items-center">
          <img
            alt="ZekerKey"
            className="mb-3 h-20 w-20 sm:h-24 sm:w-24"
            src="/assets/logos/logo-192x192.png"
          />
          <h1 className="mb-1 text-center text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            ZekerKey
          </h1>
          <p className="mb-1 text-center font-zk-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zk-muted">
            Credential manager
          </p>
          <p className="mb-6 text-center text-sm leading-relaxed text-zk-muted">
            Sign in to manage projects and API keys in one place.
          </p>

          <p className="mb-6 text-center text-xs text-zk-muted">
            Looking for{" "}
            <Link
              className="font-medium text-zk-indigo underline-offset-2 hover:text-zk-indigo-hover hover:underline"
              to="/pw/login"
            >
              Zeker Passwords
            </Link>
            ?
          </p>

          {isLimited && (
            <div className="mb-6 flex w-full items-center gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                <Clock className="h-4 w-4 text-red-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-200">
                  Try again later
                </p>
                <p className="text-xs text-red-300/90">
                  Wait about {Math.ceil(remainingTime / 60000)} minutes before
                  signing in again.
                </p>
              </div>
            </div>
          )}

          <div className="mb-0 flex w-full gap-1 rounded-xl border border-zk-border bg-zk-base/50 p-1">
            <button
              aria-current={!isRegister}
              className={`flex-1 ${!isRegister ? tabActive : tabIdle}`}
              onClick={() => {
                setIsRegister(false);
              }}
              type="button"
            >
              Sign in
            </button>
            <button
              aria-current={isRegister}
              className={`flex-1 ${isRegister ? tabActive : tabIdle}`}
              onClick={() => {
                setIsRegister(true);
              }}
              type="button"
            >
              Create account
            </button>
          </div>

          {!isRegister && (
            <form
              autoComplete="on"
              className="w-full space-y-6"
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
            >
              <input
                aria-hidden
                autoComplete="username"
                className="sr-only"
                name="username"
                readOnly
                tabIndex={-1}
                type="text"
                value={email}
              />
              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-zk-muted"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zk-muted" />
                    <input
                      aria-label="Email"
                      autoComplete="email"
                      className={fieldBase}
                      disabled={isSubmitting}
                      id="email"
                      name="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-zk-muted"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zk-muted" />
                    <input
                      aria-label="Password"
                      autoComplete="current-password"
                      className={fieldPassword}
                      disabled={isSubmitting}
                      id="password"
                      name="password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      placeholder="Your password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zk-muted transition-colors hover:bg-zk-elevated/80 hover:text-zk-text"
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
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zk-muted">
                    <input
                      checked={rememberMe}
                      className="rounded border-zk-border bg-zk-base text-zk-indigo focus:ring-zk-indigo/40"
                      onChange={(e) => {
                        const next = e.target.checked;
                        setRememberMe(next);
                        try {
                          localStorage.setItem(
                            "remember_me",
                            JSON.stringify(next),
                          );
                        } catch {
                          void 0;
                        }
                      }}
                      type="checkbox"
                    />
                    Remember me
                  </label>
                  <Link
                    className="text-sm font-medium text-zk-indigo transition-colors hover:text-zk-indigo-hover"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {authError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/25 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <span className="text-sm leading-relaxed text-red-200">
                    {authError.message}
                  </span>
                </div>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zk-indigo py-3 text-sm font-semibold text-white transition-colors hover:bg-zk-indigo-hover disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign in
                  </>
                )}
              </button>
            </form>
          )}

          {isRegister && (
            <form
              autoComplete="on"
              className="w-full space-y-6"
              onSubmit={(e) => {
                void handleRegister(e);
              }}
            >
              <input
                aria-hidden
                autoComplete="username"
                className="sr-only"
                name="username"
                readOnly
                tabIndex={-1}
                type="text"
                value={registerEmail}
              />
              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-zk-muted"
                    htmlFor="registerName"
                  >
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    aria-label="Name"
                    autoComplete="name"
                    className={`${fieldBase} pl-4`}
                    id="registerName"
                    name="registerName"
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                    }}
                    placeholder="Your name"
                    required
                    type="text"
                    value={registerName}
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-zk-muted"
                    htmlFor="registerEmail"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zk-muted" />
                    <input
                      aria-label="Email"
                      autoComplete="email"
                      className={fieldBase}
                      id="registerEmail"
                      name="registerEmail"
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                      }}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={registerEmail}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-zk-muted"
                    htmlFor="registerPassword"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zk-muted" />
                    <input
                      aria-label="Password"
                      autoComplete="new-password"
                      className={fieldPassword}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zk-muted transition-colors hover:bg-zk-elevated/80 hover:text-zk-text"
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
                  {registerPassword ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              className={`h-1.5 w-6 rounded-full transition-colors ${
                                passwordStrength.score >= level
                                  ? passwordStrength.barClass
                                  : "bg-zk-border"
                              }`}
                              key={level}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-xs font-semibold ${passwordStrength.labelClass}`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {registerError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/25 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <span className="text-sm leading-relaxed text-red-200">
                    {registerError}
                  </span>
                </div>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zk-indigo py-3 text-sm font-semibold text-white transition-colors hover:bg-zk-indigo-hover disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  registerLoading ||
                  !registerName.trim() ||
                  passwordStrength.score < 4
                }
                type="submit"
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create account
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
