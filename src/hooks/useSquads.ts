import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Squad {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  member_count: number;
  folder_id: string | null;
  archived_at: string | null;
}

interface SquadFolder {
  id: string;
  name: string;
}

export const useSquads = (userId: string | undefined) => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [archivedSquads, setArchivedSquads] = useState<Squad[]>([]);
  const [folders, setFolders] = useState<SquadFolder[]>([]);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [squadMemberIds, setSquadMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSquads = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get all memberships including archived
    const { data: memberships } = await supabase
      .from("squad_members")
      .select("squad_id, folder_id, archived_at")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      setSquads([]);
      setArchivedSquads([]);
      setLoading(false);
      return;
    }

    const allSquadIds = memberships.map((m) => m.squad_id);
    const activeMemberships = memberships.filter((m) => !(m as any).archived_at);
    const archivedMemberships = memberships.filter((m) => (m as any).archived_at);

    // Get squad details
    const { data: squadsData } = await supabase
      .from("squads")
      .select("*")
      .in("id", allSquadIds);

    // Get active member counts (exclude archived members)
    const { data: allMembers } = await supabase
      .from("squad_members")
      .select("squad_id, user_id")
      .in("squad_id", allSquadIds)
      .is("archived_at" as any, null);

    const countMap: Record<string, number> = {};
    allMembers?.forEach((m) => {
      countMap[m.squad_id] = (countMap[m.squad_id] || 0) + 1;
    });

    // Load folders
    const { data: foldersData } = await supabase
      .from("squad_folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    setFolders((foldersData as any[])?.map((f) => ({ id: f.id, name: f.name })) || []);

    // Build folder/archived maps from memberships
    const folderMap: Record<string, string | null> = {};
    memberships.forEach((m) => {
      folderMap[m.squad_id] = (m as any).folder_id || null;
    });

    const enrichAll = (squadsData || []).map((s) => ({
      ...s,
      member_count: countMap[s.id] || 0,
      folder_id: folderMap[s.id] || null,
      archived_at: null as string | null,
    }));

    const activeSquadIds = activeMemberships.map((m) => m.squad_id);
    const archivedSquadIds = archivedMemberships.map((m) => m.squad_id);

    setSquads(enrichAll.filter((s) => activeSquadIds.includes(s.id)));
    setArchivedSquads(
      enrichAll
        .filter((s) => archivedSquadIds.includes(s.id))
        .map((s) => ({
          ...s,
          archived_at: (archivedMemberships.find((m) => m.squad_id === s.id) as any)?.archived_at,
        }))
    );

    // Auto-select first active squad if none selected
    if (!activeSquadId || !activeSquadIds.includes(activeSquadId)) {
      const firstActive = enrichAll.find((s) => activeSquadIds.includes(s.id));
      setActiveSquadId(firstActive?.id ?? null);
    }

    setLoading(false);
  }, [userId, activeSquadId]);

  // Load members of active squad (only non-archived)
  useEffect(() => {
    if (!activeSquadId) {
      setSquadMemberIds([]);
      return;
    }

    const loadMembers = async () => {
      const { data } = await supabase
        .from("squad_members")
        .select("user_id, archived_at")
        .eq("squad_id", activeSquadId);
      const activeMembers = (data || []).filter((m) => !(m as any).archived_at);
      setSquadMemberIds(activeMembers.map((m) => m.user_id));
    };

    loadMembers();
  }, [activeSquadId]);

  const createFolder = useCallback(async (name: string) => {
    if (!userId) return;
    await supabase.from("squad_folders").insert({ user_id: userId, name } as any);
    await loadSquads();
  }, [userId, loadSquads]);

  const renameFolder = useCallback(async (folderId: string, name: string) => {
    await supabase.from("squad_folders").update({ name } as any).eq("id", folderId);
    await loadSquads();
  }, [loadSquads]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!userId) return;
    // Move squads out of folder first
    const { data: members } = await supabase
      .from("squad_members")
      .select("id")
      .eq("user_id", userId);
    
    // Update members in this folder to have no folder
    if (members) {
      for (const m of members) {
        await supabase
          .from("squad_members")
          .update({ folder_id: null } as any)
          .eq("id", m.id);
      }
    }
    await supabase.from("squad_folders").delete().eq("id", folderId);
    await loadSquads();
  }, [userId, loadSquads]);

  const moveToFolder = useCallback(async (squadId: string, folderId: string | null) => {
    if (!userId) return;
    await supabase
      .from("squad_members")
      .update({ folder_id: folderId } as any)
      .eq("user_id", userId)
      .eq("squad_id", squadId);
    await loadSquads();
  }, [userId, loadSquads]);

  const exitSquad = useCallback(async (squadId: string) => {
    if (!userId) return;
    // Archive instead of delete - set archived_at
    await supabase
      .from("squad_members")
      .update({ archived_at: new Date().toISOString(), folder_id: null } as any)
      .eq("user_id", userId)
      .eq("squad_id", squadId);
    await loadSquads();
  }, [userId, loadSquads]);

  const rejoinSquad = useCallback(async (squadId: string) => {
    if (!userId) return;
    await supabase
      .from("squad_members")
      .update({ archived_at: null } as any)
      .eq("user_id", userId)
      .eq("squad_id", squadId);
    await loadSquads();
  }, [userId, loadSquads]);

  const createSquad = useCallback(async (name: string, inviteCode: string) => {
    if (!userId) return;
    const { data: squad, error } = await supabase
      .from("squads")
      .insert({ name, invite_code: inviteCode, created_by: userId })
      .select("id")
      .single();
    if (error || !squad) return;
    await supabase.from("squad_members").insert({ squad_id: squad.id, user_id: userId });
    await loadSquads();
  }, [userId, loadSquads]);

  const deleteSquad = useCallback(async (squadId: string) => {
    if (!userId) return;
    await supabase.from("squad_members").delete().eq("squad_id", squadId);
    await supabase.from("squads").delete().eq("id", squadId);
    await loadSquads();
  }, [userId, loadSquads]);

  const renameSquad = useCallback(async (squadId: string, newName: string) => {
    if (!userId || !newName.trim()) return;
    await supabase
      .from("squads")
      .update({ name: newName.trim() })
      .eq("id", squadId)
      .eq("created_by", userId);
    await loadSquads();
  }, [userId, loadSquads]);

  const joinSquadByCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: "Not authenticated" };
    const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!normalizedCode) return { success: false, message: "Please enter an invite code" };

    const { data: squad, error: findError } = await supabase
      .from("squads")
      .select("id, name")
      .eq("invite_code", normalizedCode)
      .maybeSingle();

    if (findError || !squad) return { success: false, message: "No squad found with that code" };

    // Check if already a member
    const { data: existing } = await supabase
      .from("squad_members")
      .select("id, archived_at")
      .eq("squad_id", squad.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing && !(existing as any).archived_at) {
      return { success: false, message: "You're already in this squad" };
    }

    if (existing && (existing as any).archived_at) {
      // Rejoin archived membership
      await supabase
        .from("squad_members")
        .update({ archived_at: null } as any)
        .eq("id", existing.id);
    } else {
      await supabase.from("squad_members").insert({ squad_id: squad.id, user_id: userId });
    }

    await loadSquads();
    return { success: true, message: `Joined ${squad.name}! 🎉` };
  }, [userId, loadSquads]);

  useEffect(() => {
    loadSquads();
  }, [loadSquads]);

  return {
    squads,
    archivedSquads,
    folders,
    activeSquadId,
    setActiveSquadId,
    squadMemberIds,
    loading,
    reload: loadSquads,
    createFolder,
    renameFolder,
    deleteFolder,
    moveToFolder,
    exitSquad,
    rejoinSquad,
    createSquad,
    deleteSquad,
    joinSquadByCode,
    renameSquad,
  };
};
