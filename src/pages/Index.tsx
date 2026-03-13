import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-friends-mixed.jpg";
import EventCard from "@/components/EventCard";
import EventDetailDialog from "@/components/EventDetailDialog";
import { Sparkles, RefreshCw } from "lucide-react";
import AddEventDialog from "@/components/AddEventDialog";
import PersonalityQuiz, { OnboardingQuiz } from "@/components/PersonalityQuiz";
import LocationOnboarding from "@/components/LocationOnboarding";
import SquadSidebar from "@/components/SquadSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSquadSetup } from "@/hooks/useSquadSetup";

import { useSquads } from "@/hooks/useSquads";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface DbEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  emoji: string;
  source_url: string | null;
  description: string | null;
}

interface Profile {
  id: string;
  display_name: string;
  emoji: string;
  personality_type: string | null;
  location?: string | null;
}

const DashboardContent = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  useSquadSetup(user?.id);
  const { squads, activeSquadId, setActiveSquadId, squadMemberIds, reload: reloadSquads } = useSquads(user?.id);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Record<string, boolean>>>({});
  const [myRsvps, setMyRsvps] = useState<{ event_id: string; squad_id: string; going: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showLocationOnboarding, setShowLocationOnboarding] = useState(false);
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const isMyPlansView = activeView === "my-plans";
  const effectiveSquadId = isMyPlansView ? null : activeView;

  // Sync activeSquadId in useSquads when switching to a squad view
  useEffect(() => {
    if (effectiveSquadId) setActiveSquadId(effectiveSquadId);
  }, [effectiveSquadId]);

  useEffect(() => {
    loadData();
  }, [activeView]);

  // Reload squads after squad setup completes
  useEffect(() => {
    if (user?.id) {
      reloadSquads();
      // Check if user has a location set
      supabase.from("profiles").select("location").eq("id", user.id).single().then(({ data }) => {
        const loc = (data as any)?.location;
        if (loc) {
          setUserLocation(loc);
        } else {
          setShowLocationOnboarding(true);
        }
      });
    }
  }, [user?.id]);

  // Default to first squad view when squads load and no view selected
  useEffect(() => {
    if (!activeView && squads.length > 0) {
      setActiveView(squads[0].id);
    }
  }, [squads, activeView]);

  const loadData = async () => {
    setLoading(true);
    const rsvpQuery = effectiveSquadId
      ? supabase.from("rsvps").select("*").eq("squad_id", effectiveSquadId)
      : supabase.from("rsvps").select("*");

    // Also fetch current user's RSVPs across ALL squads
    const myRsvpQuery = user
      ? supabase.from("rsvps").select("*").eq("user_id", user.id).eq("going", true)
      : null;

    const [eventsRes, profilesRes, rsvpsRes, myRsvpsRes] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      rsvpQuery,
      myRsvpQuery ?? Promise.resolve({ data: [] }),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (myRsvpsRes.data) {
      setMyRsvps(
        (myRsvpsRes.data as any[])
          .filter((r: any) => r.squad_id)
          .map((r: any) => ({ event_id: r.event_id, squad_id: r.squad_id, going: r.going }))
      );
    }

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
    if (!user || !effectiveSquadId) return;
    const currentlyGoing = rsvps[eventId]?.[user.id] ?? false;
    const newGoing = !currentlyGoing;

    setRsvps((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [user.id]: newGoing },
    }));

    const { error } = await supabase
      .from("rsvps")
      .upsert(
        { event_id: eventId, user_id: user.id, going: newGoing, squad_id: effectiveSquadId } as any,
        { onConflict: "event_id,user_id,squad_id" }
      );

    if (error) {
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
      const { data, error } = await supabase.functions.invoke("scrape-events", {
        body: { location: userLocation || "San Jose, CA" },
      });
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

  // Filter profiles to only squad members
  const squadProfiles = profiles.filter((p) => squadMemberIds.includes(p.id));
  const currentProfile = profiles.find((p) => p.id === user?.id);

  const filteredEvents = weekendOnly ? events.filter((e) => isWeekend(e.date)) : events;

  // Build events with only squad member friends
  const eventsWithFriends = filteredEvents
    .map((event) => ({
      ...event,
      friends: squadProfiles.map((p) => ({
        name: p.display_name,
        emoji: p.emoji,
        going: rsvps[event.id]?.[p.id] ?? false,
        isCurrentUser: p.id === user?.id,
      })),
    }));

  // Popular section: has RSVPs, sorted by RSVP count descending
  const popularEvents = eventsWithFriends
    .filter((e) => e.friends.some((f) => f.going))
    .sort((a, b) => b.friends.filter((f) => f.going).length - a.friends.filter((f) => f.going).length);

  // More Events section: no RSVPs, sorted by date ascending
  const moreEvents = eventsWithFriends
    .filter((e) => !e.friends.some((f) => f.going))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Build "My Plans" - events user RSVP'd to across all squads
  const myRsvpEventIds = [...new Set(myRsvps.map((r) => r.event_id))];
  const myRsvpEvents = myRsvpEventIds
    .map((eventId) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return null;
      const rsvpSquadIds = myRsvps.filter((r) => r.event_id === eventId).map((r) => r.squad_id);
      const squadNames = rsvpSquadIds
        .map((sid) => squads.find((s) => s.id === sid)?.name)
        .filter(Boolean);
      return {
        ...event,
        squadTag: squadNames.join(", "),
        friends: [] as { name: string; emoji: string; going: boolean; isCurrentUser?: boolean }[],
      };
    })
    .filter(Boolean) as (DbEvent & { squadTag: string; friends: { name: string; emoji: string; going: boolean; isCurrentUser?: boolean }[] })[];


  return (
    <div className="flex min-h-screen w-full">
      {user && (
        <LocationOnboarding
          open={showLocationOnboarding}
          userId={user.id}
          onComplete={(loc) => {
            setUserLocation(loc);
            setShowLocationOnboarding(false);
          }}
        />
      )}
      <SquadSidebar
        squads={squads}
        activeView={activeView}
        onSelectView={setActiveView}
        onSignOut={signOut}
        userName={currentProfile?.display_name}
        userEmoji={currentProfile?.emoji}
        myPlansCount={myRsvpEvents.length}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <SidebarTrigger />
          <div className="flex-1" />
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-2 rounded-full bg-primary/80 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${scraping ? "animate-spin" : ""}`} />
            {scraping ? "Finding..." : "Find Events"}
          </button>
        </div>

        {/* Hero */}
        <div className="relative h-[320px] overflow-hidden">
          <img
            src={heroImage}
            alt="A diverse group of friends laughing together outdoors"
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
                  {isMyPlansView ? "My Plans" : (squads.find((s) => s.id === activeView)?.name || "Squad Events")}
                </span>
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                IRL Hangouts
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Squad bar - only in squad view */}
        {!isMyPlansView && (
          <div className="flex items-center justify-center gap-3 py-6">
            {squadProfiles.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg ring-2 ${p.id === user?.id ? "ring-primary" : "ring-primary/30"}`}>
                  {p.emoji}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{p.display_name}</span>
                {p.id === user?.id ? (
                  <PersonalityQuiz
                    currentType={p.personality_type}
                    onComplete={async (type) => {
                      await supabase.from("profiles").update({ personality_type: type }).eq("id", user.id);
                      setProfiles((prev) => prev.map((pr) => pr.id === user.id ? { ...pr, personality_type: type } : pr));
                    }}
                  />
                ) : p.personality_type ? (
                  <span className="mt-0.5 rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                    {p.personality_type.replace("The ", "")}
                  </span>
                ) : null}
              </div>
            ))}
            {squadProfiles.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No squad selected</p>
            )}
          </div>
        )}

        {/* Filter bar */}
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-4">
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
          {!isMyPlansView && <AddEventDialog onEventAdded={loadData} />}
        </div>

        {/* Events */}
        <div className="mx-auto w-full max-w-5xl px-4 pb-16">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading events...</div>
          ) : isMyPlansView ? (
            /* My Plans view */
            myRsvpEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <span className="text-5xl">📋</span>
                <p className="text-lg text-muted-foreground">No plans yet!</p>
                <p className="text-sm text-muted-foreground">RSVP to events from a squad to see them here</p>
              </div>
            ) : (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">📋 Events I'm Going To</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {myRsvpEvents.map((event, i) => (
                    <div key={`${event.id}-${event.squadTag}`} className="relative">
                      <span className="absolute top-3 right-3 z-10 rounded-full bg-primary/90 px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {event.squadTag}
                      </span>
                      <EventCard
                        {...event}
                        index={i}
                        onToggleRsvp={() => {}}
                        onClick={() => setSelectedEventId(event.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
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
            <>
              {popularEvents.length > 0 && (
                <div className="mb-10">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    🔥 Popular with the Squad
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {popularEvents.map((event, i) => (
                        <EventCard
                          key={event.id}
                          {...event}
                          index={i}
                          onToggleRsvp={() => toggleRsvp(event.id)}
                          onClick={() => setSelectedEventId(event.id)}
                        />
                      ))}
                  </div>
                </div>
              )}

              <div>
                {popularEvents.length > 0 && (
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    🗓️ More Events
                  </h2>
                )}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {moreEvents.map((event, i) => (
                      <EventCard
                        key={event.id}
                        {...event}
                        index={i}
                        onToggleRsvp={() => toggleRsvp(event.id)}
                        onClick={() => setSelectedEventId(event.id)}
                      />
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        <EventDetailDialog
          open={!!selectedEventId}
          onOpenChange={(open) => !open && setSelectedEventId(null)}
          event={selectedEventId ? [...eventsWithFriends, ...myRsvpEvents].find((e) => e.id === selectedEventId) ?? null : null}
          onToggleRsvp={() => selectedEventId && !isMyPlansView && toggleRsvp(selectedEventId)}
        />

      </div>
    </div>
  );
};

const Index = () => (
  <SidebarProvider>
    <DashboardContent />
  </SidebarProvider>
);

export default Index;
