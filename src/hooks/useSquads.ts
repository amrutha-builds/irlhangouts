import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Squad {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  member_count: number;
}

export const useSquads = (userId: string | undefined) => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [squadMemberIds, setSquadMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSquads = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get squads user belongs to
    const { data: memberships } = await supabase
      .from("squad_members")
      .select("squad_id")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      setSquads([]);
      setLoading(false);
      return;
    }

    const squadIds = memberships.map((m) => m.squad_id);

    // Get squad details
    const { data: squadsData } = await supabase
      .from("squads")
      .select("*")
      .in("id", squadIds);

    // Get member counts
    const { data: allMembers } = await supabase
      .from("squad_members")
      .select("squad_id, user_id")
      .in("squad_id", squadIds);

    const countMap: Record<string, number> = {};
    allMembers?.forEach((m) => {
      countMap[m.squad_id] = (countMap[m.squad_id] || 0) + 1;
    });

    const enriched: Squad[] = (squadsData || []).map((s) => ({
      ...s,
      member_count: countMap[s.id] || 0,
    }));

    setSquads(enriched);

    // Auto-select first squad if none active
    if (!activeSquadId || !squadIds.includes(activeSquadId)) {
      setActiveSquadId(enriched[0]?.id ?? null);
    }

    setLoading(false);
  }, [userId, activeSquadId]);

  // Load members of active squad
  useEffect(() => {
    if (!activeSquadId) {
      setSquadMemberIds([]);
      return;
    }

    const loadMembers = async () => {
      const { data } = await supabase
        .from("squad_members")
        .select("user_id")
        .eq("squad_id", activeSquadId);
      setSquadMemberIds(data?.map((m) => m.user_id) || []);
    };

    loadMembers();
  }, [activeSquadId]);

  useEffect(() => {
    loadSquads();
  }, [loadSquads]);

  return { squads, activeSquadId, setActiveSquadId, squadMemberIds, loading, reload: loadSquads };
};
