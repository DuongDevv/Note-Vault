import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes";
import {
  fetchUserProfile,
  clearAuthToken,
  type AuthUser,
} from "@/services/auth";

export default function App() {
  const navigate = useNavigate();

  // Dark/Light theme mode state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("notevault-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("notevault-theme", isDark ? "dark" : "light");
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
      isDark={isDark}
      onToggleTheme={() => setIsDark((prev) => !prev)}
      onUserUpdate={(user) => setCurrentUser(user)}
    />
  );
}
