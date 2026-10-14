import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { RegisterPage } from "@/components/auth/RegisterPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { WorkspaceLayout } from "@/components/dashboard/WorkspaceLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useShallow } from "zustand/react/shallow";

export function AppRoutes() {
  const { currentUser, isAuthLoading } = useAuthStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      isAuthLoading: s.isAuthLoading,
    })),
  );

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/register"
        element={currentUser ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* Protected Document Canvas Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <WorkspaceLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
