import { useEffect } from "react";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAuthStore } from "@/stores/useAuthStore";

export default function App() {
  const initSession = useAuthStore((s) => s.initSession);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  return <AppRoutes />;
}
