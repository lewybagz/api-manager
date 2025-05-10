import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase"; // Adjust if your firebase.ts is elsewhere
import useAuthStore from "../stores/authStore";
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // To toggle between login and signup
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading, setUser, setLoading, setError } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate("/dashboard"); // Redirect if already logged in
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setError(null); // Clear global auth error

    try {
      let firebaseUser;
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        firebaseUser = userCredential.user;
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        firebaseUser = userCredential.user;
      }
      setUser(firebaseUser); // Update store
      navigate("/dashboard"); // Redirect to dashboard after login/signup
    } catch (err: any) {
      // Use Firebase error messages if available and user-friendly
      let message = "An unexpected error occurred. Please try again.";
      if (err.code) {
        switch (err.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            message = "Invalid email or password.";
            break;
          case "auth/email-already-in-use":
            message = "This email address is already in use.";
            break;
          case "auth/weak-password":
            message = "Password should be at least 6 characters.";
            break;
          default:
            message = err.message; // Fallback to Firebase message
        }
      }
      setFormError(message);
      setError({ name: err.name || "AuthError", message }); // Set global error too if needed
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && !user) {
    // Show a loading indicator if auth state is loading and no user yet
    // This avoids showing login form briefly before redirecting if already logged in
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark">
        <p className="text-brand-light">Loading authentication...</p>
      </div>
    );
  }

  // If user is already set (e.g. from initial load), this page shouldn't be visible (due to useEffect redirect)
  // but as a fallback or if redirect hasn't happened, don't render form.
  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-label="Email address"
                  required
                  className="relative block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {formError && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  aria-label="Password"
                  required
                  className="relative block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {formError && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formError}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign in
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Sign up
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormError(null); // Clear error when toggling form
              }}
              className="text-sm text-brand-blue hover:text-brand-blue-hover"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
