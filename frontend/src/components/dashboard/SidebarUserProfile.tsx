import { ChevronDown, Sun, Moon, LogOut, KeyRound } from "lucide-react";
import type { AuthUser } from "@/services/auth";
import { useUIStore } from "@/stores/useUIStore";
import { SidebarFooter } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SidebarUserProfileProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function SidebarUserProfile({
  currentUser,
  onLogout,
  isDark,
  onToggleTheme,
}: SidebarUserProfileProps) {
  const setPinSettingsOpen = useUIStore((s) => s.setPinSettingsOpen);

  return (
    <SidebarFooter className="border-sidebar-border/60 border-t p-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-sidebar-accent text-sidebar-foreground flex h-9 w-full cursor-pointer items-center justify-between rounded-md px-2 text-xs transition-colors outline-none">
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-muted-foreground/20 text-foreground flex size-6 items-center justify-center rounded-md text-[11px] font-semibold">
              {currentUser ? currentUser.displayName[0]?.toUpperCase() : "U"}
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-xs font-medium">
                {currentUser ? currentUser.displayName : "Người dùng"}
              </span>
              <span className="text-muted-foreground/70 truncate text-[10px]">
                @{currentUser ? currentUser.username : "user"}
              </span>
            </div>
          </div>
          <ChevronDown className="text-muted-foreground size-3.5 opacity-60" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-60 p-1.5" side="top">
          {/* Clean Account Header: Avatar [N], Name, Subtitle is Email */}
          <div className="flex items-center gap-2.5 rounded-md p-2">
            <div className="bg-muted-foreground/25 text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold select-none">
              {currentUser ? currentUser.displayName[0]?.toUpperCase() : "U"}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-foreground truncate text-xs leading-tight font-semibold">
                {currentUser ? currentUser.displayName : "Người dùng"}
              </span>
              <span className="text-muted-foreground mt-0.5 truncate text-[11px]">
                {currentUser ? currentUser.email : ""}
              </span>
            </div>
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Action List */}
          <DropdownMenuItem
            onClick={() => setPinSettingsOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-xs"
          >
            <KeyRound className="text-muted-foreground size-3.5" />
            <span>Đổi mã Master PIN</span>
          </DropdownMenuItem>

          {onToggleTheme && (
            <DropdownMenuItem
              onClick={onToggleTheme}
              className="flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs"
            >
              <span className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="text-muted-foreground size-3.5" />
                ) : (
                  <Moon className="text-muted-foreground size-3.5" />
                )}
                <span>{isDark ? "Giao diện: Sáng" : "Giao diện: Tối"}</span>
              </span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-1" />

          {/* Logout Action */}
          <DropdownMenuItem
            onClick={onLogout}
            className="text-destructive focus:text-destructive flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-xs"
          >
            <LogOut className="size-3.5" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}
