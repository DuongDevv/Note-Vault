import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import { LoadingScreen } from "@/components/common/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  const { currentUser, isAuthLoading } = useAuthStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      isAuthLoading: s.isAuthLoading,
    })),
  );

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
