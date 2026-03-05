import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-girlfriends.jpg";
import EventCard from "@/components/EventCard";
import { Sparkles, RefreshCw, LogOut } from "lucide-react";
import AddEventDialog from "@/components/AddEventDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DbEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  emoji: string;
  source_url: string | null;
}

interface Profile {
  id: string;
  display_name: string;
  emoji: string;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [weekendOnly, setWeekendOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eventsRes, profilesRes, rsvpsRes] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("rsvps").select("*"),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);

    // Build rsvp map: { eventId: { userId: going } }
    const rsvpMap: Record<string, Record<string, boolean>> = {};
    if (rsvpsRes.data) {
      for (const r of rsvpsRes.data) {
        if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = {};
        rsvpMap[r.event_id][r.user_id] = r.going;
      }
    }
    setRsvps(rsvpMap);
    setLoading(false);
  };

  const toggleRsvp = async (eventId: string) => {
    if (!user) return;
    const currentlyGoing = rsvps[eventId]?.[user.id] ?? false;
    const newGoing = !currentlyGoing;

    // Optimistic update
    setRsvps((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [user.id]: newGoing },
    }));

    const { error } = await supabase
      .from("rsvps")
      .upsert(
        { event_id: eventId, user_id: user.id, going: newGoing },
        { onConflict: "event_id,user_id" }
      );

    if (error) {
      // Revert
      setRsvps((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], [user.id]: currentlyGoing },
      }));
      toast({ title: "Error", description: "Failed to update RSVP", variant: "destructive" });
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    toast({ title: "🔍 Finding events...", description: "Scraping SF Bay Area event sources. This may take a minute." });

    try {
      const { data, error } = await supabase.functions.invoke("scrape-events");
      if (error) throw error;
      if (data?.success) {
        toast({ title: "✨ Events updated!", description: `Found ${data.eventsFound} events from ${data.sources} sources.` });
        await loadData();
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to scrape events", variant: "destructive" });
    } finally {
      setScraping(false);
    }
  };

  const isWeekend = (dateStr: string) => {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return false;
    const day = parsed.getDay();
    return day === 0 || day === 5 || day === 6;
  };

  const filteredEvents = weekendOnly ? events.filter((e) => isWeekend(e.date)) : events;

  const eventsWithFriends = filteredEvents.map((event) => ({
    ...event,
    friends: profiles.map((p) => ({
      name: p.display_name,
      emoji: p.emoji,
      going: rsvps[event.id]?.[p.id] ?? false,
      isCurrentUser: p.id === user?.id,
    })),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header actions */}
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          onClick={handleScrape}
          disabled={scraping}
          className="flex items-center gap-2 rounded-full bg-primary/80 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${scraping ? "animate-spin" : ""}`} />
          {scraping ? "Finding events..." : "Find Events"}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-full bg-background/50 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-background/80"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Hero */}
      <div className="relative h-[420px] overflow-hidden">
        <img
          src={heroImage}
          alt="Five girlfriends laughing together at golden hour"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/20 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-3 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
              <span className="text-sm font-medium tracking-widest uppercase text-primary-foreground/80" style={{ fontFamily: "var(--font-body)" }}>
                The Fab Five
              </span>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-primary-foreground md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
              Girls' Night Agenda
            </h1>
            <p className="mx-auto mt-3 max-w-md text-lg text-primary-foreground/80" style={{ fontFamily: "var(--font-body)" }}>
              SF Bay Area events for our crew ✨
            </p>
          </motion.div>
        </div>
      </div>

      {/* Squad bar */}
      <div className="flex items-center justify-center gap-3 py-6">
        {profiles.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-1">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg ring-2 ${p.id === user?.id ? "ring-primary" : "ring-primary/30"}`}>
              {p.emoji}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{p.display_name}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekendOnly(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${!weekendOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            All Events
          </button>
          <button
            onClick={() => setWeekendOnly(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${weekendOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            🎉 Weekends Only
          </button>
        </div>
        <AddEventDialog onEventAdded={loadData} />
      </div>

      {/* Events grid */}
      <div className="mx-auto max-w-5xl px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <p className="text-lg text-muted-foreground">No events yet!</p>
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {scraping ? "Finding events..." : "🔍 Discover SF Bay Area Events"}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventsWithFriends.map((event, i) => (
              <EventCard
                key={event.id}
                {...event}
                index={i}
                onToggleRsvp={() => toggleRsvp(event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
