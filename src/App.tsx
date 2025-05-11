import { useEffect, useState } from "react";
import { Outlet, Route, Routes } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import MasterPasswordModal from "./components/auth/MasterPasswordModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import CredentialsPage from "./pages/CredentialsPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import useAuthStore from "./stores/authStore";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-dark text-brand-light">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const {
    isLoading: authLoading,
    masterPasswordSet,
    subscribeToAuthState,
    user,
  } = useAuthStore();
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] =
    useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState();
    return () => {
      unsubscribe();
    }; // Cleanup subscription on unmount
  }, [subscribeToAuthState]);

  useEffect(() => {
    // Open modal if user is logged in, auth is not loading, and master password is not set
    if (user && !masterPasswordSet && !authLoading) {
      setIsMasterPasswordModalOpen(true);
    }
  }, [user, masterPasswordSet, authLoading]);

  const handleCloseModal = () => {
    setIsMasterPasswordModalOpen(false);
  };

  return (
    <>
      {/* AuthGuard will redirect unauthenticated users to /login */}
      <AuthGuard />

      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<ForgotPasswordPage />} path="/forgot-password" />
        <Route element={<ProtectedRoute />}>
          <Route element={<App />} path="/">
            <Route element={<HomePage />} index />
            <Route element={<DashboardPage />} path="dashboard" />
            <Route element={<ProjectDetailPage />} path="project/:projectId" />
            <Route element={<CredentialsPage />} path="credentials" />
            <Route element={<ProfilePage />} path="profile" />
            {/* Other protected routes will go here, inheriting the App layout and protection */}
          </Route>
        </Route>
      </Routes>
      <MasterPasswordModal
        isOpen={isMasterPasswordModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default MainApp;
