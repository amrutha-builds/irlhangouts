import {
  Users,
  CalendarCheck,
  Copy,
  Check,
  LogOut,
  FolderPlus,
  FolderOpen,
  Archive,
  MoreHorizontal,
  DoorOpen,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
  Pencil,
  Plus,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Squad {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  folder_id: string | null;
  archived_at: string | null;
}

interface SquadFolder {
  id: string;
  name: string;
}

interface SquadSidebarProps {
  squads: Squad[];
  archivedSquads: Squad[];
  folders: SquadFolder[];
  activeView: string | null;
  onSelectView: (view: string) => void;
  onSignOut: () => void;
  userName?: string;
  userEmoji?: string;
  myPlansCount?: number;
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onMoveToFolder: (squadId: string, folderId: string | null) => Promise<void>;
  onExitSquad: (squadId: string) => Promise<void>;
  onRejoinSquad: (squadId: string) => Promise<void>;
  onCreateSquad: (name: string, inviteCode: string) => Promise<void>;
  onDeleteSquad: (squadId: string) => Promise<void>;
}

const SquadSidebar = ({
  squads,
  archivedSquads,
  folders,
  activeView,
  onSelectView,
  onSignOut,
  userName,
  userEmoji,
  myPlansCount = 0,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  onExitSquad,
  onRejoinSquad,
  onCreateSquad,
  onDeleteSquad,
}: SquadSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<SquadFolder | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [exitConfirm, setExitConfirm] = useState<Squad | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showNewSquad, setShowNewSquad] = useState(false);
  const [newSquadName, setNewSquadName] = useState("");
  const [newSquadCode, setNewSquadCode] = useState("");
  const [creatingSquad, setCreatingSquad] = useState(false);
  const [newSquadCopied, setNewSquadCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent, squad: Squad) => {
    e.stopPropagation();
    const url = `${window.location.origin}/join/${squad.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(squad.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renameFolderName.trim()) return;
    await onRenameFolder(renamingFolder.id, renameFolderName.trim());
    setRenamingFolder(null);
    setRenameFolderName("");
  };

  const generateCode = (name: string) => {
    const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return base ? `${base}${suffix}` : "";
  };

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return;
    setCreatingSquad(true);
    const code = newSquadCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || generateCode(newSquadName);
    await onCreateSquad(newSquadName.trim(), code);
    setNewSquadName("");
    setNewSquadCode("");
    setCreatingSquad(false);
    setShowNewSquad(false);
  };

  // Squads not in any folder
  const unfolderedSquads = squads.filter((s) => !s.folder_id);
  // Squads grouped by folder
  const squadsByFolder = (folderId: string) => squads.filter((s) => s.folder_id === folderId);

  const renderSquadItem = (squad: Squad) => (
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
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => handleCopy(e, squad)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                title="Copy invite link"
              >
                {copiedId === squad.id ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {folders.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Move to folder
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {squad.folder_id && (
                          <DropdownMenuItem onClick={() => onMoveToFolder(squad.id, null)}>
                            No folder
                          </DropdownMenuItem>
                        )}
                        {folders
                          .filter((f) => f.id !== squad.folder_id)
                          .map((f) => (
                            <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(squad.id, f.id)}>
                              <FolderOpen className="mr-2 h-4 w-4" />
                              {f.name}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setExitConfirm(squad)}
                    className="text-destructive focus:text-destructive"
                  >
                    <DoorOpen className="mr-2 h-4 w-4" />
                    Exit & Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent>
          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>{!collapsed ? "Navigation" : ""}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
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
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  {!collapsed && "My Squads"}
                </div>
                {!collapsed && (
                  <button
                    onClick={() => setShowNewFolder(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                    title="New folder"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Folders */}
                {folders.map((folder) => {
                  const folderSquads = squadsByFolder(folder.id);
                  return (
                    <Collapsible key={folder.id} defaultOpen>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={folder.name}>
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            {!collapsed && (
                              <div className="flex flex-1 items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {folder.name}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setRenamingFolder(folder);
                                        setRenameFolderName(folder.name);
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onDeleteFolder(folder.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete folder
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenu className="ml-4 border-l border-border pl-2">
                            {folderSquads.map(renderSquadItem)}
                            {folderSquads.length === 0 && !collapsed && (
                              <p className="px-3 py-2 text-xs text-muted-foreground">No squads</p>
                            )}
                          </SidebarMenu>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}

                {/* Unfoldered squads */}
                {unfolderedSquads.map(renderSquadItem)}

                {/* New Squad button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      setNewSquadName("");
                      setNewSquadCode("");
                      setShowNewSquad(true);
                    }}
                    tooltip="Create new squad"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    {!collapsed && (
                      <span className="text-sm font-medium text-primary">New Squad</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Archive section */}
          {archivedSquads.length > 0 && (
            <SidebarGroup>
              <Collapsible open={showArchive} onOpenChange={setShowArchive}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer">
                    <Archive className="mr-2 h-4 w-4" />
                    {!collapsed && `Archive (${archivedSquads.length})`}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {archivedSquads.map((squad) => (
                        <SidebarMenuItem key={squad.id}>
                          <SidebarMenuButton tooltip={`${squad.name} (archived)`}>
                            <span className="text-lg opacity-50">👯</span>
                            {!collapsed && (
                              <div className="flex flex-1 items-center justify-between">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-muted-foreground">
                                    {squad.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground/60">
                                    {squad.member_count} active member{squad.member_count !== 1 ? "s" : ""}
                                  </p>
                                </div>
                                <button
                                  onClick={() => onRejoinSquad(squad.id)}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-primary"
                                  title="Rejoin squad"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}
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

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create a folder to organize your squads.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Work Friends"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
              className="flex-1 rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={(o) => !o && setRenamingFolder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Give this folder a new name.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <input
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
              autoFocus
              className="flex-1 rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleRenameFolder}
              disabled={!renameFolderName.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit squad confirmation */}
      <AlertDialog open={!!exitConfirm} onOpenChange={(o) => !o && setExitConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit "{exitConfirm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll leave this squad and it will move to your archive. The squad will stay active for other members. You can rejoin anytime from the archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (exitConfirm) onExitSquad(exitConfirm.id);
                setExitConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit Squad
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New squad dialog */}
      <Dialog open={showNewSquad} onOpenChange={setShowNewSquad}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create a New Squad</DialogTitle>
            <DialogDescription>Start a new crew and invite your friends.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Squad name (e.g. Weekend Warriors)"
              value={newSquadName}
              onChange={(e) => {
                setNewSquadName(e.target.value);
                setNewSquadCode(generateCode(e.target.value));
              }}
              autoFocus
              className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Invite Code</label>
              <input
                type="text"
                placeholder="Auto-generated"
                value={newSquadCode}
                onChange={(e) => setNewSquadCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-mono text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={handleCreateSquad}
              disabled={!newSquadName.trim() || creatingSquad}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {creatingSquad ? "Creating..." : "Create Squad"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SquadSidebar;
