import { motion } from "framer-motion";
import { MapPin, Calendar, Users } from "lucide-react";

interface Friend {
  name: string;
  emoji: string;
  going: boolean;
}

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  category: string;
  emoji: string;
  friends: Friend[];
  index: number;
  onToggleRsvp?: (friendIndex: number) => void;
}

const EventCard = ({ title, date, location, category, emoji, friends, index, onToggleRsvp }: EventCardProps) => {
  const goingCount = friends.filter(f => f.going).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group rounded-2xl bg-card p-6 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="text-4xl">{emoji}</span>
        <span className="rounded-full bg-accent px-3 py-1 font-body text-xs font-medium text-accent-foreground">
          {category}
        </span>
      </div>

      <h3 className="mb-2 text-xl font-semibold text-card-foreground" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>

      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{date}</span>
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{location}</span>
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{goingCount}/5 going</span>
        </div>
        <div className="flex gap-1.5">
          {friends.map((friend, fi) => (
            <button
              key={friend.name}
              type="button"
              onClick={() => onToggleRsvp?.(fi)}
              title={`${friend.name} — ${friend.going ? "Going ✓" : "Not yet"} (click to toggle)`}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm transition-all hover:scale-110 ${
                friend.going
                  ? "bg-primary/15 ring-2 ring-primary"
                  : "bg-muted opacity-50"
              }`}
            >
              {friend.emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
