import { Plus, Folder } from "lucide-react";
import type { Topic } from "@/types/note";
import { NoteVaultLogo } from "@/components/common/NoteVaultLogo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";

interface SidebarProps {
  topics: Topic[];
  activeTopicId: string;
  onSelectTopic: (id: string) => void;
  onNewTopicClick: () => void;
}

export function AppSidebar({
  topics,
  activeTopicId,
  onSelectTopic,
  onNewTopicClick,
}: SidebarProps) {
  return (
    <Sidebar className="border-border bg-sidebar z-50 border-r">
      <SidebarHeader className="gap-4 p-4">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <NoteVaultLogo size={32} className="shrink-0 rounded-lg shadow-sm" />
          <span className="text-foreground text-lg font-semibold tracking-tight">
            NoteVault
          </span>
        </div>

        {/* Action button */}
        <Button
          type="button"
          onClick={onNewTopicClick}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium shadow-sm"
        >
          <Plus className="size-4" />
          <span>Tạo chủ đề</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">
            Chủ đề
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {topics.map((topic) => {
                const isActive = topic.id === activeTopicId;
                return (
                  <SidebarMenuItem key={topic.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelectTopic(topic.id)}
                      className={`h-9 w-full cursor-pointer justify-between rounded-lg px-3 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Folder className="size-4 shrink-0" />
                        <span className="truncate">{topic.name}</span>
                      </div>
                      <SidebarMenuBadge
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isActive
                            ? "bg-primary/20 text-primary font-semibold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {topic.count}
                      </SidebarMenuBadge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
export { AppSidebar as Sidebar };
