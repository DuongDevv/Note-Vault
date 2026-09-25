import { useState } from "react";
import {
  Search,
  Plus,
  FileText,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Folder,
  Sun,
  Moon,
  LogOut,
  PenSquare,
  KeyRound,
  Trash2,
  Copy,
} from "lucide-react";
import type { Note, Topic } from "@/types/note";
import type { AuthUser } from "@/services/auth";
import { NoteVaultLogo } from "@/components/common/NoteVaultLogo";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  notes: Note[];
  topics: Topic[];
  activeNoteId?: string;
  activeTopicId?: string;
  onSelectNote: (noteId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onNewNoteClick: (topicId?: string) => void;
  onNewTopicClick: () => void;
  onSearchClick: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenPinSettings?: () => void;
  onToggleLock?: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onDeleteTopic?: (topicId: string) => void;
}

export function AppSidebar({
  notes,
  topics,
  activeNoteId,
  activeTopicId,
  onSelectNote,
  onSelectTopic,
  onNewNoteClick,
  onNewTopicClick,
  onSearchClick,
  currentUser,
  onLogout,
  isDark,
  onToggleTheme,
  onOpenPinSettings,
  onToggleLock,
  onDeleteNote,
  onDeleteTopic,
}: SidebarProps) {
  // Collapsed states
  const [isRecentsCollapsed, setIsRecentsCollapsed] = useState(false);
  const [isTopicsSectionCollapsed, setIsTopicsSectionCollapsed] =
    useState(false);
  const [collapsedTopics, setCollapsedTopics] = useState<
    Record<string, boolean>
  >({});

  // Recents (Top 6 most recent notes)
  const recentNotes = notes
    .toSorted((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  return (
    <Sidebar className="border-sidebar-border bg-sidebar z-50 border-r transition-colors select-none">
      {/* Top Workspace Header */}
      <SidebarHeader className="p-3 pb-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1.5">
            <NoteVaultLogo size={18} className="shrink-0 rounded" />
            <span className="text-sidebar-foreground truncate text-xs font-semibold tracking-tight">
              NoteVault
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onNewNoteClick()}
            className="text-muted-foreground hover:text-sidebar-foreground cursor-pointer"
            title="Tạo trang mới"
            aria-label="Tạo trang mới"
          >
            <PenSquare className="size-3.5" />
          </Button>
        </div>

        {/* Quick Search Item */}
        <Button
          variant="sidebar-search"
          size="sidebar-row"
          onClick={onSearchClick}
          className="mt-1.5 cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5 opacity-70" />
            <span>Tìm kiếm...</span>
          </div>
          <kbd className="bg-muted/60 text-muted-foreground border-border/60 rounded border px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1">
        {/* Section: Recents (Collapsible with Hover Arrow Behind) */}
        {recentNotes.length > 0 && (
          <SidebarGroup className="py-1">
            <ContextMenu>
              <ContextMenuTrigger className="block w-full">
                <div className="group/recents-header hover:bg-sidebar-accent/50 flex h-7 items-center justify-between rounded-md px-2 transition-colors">
                  <button
                    type="button"
                    onClick={() => setIsRecentsCollapsed((prev) => !prev)}
                    className="text-muted-foreground/80 group-hover/recents-header:text-sidebar-foreground flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-[11px] font-medium tracking-wider select-none"
                  >
                    <span>Gần đây</span>
                    <span className="opacity-0 transition-opacity group-hover/recents-header:opacity-100">
                      {isRecentsCollapsed ? (
                        <ChevronRight className="text-muted-foreground size-3" />
                      ) : (
                        <ChevronDown className="text-muted-foreground size-3" />
                      )}
                    </span>
                  </button>
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-48 text-xs">
                <ContextMenuItem
                  onClick={() => onNewNoteClick()}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <PenSquare className="text-muted-foreground size-3.5" />
                  <span>Tạo trang mới</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => setIsRecentsCollapsed((prev) => !prev)}
                  className="flex cursor-pointer items-center gap-2"
                >
                  {isRecentsCollapsed ? (
                    <>
                      <ChevronDown className="text-muted-foreground size-3.5" />
                      <span>Mở rộng mục này</span>
                    </>
                  ) : (
                    <>
                      <ChevronRight className="text-muted-foreground size-3.5" />
                      <span>Thu gọn mục này</span>
                    </>
                  )}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            {!isRecentsCollapsed && (
              <SidebarGroupContent className="mt-0.5">
                <SidebarMenu className="gap-0.5">
                  {recentNotes.map((note) => {
                    const isActive = activeNoteId === note.id;
                    return (
                      <SidebarMenuItem key={`recent-${note.id}`}>
                        <ContextMenu>
                          <ContextMenuTrigger className="w-full">
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => onSelectNote(note.id)}
                              className={`h-7.5 w-full cursor-pointer justify-start rounded-md px-2 text-[13px] transition-colors ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
                              }`}
                            >
                              {note.isLocked ? (
                                <Lock className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                              ) : (
                                <FileText className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                              )}
                              <span className="truncate text-xs">
                                {note.title}
                              </span>
                            </SidebarMenuButton>
                          </ContextMenuTrigger>

                          <ContextMenuContent className="w-48 text-xs">
                            {onToggleLock && (
                              <ContextMenuItem
                                onClick={() => onToggleLock(note.id)}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                {note.isLocked ? (
                                  <>
                                    <Unlock className="size-3.5" />
                                    <span>Bỏ khóa PIN</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="size-3.5" />
                                    <span>Khóa bằng mã PIN</span>
                                  </>
                                )}
                              </ContextMenuItem>
                            )}
                            <ContextMenuItem
                              onClick={() => {
                                if (typeof navigator !== "undefined") {
                                  void navigator.clipboard.writeText(
                                    note.title,
                                  );
                                }
                              }}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Copy className="text-muted-foreground size-3.5" />
                              <span>Sao chép tiêu đề</span>
                            </ContextMenuItem>
                            {onDeleteNote && (
                              <>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  variant="destructive"
                                  onClick={() => onDeleteNote(note.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>Xóa trang</span>
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Section: Topics & Workspace Documents (Collapsible with Hover Arrow Behind) */}
        <SidebarGroup className="py-1">
          <ContextMenu>
            <ContextMenuTrigger className="block w-full">
              <div className="group/topics-header hover:bg-sidebar-accent/50 flex h-7 items-center justify-between rounded-md px-2 transition-colors">
                <button
                  type="button"
                  onClick={() => setIsTopicsSectionCollapsed((prev) => !prev)}
                  className="text-muted-foreground/80 group-hover/topics-header:text-sidebar-foreground flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-[11px] font-medium tracking-wider select-none"
                >
                  <span>Chủ đề</span>
                  <span className="opacity-0 transition-opacity group-hover/topics-header:opacity-100">
                    {isTopicsSectionCollapsed ? (
                      <ChevronRight className="text-muted-foreground size-3" />
                    ) : (
                      <ChevronDown className="text-muted-foreground size-3" />
                    )}
                  </span>
                </button>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-52 text-xs">
              <ContextMenuItem
                onClick={onNewTopicClick}
                className="flex cursor-pointer items-center gap-2"
              >
                <Folder className="text-muted-foreground size-3.5" />
                <span>Thêm chủ đề mới</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onNewNoteClick()}
                className="flex cursor-pointer items-center gap-2"
              >
                <PenSquare className="text-muted-foreground size-3.5" />
                <span>Tạo trang mới</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => setIsTopicsSectionCollapsed((prev) => !prev)}
                className="flex cursor-pointer items-center gap-2"
              >
                {isTopicsSectionCollapsed ? (
                  <>
                    <ChevronDown className="text-muted-foreground size-3.5" />
                    <span>Mở rộng mục này</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="text-muted-foreground size-3.5" />
                    <span>Thu gọn mục này</span>
                  </>
                )}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {!isTopicsSectionCollapsed && (
            <SidebarGroupContent className="mt-0.5">
              <SidebarMenu className="gap-0.5">
                {topics.map((topic) => {
                  const isTopicActive = activeTopicId === topic.id;
                  const isCollapsed = collapsedTopics[topic.id];
                  const topicNotes = notes.filter(
                    (n) => n.topicId === topic.id,
                  );
                  return (
                    <div key={topic.id} className="flex flex-col">
                      <SidebarMenuItem>
                        <ContextMenu>
                          <ContextMenuTrigger className="w-full">
                            <SidebarMenuButton
                              isActive={isTopicActive}
                              onClick={() => {
                                onSelectTopic(topic.id);
                                setCollapsedTopics((prev) => ({
                                  ...prev,
                                  [topic.id]: !prev[topic.id],
                                }));
                              }}
                              className={`group/topic-item h-7.5 w-full cursor-pointer justify-start rounded-md px-2 pr-7 text-[13px] transition-colors ${
                                isTopicActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
                              }`}
                            >
                              {/* Folder Icon, Title & Hover Arrow Behind */}
                              <div className="flex min-w-0 items-center gap-2 truncate">
                                <Folder className="size-3.5 shrink-0 opacity-70" />
                                <span className="truncate text-xs font-medium">
                                  {topic.name}
                                </span>
                                <span className="opacity-0 transition-opacity group-hover/topic-item:opacity-100">
                                  {isCollapsed ? (
                                    <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                                  ) : (
                                    <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                                  )}
                                </span>
                              </div>
                            </SidebarMenuButton>
                          </ContextMenuTrigger>

                          <SidebarMenuAction
                            showOnHover
                            onClick={(e) => {
                              e.stopPropagation();
                              onNewNoteClick(topic.id);
                            }}
                            className="text-muted-foreground hover:text-foreground top-1 right-1 size-5.5 cursor-pointer rounded p-0"
                            title={`Tạo trang trong "${topic.name}"`}
                            aria-label={`Tạo trang trong "${topic.name}"`}
                          >
                            <Plus className="size-3" />
                          </SidebarMenuAction>

                          <ContextMenuContent className="w-52 text-xs">
                            <ContextMenuItem
                              onClick={() => onNewNoteClick(topic.id)}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Plus className="text-muted-foreground size-3.5" />
                              <span>Tạo trang mới</span>
                            </ContextMenuItem>
                            {onDeleteTopic && (
                              <>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  variant="destructive"
                                  onClick={() => onDeleteTopic(topic.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>Xóa chủ đề</span>
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      </SidebarMenuItem>

                      {/* Sub-items (Notes under topic with Context Menu on Right Click) */}
                      {!isCollapsed && topicNotes.length > 0 && (
                        <div className="border-sidebar-border/40 ml-3.5 flex flex-col gap-0.5 border-l py-0.5 pl-1.5">
                          {topicNotes.map((note) => {
                            const isNoteActive = activeNoteId === note.id;
                            return (
                              <ContextMenu key={`ctx-topic-${note.id}`}>
                                <ContextMenuTrigger className="w-full">
                                  <SidebarMenuButton
                                    isActive={isNoteActive}
                                    onClick={() => onSelectNote(note.id)}
                                    className={`h-7.5 w-full cursor-pointer justify-start rounded-md px-2 text-xs transition-colors ${
                                      isNoteActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
                                    }`}
                                  >
                                    {note.isLocked ? (
                                      <Lock className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                                    ) : (
                                      <FileText className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                                    )}
                                    <span className="truncate text-xs">
                                      {note.title || "Trang chưa có tiêu đề"}
                                    </span>
                                  </SidebarMenuButton>
                                </ContextMenuTrigger>

                                <ContextMenuContent className="w-48 text-xs">
                                  {onToggleLock && (
                                    <ContextMenuItem
                                      onClick={() => onToggleLock(note.id)}
                                      className="flex cursor-pointer items-center gap-2"
                                    >
                                      {note.isLocked ? (
                                        <>
                                          <Unlock className="size-3.5" />
                                          <span>Bỏ khóa PIN</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="size-3.5" />
                                          <span>Khóa bằng mã PIN</span>
                                        </>
                                      )}
                                    </ContextMenuItem>
                                  )}
                                  <ContextMenuItem
                                    onClick={() => {
                                      if (typeof navigator !== "undefined") {
                                        void navigator.clipboard.writeText(
                                          note.title,
                                        );
                                      }
                                    }}
                                    className="flex cursor-pointer items-center gap-2"
                                  >
                                    <Copy className="text-muted-foreground size-3.5" />
                                    <span>Sao chép tiêu đề</span>
                                  </ContextMenuItem>
                                  {onDeleteNote && (
                                    <>
                                      <ContextMenuSeparator />
                                      <ContextMenuItem
                                        variant="destructive"
                                        onClick={() => onDeleteNote(note.id)}
                                      >
                                        <Trash2 className="size-3.5" />
                                        <span>Xóa trang</span>
                                      </ContextMenuItem>
                                    </>
                                  )}
                                </ContextMenuContent>
                              </ContextMenu>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom User Profile & Settings Footer */}
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
            {onOpenPinSettings && (
              <DropdownMenuItem
                onClick={onOpenPinSettings}
                className="flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-xs"
              >
                <KeyRound className="text-muted-foreground size-3.5" />
                <span>Đổi mã Master PIN</span>
              </DropdownMenuItem>
            )}

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
    </Sidebar>
  );
}
