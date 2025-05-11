import { signOut } from "firebase/auth";
import { LogOut, Mail, Shield, User, User2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";
import useUserStore from "../../stores/userStore";

const Navbar: React.FC = () => {
  const { isLoading: authLoading, setError, setUser, user } = useAuthStore();
  const {
    clearUserDoc,
    fetchUserDoc,
    isLoading: userLoading,
    userDoc,
  } = useUserStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      void fetchUserDoc(user.uid);
    } else {
      clearUserDoc();
    }
  }, [user?.uid, fetchUserDoc, clearUserDoc]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      clearUserDoc();
      void navigate("/login");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error);
        console.error("Logout error:", error);
      }
    }
  };

  const isLoading = authLoading || userLoading;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark-secondary h-16 shadow-md">
      <div className="mx-auto pl-12 pr-14 flex items-center justify-between h-full w-full">
        <div className="flex flex-shrink-0 items-center">
          <Shield className="h-8 w-8 text-brand-blue" />
          <span className="ml-2 text-xl font-bold text-white">API Manager</span>
        </div>
        <ul className="flex items-center space-x-4 sm:space-x-6">
          <li>
            <Link
              className="text-brand-light-secondary hover:text-brand-light transition-colors"
              to="/"
            >
              Home
            </Link>
          </li>
          {isLoading ? (
            <li>
              <span className="text-brand-light-secondary">Loading...</span>
            </li>
          ) : user ? (
            <>
              <li>
                <Link
                  className="text-brand-light-secondary hover:text-brand-light transition-colors"
                  to="/dashboard"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="relative ml-3">
                  <div>
                    <button
                      aria-expanded="false"
                      aria-haspopup="true"
                      className="flex rounded-full bg-brand-dark-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-dark"
                      id="user-menu-button"
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      type="button"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-brand-blue flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </button>
                  </div>

                  {isOpen && (
                    <div
                      aria-labelledby="user-menu-button"
                      aria-orientation="vertical"
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-brand-dark-secondary py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      role="menu"
                      tabIndex={-1}
                    >
                      <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                        <div className="flex items-center ">
                          <User2 className="h-4 w-4 mr-2 text-brand-blue" />
                          <p className="font-medium">{userDoc?.displayName}</p>
                        </div>
                        <div className="h-px bg-gray-700 my-2" />
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-brand-blue" />
                          <p className="text-gray-400">{userDoc?.email}</p>
                        </div>
                      </div>
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => void handleLogout()}
                        role="menuitem"
                        tabIndex={-1}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </>
          ) : (
            <li>
              <Link
                className="text-brand-light-secondary hover:text-brand-light transition-colors"
                to="/login"
              >
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
