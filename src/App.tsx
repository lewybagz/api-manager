import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import MasterPasswordModal from "./components/auth/MasterPasswordModal";
import WarpMeshBackground from "./components/visual/WarpMeshBackground";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriptionGuard from "./components/auth/SubscriptionGuard";
import PasswordAppGuard from "./components/auth/PasswordAppGuard";
import MobileHeader from "./components/layout/MobileHeader";
import MobileNav from "./components/layout/MobileNav";
import RoutePageFallback from "./components/layout/RoutePageFallback";
import Sidebar from "./components/layout/Sidebar";
import useAuthStore from "./stores/authStore";
import useUserStore from "./stores/userStore";

const PasswordLayout = lazy(() => import("./components/layout/PasswordLayout"));
const PublicLayout = lazy(() => import("./components/layout/PublicLayout"));

const AddPasswordPage = lazy(() => import("./pages/AddPasswordPage"));
const BillingCanceledPage = lazy(() => import("./pages/BillingCanceledPage"));
const BillingReturnPage = lazy(() => import("./pages/BillingReturnPage"));
const CredentialsPage = lazy(() => import("./pages/CredentialsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DocDetailPage = lazy(() => import("./pages/DocDetailPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const FunHousePage = lazy(() => import("./pages/FunHousePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ImportProjectPage = lazy(() => import("./pages/ImportProjectPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PwLoginPage = lazy(() => import("./pages/PwLoginPage"));
const PasswordHomePage = lazy(() => import("./pages/PasswordHomePage"));
const PaywallPage = lazy(() => import("./pages/PaywallPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const ProPricingPage = lazy(() => import("./pages/ProPricingPage"));
const PwSettingsPage = lazy(() => import("./pages/PwSettingsPage"));
const SubscriptionManagementPage = lazy(
  () => import("./pages/SubscriptionManagementPage")
);
const TagsPage = lazy(() => import("./pages/TagsPage"));
const TrashPage = lazy(() => import("./pages/TrashPage"));

const routeFallback = <RoutePageFallback />;

function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-transparent font-zk-sans text-zk-text">
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
        <main className="flex-1 overflow-y-auto md:ml-64 md:pl-6">
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
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full"
      >
        <div className="relative h-full min-h-[100dvh] w-full">
          <WarpMeshBackground />
        </div>
      </div>
      <div className="relative z-10 min-h-[100dvh]">
        <Suspense fallback={routeFallback}>
          <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<LoginPage />} path="/login" />
          <Route element={<PwLoginPage />} path="/pw/login" />
          <Route element={<ProPricingPage />} path="/pro/pricing" />
          <Route element={<PublicLayout />}>
            <Route element={<DocsPage />} path="/docs" />
            <Route element={<DocDetailPage />} path="/docs/:slug" />
            <Route element={<PaywallPage />} path="/pro" />
            <Route element={<BillingReturnPage />} path="/pro/billing/return" />
            <Route
              element={<BillingCanceledPage />}
              path="/pro/billing/canceled"
            />
          </Route>
          <Route element={<ForgotPasswordPage />} path="/forgot-password" />
          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <PasswordAppGuard>
                  <Suspense fallback={routeFallback}>
                    <PasswordLayout />
                  </Suspense>
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
        </Suspense>
      </div>
      <MasterPasswordModal
        isOpen={
          location.pathname !== "/" &&
          !location.pathname.startsWith("/pro") &&
          !location.pathname.startsWith("/docs") &&
          !location.pathname.startsWith("/pw") &&
          (!!(user && !masterPasswordSet && !authLoading) ||
            isMasterPasswordModalExplicitlyOpen)
        }
        onClose={closeMasterPasswordModal}
      />
    </>
  );
}

export default MainApp;
