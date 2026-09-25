import { Navigate, useLocation } from "react-router-dom";
import type { AuthUser } from "@/services/auth";

interface ProtectedRouteProps {
  user: AuthUser | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export function ProtectedRoute({
  user,
  isLoading,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen w-full items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
