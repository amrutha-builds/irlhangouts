import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PendingJoinSquad {
  id: string;
  name: string;
}

/**
 * After auth, checks sessionStorage for pending squad creation or join requests.
 * Returns pending join squads when multiple match an invite code (for picker UI).
 */
export const useSquadSetup = (userId: string | undefined) => {
  const { toast } = useToast();
  const [pendingJoinSquads, setPendingJoinSquads] = useState<PendingJoinSquad[]>([]);

  const joinSquad = async (squad: PendingJoinSquad) => {
    if (!userId) return;
    const { error } = await supabase
      .from("squad_members")
      .upsert(
        { squad_id: squad.id, user_id: userId },
        { onConflict: "squad_id,user_id" }
      );
    if (!error) {
      toast({ title: `Joined ${squad.name}! 🎉` });
    }
    setPendingJoinSquads([]);
  };

  const dismissPicker = () => setPendingJoinSquads([]);

  useEffect(() => {
    if (!userId) return;

    const processPending = async () => {
      // Handle pending squad creation
      const pendingRaw = sessionStorage.getItem("pending_squad");
      if (pendingRaw) {
        sessionStorage.removeItem("pending_squad");
        try {
          const pending = JSON.parse(pendingRaw);
          const { data: squad, error } = await supabase
            .from("squads")
            .insert({
              name: pending.name,
              invite_code: pending.invite_code,
              created_by: userId,
            })
            .select("id")
            .single();

          if (error) {
            throw error;
          } else if (squad) {
            await supabase.from("squad_members").insert({
              squad_id: squad.id,
              user_id: userId,
            });
            toast({ title: `Squad "${pending.name}" created! 🎉` });
          }
        } catch (e: any) {
          console.error("Squad creation error:", e);
        }
      }

      // Handle pending squad join
      const joinCode = sessionStorage.getItem("join_squad_code");
      if (joinCode) {
        sessionStorage.removeItem("join_squad_code");
        const { data: squads } = await supabase
          .from("squads")
          .select("id, name")
          .eq("invite_code", joinCode);

        if (squads && squads.length === 1) {
          const { error } = await supabase
            .from("squad_members")
            .upsert(
              { squad_id: squads[0].id, user_id: userId },
              { onConflict: "squad_id,user_id" }
            );
          if (!error) {
            toast({ title: `Joined ${squads[0].name}! 🎉` });
          }
        } else if (squads && squads.length > 1) {
          setPendingJoinSquads(squads);
        }
      }
    };

    processPending();
  }, [userId, toast]);

  return { pendingJoinSquads, joinSquad, dismissPicker };
};
