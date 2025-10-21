import { useEffect, useState } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import MasterPasswordModal from "./components/auth/MasterPasswordModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriptionGuard from "./components/auth/SubscriptionGuard";
import PasswordAppGuard from "./components/auth/PasswordAppGuard";
import PasswordLayout from "./components/layout/PasswordLayout";
import PasswordHomePage from "./pages/PasswordHomePage";
import FunHousePage from "./pages/FunHousePage";
import TrashPage from "./pages/TrashPage";
import PwSettingsPage from "./pages/PwSettingsPage";
import TagsPage from "./pages/TagsPage";
import AddPasswordPage from "./pages/AddPasswordPage";
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
import useUserStore from "./stores/userStore";

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
  const { userDoc } = useUserStore();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState();
    return () => {
      unsubscribe();
    };
  }, [subscribeToAuthState]);

  useEffect(() => {
    const isPwRoute = location.pathname.startsWith("/pw");
    const isPwApp = userDoc?.appType === "pw";
    if (user && !masterPasswordSet && !authLoading && !isPwRoute && !isPwApp) {
      openMasterPasswordModal();
    }
  }, [
    user,
    masterPasswordSet,
    authLoading,
    openMasterPasswordModal,
    location.pathname,
    userDoc?.appType,
  ]);

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
        {/* Password Manager App Mode */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <PasswordAppGuard>
                <PasswordLayout />
              </PasswordAppGuard>
            }
            path="/pw"
          >
            <Route index element={<PasswordHomePage />} />
            <Route element={<FunHousePage />} path="uh-oh" />
            <Route element={<AddPasswordPage />} path="add" />
            <Route element={<TagsPage />} path="tags" />
            <Route element={<TrashPage />} path="trash" />
            <Route element={<PwSettingsPage />} path="settings" />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<App />}>
            <Route
              element={
                <>
                  {userDoc?.appType === "pw" ? null : <SubscriptionGuard />}
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
        !location.pathname.startsWith("/docs") &&
        !location.pathname.startsWith("/pw") && (
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
