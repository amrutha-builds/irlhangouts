import { useState } from "react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-girlfriends.jpg";
import EventCard from "@/components/EventCard";
import { Sparkles } from "lucide-react";

const friends = [
  { name: "Sophia", emoji: "👩🏻" },
  { name: "Mia", emoji: "👩🏽" },
  { name: "Chloe", emoji: "👩🏼" },
  { name: "Aisha", emoji: "👩🏾" },
  { name: "Yuki", emoji: "👩🏻‍🦰" },
];

const events = [
  {
    title: "Rooftop Wine & Paint Night",
    date: "Sat, Mar 15 · 7 PM",
    location: "The Skyline Lounge",
    category: "Creative",
    emoji: "🎨",
    going: [true, true, true, false, true],
  },
  {
    title: "Jazz Brunch at Le Petit",
    date: "Sun, Mar 23 · 11 AM",
    location: "Le Petit Bistro",
    category: "Food & Drinks",
    emoji: "🥂",
    going: [true, true, false, true, true],
  },
  {
    title: "Sunset Yoga in the Park",
    date: "Fri, Mar 28 · 5:30 PM",
    location: "Riverside Gardens",
    category: "Wellness",
    emoji: "🧘‍♀️",
    going: [false, true, true, true, false],
  },
  {
    title: "Comedy Night Out",
    date: "Sat, Apr 5 · 8 PM",
    location: "The Laughing Glass",
    category: "Entertainment",
    emoji: "😂",
    going: [true, false, true, true, true],
  },
  {
    title: "Spring Market & Coffee Walk",
    date: "Sun, Apr 13 · 10 AM",
    location: "Old Town Square",
    category: "Outdoors",
    emoji: "🌸",
    going: [true, true, true, true, true],
  },
  {
    title: "Spa & Self-Care Sunday",
    date: "Sun, Apr 20 · 1 PM",
    location: "Bloom Wellness Studio",
    category: "Wellness",
    emoji: "💆‍♀️",
    going: [true, true, true, true, false],
  },
];

const Index = () => {
  const [eventList, setEventList] = useState(events);

  const eventsWithFriends = eventList.map((e) => ({
    ...e,
    friends: friends.map((f, i) => ({ ...f, going: e.going[i] })),
  }));

  const toggleRsvp = (eventIndex: number, friendIndex: number) => {
    setEventList((prev) =>
      prev.map((e, i) =>
        i === eventIndex
          ? { ...e, going: e.going.map((g, j) => (j === friendIndex ? !g : g)) }
          : e
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
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
              Upcoming events for our crew — let's make memories ✨
            </p>
          </motion.div>
        </div>
      </div>

      {/* Squad bar */}
      <div className="flex items-center justify-center gap-3 py-6">
        {friends.map((f) => (
          <div key={f.name} className="flex flex-col items-center gap-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg ring-2 ring-primary/30">
              {f.emoji}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{f.name}</span>
          </div>
        ))}
      </div>

      {/* Events grid */}
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventsWithFriends.map((event, i) => (
            <EventCard key={event.title} {...event} index={i} onToggleRsvp={(friendIndex) => toggleRsvp(i, friendIndex)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
