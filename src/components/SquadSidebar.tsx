import { Users, CalendarCheck, Copy, Check, LogOut } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface Squad {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
}

interface SquadSidebarProps {
  squads: Squad[];
  activeView: string | null; // squad id or "my-plans"
  onSelectView: (view: string) => void;
  onSignOut: () => void;
  userName?: string;
  userEmoji?: string;
  myPlansCount?: number;
}

const SquadSidebar = ({
  squads,
  activeView,
  onSelectView,
  onSignOut,
  userName,
  userEmoji,
  myPlansCount = 0,
}: SquadSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, squad: Squad) => {
    e.stopPropagation();
    const url = `${window.location.origin}/join/${squad.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(squad.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed ? "Navigation" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* My Plans item */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSelectView("my-plans")}
                  isActive={activeView === "my-plans"}
                  tooltip="My Plans"
                >
                  <CalendarCheck className="h-5 w-5" />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium">My Plans</span>
                      {myPlansCount > 0 && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {myPlansCount}
                        </span>
                      )}
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Squads */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Users className="mr-2 h-4 w-4" />
            {!collapsed && "My Squads"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {squads.map((squad) => (
                <SidebarMenuItem key={squad.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectView(squad.id)}
                    isActive={activeView === squad.id}
                    tooltip={squad.name}
                  >
                    <span className="text-lg">👯</span>
                    {!collapsed && (
                      <div className="flex flex-1 items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{squad.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {squad.member_count} member{squad.member_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleCopy(e, squad)}
                          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                          title="Copy invite link"
                        >
                          {copiedId === squad.id ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip="Sign out">
              <span className="text-lg">{userEmoji || "👩"}</span>
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="truncate text-sm">{userName || "Me"}</span>
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SquadSidebar;
