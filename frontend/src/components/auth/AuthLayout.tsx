import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { NoteVaultLogo } from "@/components/common/NoteVaultLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center p-4 antialiased">
      <div className="flex w-full max-w-105 flex-col gap-6">
        {/* Brand Icon & Title Header */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center justify-center p-1">
            <NoteVaultLogo size={48} className="rounded-xl shadow-xs" />
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            NoteVault
          </h1>
          <p className="text-muted-foreground text-xs">
            Không gian ghi chú cá nhân & bảo mật riêng tư
          </p>
        </div>

        {/* Auth Form Card */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </CardHeader>

          <CardContent>
            {children}
            <div className="mt-5 flex items-center justify-center border-t pt-4 text-xs">
              {footer}
            </div>
          </CardContent>
        </Card>

        {/* Security Badge Footer */}
        <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-[11px]">
          <ShieldCheck className="text-primary size-3.5" />
          <span>Bảo mật đầu cuối & Riêng tư tuyệt đối</span>
        </div>
      </div>
    </div>
  );
}
