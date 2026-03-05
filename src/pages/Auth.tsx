import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ACCESS_CODE = "GFBOND2026";

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accessGranted, setAccessGranted] = useState(() => sessionStorage.getItem("gf_access") === "true");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      sessionStorage.setItem("gf_access", "true");
      setAccessGranted(true);
      setCodeError("");
    } else {
      setCodeError("Invalid code. Ask a member for the invite code.");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (e: any) {
      console.error("Google sign-in error:", e);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">
        {!accessGranted ? (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mb-6 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Invite Only
              </h1>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="mb-6 text-muted-foreground">Enter your invite code to continue</p>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                  placeholder="Enter code"
                  className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-center text-lg font-medium tracking-widest uppercase text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              {codeError && <p className="text-sm text-destructive">{codeError}</p>}
              <button type="submit" className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90">
                Enter
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mb-6 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Welcome, babe!
              </h1>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="mb-8 text-muted-foreground">Sign in to see what's on the agenda</p>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 font-medium text-card-foreground transition-all hover:bg-accent disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
