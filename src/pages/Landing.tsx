import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Copy, Check, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [squadName, setSquadName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState(false);

  // Generate a suggested invite code from squad name
  useEffect(() => {
    const name = squadName.trim();
    if (!name) {setInviteCode("");return;}
    const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    setInviteCode(base ? `${base}${suffix}` : "");
  }, [squadName]);

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) {setCodeError("Code must be at least 4 characters");return;}
    if (code.length > 20) {setCodeError("Code must be 20 characters or less");return;}
    if (!squadName.trim()) return;
    sessionStorage.setItem("pending_squad", JSON.stringify({ name: squadName.trim(), invite_code: code }));
    setInviteCode(code);
    setCreated(true);
  };

  const handleJoinSquad = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) {setCodeError("Code must be at least 4 characters");return;}
    sessionStorage.setItem("join_squad_code", code);
    navigate("/auth");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          
          <span className="text-5xl">🎉</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Squad Ready!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Share this link with your crew</p>
          </div>
          <div className="w-full rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Share Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground">
                {window.location.origin}/join/{inviteCode}
              </code>
              <button onClick={handleCopy} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button onClick={() => navigate("/auth")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90">
            Sign Up to Continue <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>);

  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-md flex-col items-center gap-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Squad Events</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Let's  Meet IRL          
          </h1>
          <p className="text-sm text-muted-foreground">Discover events, RSVP with your crew, and never miss a night out ✨</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="create" className="w-full" onValueChange={() => setCodeError("")}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="create" className="rounded-lg">Create Squad</TabsTrigger>
            <TabsTrigger value="join" className="rounded-lg">Join Squad</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Squad Name</label>
                <input
                  type="text" value={squadName} onChange={(e) => setSquadName(e.target.value)}
                  placeholder="The Fab Five" maxLength={50} required autoFocus
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Invite Code</label>
                <input
                  type="text" value={inviteCode}
                  onChange={(e) => {setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));setCodeError("");}}
                  maxLength={20} required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg font-medium tracking-widest uppercase text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Create an invite code" />
                
                {codeError && <p className="mt-1 text-sm text-destructive">{codeError}</p>}
              </div>
              <button type="submit" className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90">
                Create Squad ✨
              </button>
            </form>
          </TabsContent>

          <TabsContent value="join" className="mt-4">
            <form onSubmit={handleJoinSquad} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Invite Code</label>
                <input
                  type="text" value={joinCode}
                  onChange={(e) => {setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));setCodeError("");}}
                  maxLength={20} required autoFocus
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg font-medium tracking-widest uppercase text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter Invite code" />
                
                {codeError && <p className="mt-1 text-sm text-destructive">{codeError}</p>}
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90">
                Join Squad <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </TabsContent>
        </Tabs>

        <button onClick={() => navigate("/auth")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Already have a squad? Sign in
        </button>
      </motion.div>
    </div>);

};

export default Landing;