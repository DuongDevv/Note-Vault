import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { User, KeyRound, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser, type AuthUser } from "@/services/auth";

interface LoginPageProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!username.trim() || !password) {
        throw new Error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      }

      const data = await loginUser(username.trim(), password);
      onAuthSuccess(data.user);

      let destination = "/";
      const StateSchema = z.object({
        from: z.object({ pathname: z.string().optional() }).optional(),
      });
      const parsedState = StateSchema.safeParse(location.state);
      if (parsedState.success && parsedState.data.from?.pathname) {
        destination = parsedState.data.from.pathname;
      }
      void navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập tài khoản"
      description="Nhập thông tin tài khoản để truy cập kho ghi chú bảo mật."
      footer={
        <p className="text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Button
            variant="link"
            onClick={() => void navigate("/register")}
            className="cursor-pointer font-medium"
          >
            Đăng ký ngay
          </Button>
        </p>
      }
    >
      <form
        onSubmit={(e) => void handleLogin(e)}
        className="flex flex-col gap-4"
      >
        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-username">Tên đăng nhập</Label>
          <div className="relative">
            <User className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              id="login-username"
              placeholder="nguyenvana"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-9 text-xs"
              disabled={isLoading}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Mật khẩu</Label>
          <div className="relative">
            <KeyRound className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 text-xs"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="mt-2 w-full cursor-pointer text-xs font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            "Đang xử lý…"
          ) : (
            <span className="inline-flex items-center gap-1.5">
              Đăng nhập
              <ArrowRight className="size-3.5" />
            </span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
