import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Loader2, ArrowRight, Plus, Users, LogIn, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import EventCard from "@/components/EventCard";

interface LandingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  emoji: string;
  source_url: string | null;
  description: string | null;
}

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");
  const [events, setEvents] = useState<LandingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LandingEvent | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Squad creation state
  const [squadName, setSquadName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user]);

  // Load existing public events on mount
  useEffect(() => {
    loadExistingEvents();
  }, []);

  const loadExistingEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .is("squad_id", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data && data.length > 0) {
      setEvents(data);
      setHasSearched(true);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setSubmittedCity(city.trim());
    setHasSearched(true);

    try {
      await supabase.functions.invoke("scrape-events", {
        body: { location: city.trim() },
      });

      const { data } = await supabase
        .from("events")
        .select("*")
        .is("squad_id", null)
        .order("created_at", { ascending: false })
        .limit(30);

      if (data) setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: LandingEvent) => {
    setSelectedEvent(event);
    setShowActionModal(true);
    setCodeError("");
    setSquadName("");
    setJoinCode("");
  };

  const handleCreateSquad = () => {
    if (!squadName.trim()) return;
    const base = squadName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${base}${suffix}`;
    sessionStorage.setItem("pending_squad", JSON.stringify({ name: squadName.trim(), invite_code: code }));
    navigate("/auth");
  };

  const handleJoinSquad = () => {
    const code = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) { setCodeError("Code must be at least 4 characters"); return; }
    sessionStorage.setItem("join_squad_code", code);
    navigate("/auth");
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-primary px-4 pb-12 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <h1
            className="mb-2 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Let's Hang IRL
          </h1>
          <p className="mb-8 text-sm text-primary-foreground/70">
            Discover events near you and plan hangouts with your squad ✨
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city (e.g. San Jose, CA)"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !city.trim()}
              className="flex items-center gap-2 rounded-xl bg-card px-5 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find Events
            </button>
          </form>
        </motion.div>
      </div>

      {/* Events Grid */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Finding events near {submittedCity}...
            </p>
          </div>
        )}

        {!loading && hasSearched && events.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No events found. Try a different city!</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {submittedCity ? `Events near ${submittedCity}` : "Upcoming events"} — tap any event to get started
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, i) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={event.date}
                  location={event.location}
                  category={event.category}
                  emoji={event.emoji}
                  source_url={event.source_url}
                  description={event.description}
                  friends={[]}
                  index={i}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          </>
        )}

        {!hasSearched && !loading && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              Enter your city above to discover weekend events near you 🎉
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {showActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowActionModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowActionModal(false)}
                className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>

              {selectedEvent && (
                <div className="mb-5">
                  <span className="text-3xl">{selectedEvent.emoji}</span>
                  <h3
                    className="mt-2 text-lg font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedEvent.date} · {selectedEvent.location}</p>
                </div>
              )}

              <p className="mb-4 text-sm text-muted-foreground">
                Sign in or create a squad to RSVP and plan with friends
              </p>

              <div className="flex flex-col gap-3">
                {/* Start a Squad */}
                <div className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Start a New Squad</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                      placeholder="Squad name"
                      maxLength={50}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={handleCreateSquad}
                      disabled={!squadName.trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Go
                    </button>
                  </div>
                </div>

                {/* Join a Squad */}
                <div className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent-foreground" />
                    <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Join a Squad</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setCodeError(""); }}
                      placeholder="Invite code"
                      maxLength={20}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-medium tracking-widest uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={handleJoinSquad}
                      disabled={!joinCode.trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                  {codeError && <p className="mt-1 text-xs text-destructive">{codeError}</p>}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Sign In */}
                <button
                  onClick={() => navigate("/auth")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 text-sm font-medium text-secondary-foreground hover:bg-accent"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
