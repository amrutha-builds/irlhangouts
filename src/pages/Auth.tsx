import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, ArrowLeft } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"options" | "email">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.redirected) return;
      if (result.error) throw result.error;

      if (result.tokens) {
        const { error: sessionError } = await supabase.auth.setSession(result.tokens);
        if (sessionError) throw sessionError;
        navigate("/dashboard", { replace: true });
      }
    } catch (e: any) {
      console.error("Google sign-in error:", e);
      toast({
        title: "Google sign-in failed",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-6 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Let's Hang Out IRL
          </h1>
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <p className="mb-8 text-muted-foreground">
          Sign in to get back to your squad
        </p>

        {mode === "options" ? (
          <div className="space-y-3">
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

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={() => setMode("email")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 font-medium text-card-foreground transition-all hover:bg-accent"
            >
              <Mail className="h-5 w-5" />
              Sign in with Email
            </button>

            <p className="pt-2 text-xs text-muted-foreground">
              Don't have an account?{" "}
              <button onClick={() => navigate("/")} className="text-primary hover:underline">
                Create or join a squad
              </button>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => setMode("options")}
              className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          </form>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
