import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { RegisterPage } from "@/components/auth/RegisterPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WorkspaceLayout } from "@/components/dashboard/WorkspaceLayout";
import type { AuthUser } from "@/services/auth";

interface AppRoutesProps {
  currentUser: AuthUser | null;
  isAuthLoading: boolean;
  onAuthSuccess: (user: AuthUser) => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onUserUpdate: (user: AuthUser) => void;
}

export function AppRoutes({
  currentUser,
  isAuthLoading,
  onAuthSuccess,
  onLogout,
  isDark,
  onToggleTheme,
  onUserUpdate,
}: AppRoutesProps) {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onAuthSuccess={onAuthSuccess} />
          )
        }
      />
      <Route
        path="/register"
        element={
          currentUser ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterPage onAuthSuccess={onAuthSuccess} />
          )
        }
      />

      {/* Protected Notion Document Canvas Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute user={currentUser} isLoading={isAuthLoading}>
            <WorkspaceLayout
              currentUser={currentUser}
              onLogout={onLogout}
              isDark={isDark}
              onToggleTheme={onToggleTheme}
              onUserUpdate={onUserUpdate}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
