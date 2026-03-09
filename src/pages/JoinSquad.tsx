import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const JoinSquad = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && code) {
      findAndJoinSquad();
    }
  }, [user, code]);

  const findAndJoinSquad = async () => {
    if (!user || !code) return;

    const { data: squad, error: findError } = await supabase
      .from("squads")
      .select("id, name")
      .eq("invite_code", code.toUpperCase())
      .maybeSingle();

    if (findError || !squad) {
      toast({ title: "Invalid code", description: "This invite code doesn't exist.", variant: "destructive" });
      navigate("/dashboard", { replace: true });
      return;
    }

    const { error: joinError } = await supabase
      .from("squad_members")
      .upsert(
        { squad_id: squad.id, user_id: user.id },
        { onConflict: "squad_id,user_id" }
      );

    if (joinError) {
      toast({ title: "Error", description: "Failed to join squad", variant: "destructive" });
    } else {
      toast({ title: `Joined ${squad.name}! 🎉`, description: "You're now part of the squad." });
    }
    navigate("/dashboard", { replace: true });
  };

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Joining squad...</p>
      </div>
    );
  }

  // Not logged in — save code and prompt sign up
  sessionStorage.setItem("join_squad_code", code?.toUpperCase() ?? "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex max-w-sm flex-col items-center gap-6 text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            You've Been Invited!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign up to join your squad and start planning nights out together
          </p>
        </div>
        <div className="rounded-xl bg-muted px-6 py-3">
          <p className="text-xs font-medium text-muted-foreground">Invite Code</p>
          <p className="text-xl font-bold tracking-widest text-foreground">{code?.toUpperCase()}</p>
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
        >
          Sign Up to Join
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};

export default JoinSquad;
