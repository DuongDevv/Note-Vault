import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, KeyRound, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser, type AuthUser } from "@/services/auth";

interface RegisterPageProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export function RegisterPage({ onAuthSuccess }: RegisterPageProps) {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (
        !displayName.trim() ||
        !username.trim() ||
        !email.trim() ||
        !password
      ) {
        throw new Error("Vui lòng điền đầy đủ các trường thông tin");
      }
      if (password.length < 6) {
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
      }

      const data = await registerUser(
        username.trim(),
        email.trim(),
        password,
        displayName.trim(),
      );
      onAuthSuccess(data.user);
      void navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng ký thất bại";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      description="Đăng ký tài khoản để bắt đầu lưu trữ ghi chú mã hóa an toàn."
      footer={
        <p className="text-muted-foreground">
          Đã có tài khoản?{" "}
          <Button
            variant="link"
            onClick={() => void navigate("/login")}
            className="cursor-pointer font-medium"
          >
            Đăng nhập
          </Button>
        </p>
      }
    >
      <form
        onSubmit={(e) => void handleRegister(e)}
        className="flex flex-col gap-4"
      >
        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-name">Tên hiển thị</Label>
          <div className="relative">
            <User className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              id="register-name"
              placeholder="Nguyễn Văn A"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="pl-9 text-xs"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-username">Tên đăng nhập</Label>
          <div className="relative">
            <User className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              id="register-username"
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
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              id="register-email"
              type="email"
              placeholder="vana@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 text-xs"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-password">Mật khẩu</Label>
          <div className="relative">
            <KeyRound className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              id="register-password"
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
              Đăng ký tài khoản
              <ArrowRight className="size-3.5" />
            </span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
