import { motion } from "framer-motion";
import { MapPin, Calendar, Users, ExternalLink } from "lucide-react";

interface Friend {
  name: string;
  emoji: string;
  going: boolean;
  isCurrentUser?: boolean;
}

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  category: string;
  emoji: string;
  friends: Friend[];
  index: number;
  source_url?: string | null;
  description?: string | null;
  onToggleRsvp?: () => void;
  onClick?: () => void;
}

const EventCard = ({ title, date, location, category, emoji, friends, index, source_url, onToggleRsvp, onClick }: EventCardProps) => {
  const goingCount = friends.filter(f => f.going).length;
  const currentUser = friends.find(f => f.isCurrentUser);
  const iAmGoing = currentUser?.going ?? false;

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
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{location}</span>
      </div>
      {source_url && (
        <a
          href={source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View / Get Tickets
        </a>
      )}
      {!source_url && <div className="mb-4" />}

      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{goingCount} going</span>
          </div>
          <div className="flex -space-x-1">
            {friends.filter(f => f.going).map((f) => (
              <span key={f.name} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs ring-1 ring-primary">
                {f.emoji}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleRsvp}
          className={`w-full rounded-lg py-2 text-sm font-medium transition-all ${
            iAmGoing
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {iAmGoing ? "I'm Going ✓" : "Count Me In"}
        </button>
      </div>
    </motion.div>
  );
};

export default EventCard;
