import { useEffect, useState } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import MasterPasswordModal from "./components/auth/MasterPasswordModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MobileHeader from "./components/layout/MobileHeader";
import MobileNav from "./components/layout/MobileNav";
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-brand-dark text-brand-light">
      <MobileHeader
        onMenuOpen={() => {
          setIsMobileNavOpen(true);
        }}
      />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => {
          setIsMobileNavOpen(false);
        }}
      />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 md:ml-64 pl-6 overflow-y-auto">
          <div className="pt-4 md:pt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const {
    closeMasterPasswordModal,
    isLoading: authLoading,
    isMasterPasswordModalExplicitlyOpen,
    masterPasswordSet,
    openMasterPasswordModal,
    subscribeToAuthState,
    user,
  } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState();
    return () => {
      unsubscribe();
    };
  }, [subscribeToAuthState]);

  useEffect(() => {
    if (user && !masterPasswordSet && !authLoading) {
      openMasterPasswordModal();
    }
  }, [user, masterPasswordSet, authLoading, openMasterPasswordModal]);

  return (
    <>
      <AuthGuard />
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<ForgotPasswordPage />} path="/forgot-password" />
        <Route element={<ProtectedRoute />}>
          <Route element={<App />}>
            <Route element={<DashboardPage />} path="dashboard" />
            <Route element={<ProjectDetailPage />} path="project/:projectId" />
            <Route element={<CredentialsPage />} path="credentials" />
            <Route element={<ProfilePage />} path="profile" />
          </Route>
        </Route>
      </Routes>
      {location.pathname !== "/" && (
        <MasterPasswordModal
          isOpen={
            !!(user && !masterPasswordSet && !authLoading) ||
            isMasterPasswordModalExplicitlyOpen
          }
          onClose={closeMasterPasswordModal}
        />
      )}
    </>
  );
}

export default MainApp;
