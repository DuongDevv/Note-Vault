import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes";
import {
  fetchUserProfile,
  clearAuthToken,
  type AuthUser,
} from "@/services/auth";
import { useUIStore } from "@/stores/useUIStore";

export default function App() {
  const navigate = useNavigate();

  const isDark = useUIStore((s) => s.isDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Auth session state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Check user session on initial load
  useEffect(() => {
    let ignore = false;
    async function checkAuth() {
      try {
        const user = await fetchUserProfile();
        if (!ignore) setCurrentUser(user);
      } catch {
        if (!ignore) setCurrentUser(null);
      } finally {
        if (!ignore) setIsAuthLoading(false);
      }
    }
    void checkAuth();
    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    void navigate("/login");
  };

  return (
    <AppRoutes
      currentUser={currentUser}
      isAuthLoading={isAuthLoading}
      onAuthSuccess={(user) => setCurrentUser(user)}
      onLogout={handleLogout}
      onUserUpdate={(user) => setCurrentUser(user)}
    />
  );
}
