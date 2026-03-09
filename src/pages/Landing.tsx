import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Copy, Check, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"hero" | "create" | "done">("hero");
  const [squadName, setSquadName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);

  // If already logged in, go to dashboard
  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) {
      setCodeError("Code must be at least 4 characters");
      return;
    }
    if (code.length > 20) {
      setCodeError("Code must be 20 characters or less");
      return;
    }
    if (!squadName.trim()) return;

    // Store in sessionStorage for post-auth creation
    sessionStorage.setItem("pending_squad", JSON.stringify({
      name: squadName.trim(),
      invite_code: code,
    }));
    setInviteCode(code);
    setStep("done");
  };

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">
        {step === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex max-w-md flex-col items-center gap-6 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
                  Squad Events
                </span>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h1
                className="text-4xl font-bold tracking-tight text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Girls' Night Agenda
              </h1>
              <p className="mt-3 text-muted-foreground">
                Discover events, RSVP with your crew, and never miss a night out ✨
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={() => setStep("create")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Hook My Squad Up
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Already have a squad? Sign in
              </button>
            </div>
          </motion.div>
        )}

        {step === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm"
          >
            <button
              onClick={() => setStep("hero")}
              className="mb-6 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>

            <h2
              className="mb-2 text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Create Your Squad
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Pick a name and a custom invite code your friends will use to join
            </p>

            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Squad Name
                </label>
                <input
                  type="text"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  placeholder="The Fab Five"
                  maxLength={50}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                    setCodeError("");
                  }}
                  placeholder="GIRLSNIGHT"
                  maxLength={20}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg font-medium tracking-widest uppercase text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                {codeError && (
                  <p className="mt-1 text-sm text-destructive">{codeError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Create Squad ✨
              </button>
            </form>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex w-full max-w-sm flex-col items-center gap-6 text-center"
          >
            <span className="text-5xl">🎉</span>
            <div>
              <h2
                className="text-2xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Squad Ready!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Share this link with your crew so they can join
              </p>
            </div>

            <div className="w-full rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Share Link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground">
                  {window.location.origin}/join/{inviteCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Sign Up to Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
