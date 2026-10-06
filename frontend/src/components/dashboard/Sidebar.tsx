import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  Lock,
  ChevronDown,
  ChevronRight,
  Folder,
  PenSquare,
  Trash2,
  Pencil,
  MoreHorizontal,
  Pin,
} from "lucide-react";
import type { AuthUser } from "@/services/auth";
import type { Topic } from "@/types/note";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useUIStore } from "@/stores/useUIStore";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NoteActionMenu } from "./NoteActionMenu";
import { RenameTopicDialog } from "./RenameTopicDialog";
import { SidebarUserProfile } from "./SidebarUserProfile";
interface SidebarProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function AppSidebar({
  currentUser,
  onLogout,
  isDark,
  onToggleTheme,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const notes = useWorkspaceStore((s) => s.notes);
  const topics = useWorkspaceStore((s) => s.topics);
  const createNote = useWorkspaceStore((s) => s.createNote);
  const updateTopic = useWorkspaceStore((s) => s.updateTopic);
  const deleteTopic = useWorkspaceStore((s) => s.deleteTopic);
  const [topicToRename, setTopicToRename] = useState<Topic | null>(null);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setNewTopicOpen = useUIStore((s) => s.setNewTopicOpen);

  const activeTopicId = useMemo(() => {
    const match = /^\/topics\/([^/]+)/.exec(location.pathname);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const activeNoteId = useMemo(() => {
    const match = /^\/notes\/([^/]+)/.exec(location.pathname);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const handleSelectNote = (noteId: string) => {
    void navigate(`/notes/${noteId}`);
  };
  const handleNewNote = async (topicId?: string | null) => {
    try {
      const targetTopicId =
        topicId === null ? undefined : (topicId ?? activeTopicId);
      const created = await createNote(targetTopicId);
      void navigate(`/notes/${created.id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };
  const handleRenameTopic = async (topicId: string, newName: string) => {
    try {
      await updateTopic(topicId, newName);
    } catch (err: unknown) {
      console.error("Failed to rename topic:", err);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const currentNote = notes.find((n) => n.id === activeNoteId);
      const remainingId = await deleteTopic(topicId, currentNote?.topicId);
      if (currentNote?.topicId === topicId) {
        if (remainingId) {
          void navigate(`/notes/${remainingId}`);
        } else {
          void navigate("/");
        }
      }
    } catch (err) {
      console.error("Failed to delete topic:", err);
    }
  };
  // Collapsed states
  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState(false);
  const [isRecentsCollapsed, setIsRecentsCollapsed] = useState(false);
  const [isUnclassifiedCollapsed, setIsUnclassifiedCollapsed] = useState(false);
  const [isTopicsSectionCollapsed, setIsTopicsSectionCollapsed] =
    useState(false);
  const [collapsedTopics, setCollapsedTopics] = useState<
    Record<string, boolean>
  >({});
  // Pinned notes (sorted by most recently updated)
  const pinnedNotes = useMemo(() => {
    return notes
      .filter((n) => n.isPinned)
      .toSorted((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [notes]);
  
  const recentNotes = notes
    .filter((n) => !n.isPinned) //lọc đã ghim và gần đây
    .toSorted((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  // Unclassified notes (notes without a topic)
  const unclassifiedNotes = useMemo(() => {
    return notes
      .filter((n) => !n.topicId)
      .toSorted((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [notes]);
  return (
    <Sidebar className="border-sidebar-border bg-sidebar z-50 border-r transition-colors select-none">
      {/* Top Workspace Header */}
      <SidebarHeader className="p-3 pb-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1.5">
            <NoteVaultLogo size={18} className="shrink-0 rounded" />
            <span className="text-sidebar-foreground truncate text-sm font-semibold tracking-tight">
              NoteVault
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void handleNewNote()}
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
          onClick={() => setSearchOpen(true)}
          className="mt-1.5 cursor-pointer text-[13px]"
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
        {/* Section: Đã ghim — chỉ hiện khi có ít nhất 1 note được ghim */}
        {pinnedNotes.length > 0 && (
          <SidebarGroup className="py-1">
            <div className="group/pinned-header hover:bg-sidebar-accent/50 flex h-7 items-center justify-between rounded-md px-2 transition-colors">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPinnedCollapsed((prev) => !prev)}
                className="text-muted-foreground/80 group-hover/pinned-header:text-sidebar-foreground h-7 w-full cursor-pointer justify-between p-0 text-left text-xs font-medium tracking-wider shadow-none select-none hover:bg-transparent"
              >
                <span className="flex items-center gap-1.5">
                  <Pin className="size-3 opacity-70" />
                  <span>Đã ghim</span>
                  <span className="text-muted-foreground/60 text-[11px] font-normal">
                    ({pinnedNotes.length})
                  </span>
                </span>
                <span className="opacity-0 transition-opacity group-hover/pinned-header:opacity-100">
                  {isPinnedCollapsed ? (
                    <ChevronRight className="text-muted-foreground size-3.5" />
                  ) : (
                    <ChevronDown className="text-muted-foreground size-3.5" />
                  )}
                </span>
              </Button>
            </div>
            {!isPinnedCollapsed && (
              <SidebarGroupContent className="mt-0.5">
                <SidebarMenu className="gap-0.5">
                  {pinnedNotes.map((note) => {
                    const isActive = activeNoteId === note.id;
                    return (
                      <SidebarMenuItem key={`pinned-${note.id}`}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => handleSelectNote(note.id)}
                          className={`h-8 w-full cursor-pointer justify-start rounded-md px-2 pr-7 text-[13px] transition-colors ${
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
                          <span className="truncate text-[13px]">
                            {note.title || "Trang chưa có tiêu đề"}
                          </span>
                        </SidebarMenuButton>
                        <NoteActionMenu
                          note={note}
                          hasPrivatePin={currentUser?.hasPrivatePin}
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Section: Recents (Collapsible with Hover Arrow Behind) */}
        {recentNotes.length > 0 && (
          <SidebarGroup className="py-1">
            <div className="group/recents-header hover:bg-sidebar-accent/50 flex h-7 items-center justify-between rounded-md px-2 transition-colors">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRecentsCollapsed((prev) => !prev)}
                className="text-muted-foreground/80 group-hover/recents-header:text-sidebar-foreground h-7 w-full cursor-pointer justify-between p-0 text-left text-xs font-medium tracking-wider shadow-none select-none hover:bg-transparent"
              >
                <span>Gần đây</span>
                <span className="opacity-0 transition-opacity group-hover/recents-header:opacity-100">
                  {isRecentsCollapsed ? (
                    <ChevronRight className="text-muted-foreground size-3.5" />
                  ) : (
                    <ChevronDown className="text-muted-foreground size-3.5" />
                  )}
                </span>
              </Button>
            </div>
            {!isRecentsCollapsed && (
              <SidebarGroupContent className="mt-0.5">
                <SidebarMenu className="gap-0.5">
                  {recentNotes.map((note) => {
                    const isActive = activeNoteId === note.id;
                    return (
                      <SidebarMenuItem key={`recent-${note.id}`}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => handleSelectNote(note.id)}
                          className={`h-8 w-full cursor-pointer justify-start rounded-md px-2 pr-7 text-[13px] transition-colors ${
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
                          <span className="truncate text-[13px]">
                            {note.title}
                          </span>
                        </SidebarMenuButton>
                        <NoteActionMenu
                          note={note}
                          hasPrivatePin={currentUser?.hasPrivatePin}
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Section: Unclassified Notes (Quick Capture / Inbox) */}
        {unclassifiedNotes.length > 0 && (
          <SidebarGroup className="py-1">
            <div className="group/unclassified-header hover:bg-sidebar-accent/50 relative flex h-7 items-center justify-between rounded-md px-2 transition-colors">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsUnclassifiedCollapsed((prev) => !prev)}
                className="text-muted-foreground/80 group-hover/unclassified-header:text-sidebar-foreground h-7 w-full cursor-pointer justify-between p-0 text-left text-xs font-medium tracking-wider shadow-none select-none hover:bg-transparent"
              >
                <div className="flex items-center gap-1.5">
                  <span>Chưa phân loại</span>
                  <span className="text-muted-foreground/60 text-[11px] font-normal">
                    ({unclassifiedNotes.length})
                  </span>
                </div>
                <span className="mr-5 opacity-0 transition-opacity group-hover/unclassified-header:opacity-100">
                  {isUnclassifiedCollapsed ? (
                    <ChevronRight className="text-muted-foreground size-3.5" />
                  ) : (
                    <ChevronDown className="text-muted-foreground size-3.5" />
                  )}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleNewNote(null);
                }}
                className="text-muted-foreground hover:text-foreground absolute right-1 size-5.5 cursor-pointer rounded p-0 opacity-0 transition-opacity group-hover/unclassified-header:opacity-100"
                title="Tạo trang chưa phân loại"
                aria-label="Tạo trang chưa phân loại"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>

            {!isUnclassifiedCollapsed && (
              <SidebarGroupContent className="mt-0.5">
                <SidebarMenu className="gap-0.5">
                  {unclassifiedNotes.map((note) => {
                    const isActive = activeNoteId === note.id;
                    return (
                      <SidebarMenuItem key={`unclassified-${note.id}`}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => handleSelectNote(note.id)}
                          className={`h-8 w-full cursor-pointer justify-start rounded-md px-2 pr-7 text-[13px] transition-colors ${
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
                          <span className="truncate text-[13px]">
                            {note.title || "Trang chưa có tiêu đề"}
                          </span>
                        </SidebarMenuButton>
                        <NoteActionMenu
                          note={note}
                          hasPrivatePin={currentUser?.hasPrivatePin}
                        />
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
          <div className="group/topics-header hover:bg-sidebar-accent/50 relative flex h-7 items-center justify-between rounded-md px-2 transition-colors">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTopicsSectionCollapsed((prev) => !prev)}
              className="text-muted-foreground/80 group-hover/topics-header:text-sidebar-foreground h-7 w-full cursor-pointer justify-between p-0 text-left text-xs font-medium tracking-wider shadow-none select-none hover:bg-transparent"
            >
              <span>Chủ đề</span>
              <span className="mr-5 opacity-0 transition-opacity group-hover/topics-header:opacity-100">
                {isTopicsSectionCollapsed ? (
                  <ChevronRight className="text-muted-foreground size-3.5" />
                ) : (
                  <ChevronDown className="text-muted-foreground size-3.5" />
                )}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                setNewTopicOpen(true);
              }}
              className="text-muted-foreground hover:text-foreground absolute right-1 size-5.5 cursor-pointer rounded p-0 opacity-0 transition-opacity group-hover/topics-header:opacity-100"
              title="Thêm chủ đề mới"
              aria-label="Thêm chủ đề mới"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

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
                        <SidebarMenuButton
                          isActive={isTopicActive}
                          onClick={() => {
                            setCollapsedTopics((prev) => ({
                              ...prev,
                              [topic.id]: !prev[topic.id],
                            }));
                          }}
                          className={`group/topic-item h-8 w-full cursor-pointer justify-start rounded-md px-2 pr-12 text-[13px] transition-colors ${
                            isTopicActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
                          }`}
                        >
                          {/* Folder Icon, Title & Hover Arrow Behind */}
                          <div className="flex min-w-0 items-center gap-2 truncate">
                            <Folder className="size-3.5 shrink-0 opacity-70" />
                            <span className="truncate text-[13px] font-medium">
                              {topic.name}
                            </span>
                            <span className="opacity-0 transition-opacity group-hover/topic-item:opacity-100">
                              {isCollapsed ? (
                                <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
                              ) : (
                                <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
                              )}
                            </span>
                          </div>
                        </SidebarMenuButton>

                        {/* Quick Add Note inside Topic */}
                        <SidebarMenuAction
                          showOnHover
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleNewNote(topic.id);
                          }}
                          className="text-muted-foreground hover:text-foreground top-1.5 right-6.5 size-5.5 cursor-pointer rounded p-0"
                          title={`Tạo trang trong "${topic.name}"`}
                          aria-label={`Tạo trang trong "${topic.name}"`}
                        >
                          <Plus className="size-3.5" />
                        </SidebarMenuAction>

                        {/* Topic 3-dots Action Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <SidebarMenuAction
                                showOnHover
                                className="text-muted-foreground hover:text-foreground top-1.5 right-1 size-5.5 cursor-pointer rounded p-0"
                                title="Tùy chọn chủ đề"
                                aria-label="Tùy chọn chủ đề"
                              />
                            }
                          >
                            <MoreHorizontal className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="w-48 text-xs"
                          >
                            <DropdownMenuItem
                              onClick={() => void handleNewNote(topic.id)}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Plus className="text-muted-foreground size-3.5" />
                              <span>Tạo trang mới</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTopicToRename(topic)}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Pencil className="text-muted-foreground size-3.5" />
                              <span>Đổi tên chủ đề</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => void handleDeleteTopic(topic.id)}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Xóa chủ đề</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                      {/* Sub-items (Notes under topic with Context Menu on Right Click) */}
                      {!isCollapsed && topicNotes.length > 0 && (
                        <div className="border-sidebar-border/40 ml-3.5 flex flex-col gap-0.5 border-l py-0.5 pl-1.5">
                          {topicNotes.map((note) => {
                            const isNoteActive = activeNoteId === note.id;
                            return (
                              <SidebarMenuItem key={`ctx-topic-${note.id}`}>
                                <SidebarMenuButton
                                  isActive={isNoteActive}
                                  onClick={() => handleSelectNote(note.id)}
                                  className={`h-8 w-full cursor-pointer justify-start rounded-md px-2 pr-7 text-[13px] transition-colors ${
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
                                  <span className="truncate text-[13px]">
                                    {note.title || "Trang chưa có tiêu đề"}
                                  </span>
                                </SidebarMenuButton>
                                <NoteActionMenu
                                  note={note}
                                  hasPrivatePin={currentUser?.hasPrivatePin}
                                />
                              </SidebarMenuItem>
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
      <SidebarUserProfile
        currentUser={currentUser}
        onLogout={onLogout}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />

      {/* Dialog Đổi tên chủ đề */}
      <RenameTopicDialog
        topic={topicToRename}
        open={topicToRename !== null}
        onOpenChange={(open) => {
          if (!open) setTopicToRename(null);
        }}
        onRename={handleRenameTopic}
      />
    </Sidebar>
  );
}
