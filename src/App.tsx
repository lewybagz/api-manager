import { useEffect, useState } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import MasterPasswordModal from "./components/auth/MasterPasswordModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriptionGuard from "./components/auth/SubscriptionGuard";
import MobileHeader from "./components/layout/MobileHeader";
import MobileNav from "./components/layout/MobileNav";
import PublicLayout from "./components/layout/PublicLayout";
import Sidebar from "./components/layout/Sidebar";
import BillingCanceledPage from "./pages/BillingCanceledPage";
import BillingReturnPage from "./pages/BillingReturnPage";
import CredentialsPage from "./pages/CredentialsPage";
import DashboardPage from "./pages/DashboardPage";
import DocDetailPage from "./pages/DocDetailPage";
import DocsPage from "./pages/DocsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import ImportProjectPage from "./pages/ImportProjectPage";
import LoginPage from "./pages/LoginPage";
import PaywallPage from "./pages/PaywallPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProPricingPage from "./pages/ProPricingPage";
import SubscriptionManagementPage from "./pages/SubscriptionManagementPage";
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
        <main className="flex-1 md:ml-64 md:pl-6 overflow-y-auto">
          <Outlet />
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
        <Route element={<PublicLayout />}>
          <Route element={<DocsPage />} path="/docs" />
          <Route element={<DocDetailPage />} path="/docs/:slug" />
          <Route element={<PaywallPage />} path="/pro" />
          <Route element={<ProPricingPage />} path="/pro/pricing" />
          <Route element={<BillingReturnPage />} path="/pro/billing/return" />
          <Route
            element={<BillingCanceledPage />}
            path="/pro/billing/canceled"
          />
        </Route>
        <Route element={<ForgotPasswordPage />} path="/forgot-password" />
        <Route element={<ProtectedRoute />}>
          <Route element={<App />}>
            <Route
              element={
                <>
                  <SubscriptionGuard />
                  <DashboardPage />
                </>
              }
              path="dashboard"
            />
            <Route
              element={
                <>
                  <SubscriptionGuard />
                  <ImportProjectPage />
                </>
              }
              path="import"
            />
            <Route
              element={
                <>
                  <SubscriptionGuard />
                  <SubscriptionManagementPage />
                </>
              }
              path="pro/billing/:userId"
            />
            <Route
              element={
                <>
                  <SubscriptionGuard />
                  <ProjectDetailPage />
                </>
              }
              path="project/:projectId"
            />
            <Route
              element={
                <>
                  <SubscriptionGuard />
                  <CredentialsPage />
                </>
              }
              path="credentials"
            />
            <Route element={<ProfilePage />} path="profile/:userId" />
          </Route>
        </Route>
      </Routes>
      {location.pathname !== "/" &&
        !location.pathname.startsWith("/pro") &&
        !location.pathname.startsWith("/docs") && (
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
