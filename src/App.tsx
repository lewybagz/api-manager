import { useEffect, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import useAuthStore from "./stores/authStore";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MasterPasswordModal from "./components/auth/MasterPasswordModal";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-dark text-brand-light">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 mt-16 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const {
    user,
    masterPasswordSet,
    isLoading: authLoading,
    subscribeToAuthState,
  } = useAuthStore();
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] =
    useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState();
    return () => unsubscribe(); // Cleanup subscription on unmount
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="project/:projectId" element={<ProjectDetailPage />} />
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
