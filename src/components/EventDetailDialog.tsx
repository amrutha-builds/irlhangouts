import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Calendar, Users, ExternalLink } from "lucide-react";

interface Friend {
  name: string;
  emoji: string;
  going: boolean;
  isCurrentUser?: boolean;
}

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    title: string;
    date: string;
    location: string;
    category: string;
    emoji: string;
    description?: string | null;
    source_url?: string | null;
    friends: Friend[];
  } | null;
  onToggleRsvp?: () => void;
}

const EventDetailDialog = ({ open, onOpenChange, event, onToggleRsvp }: EventDetailDialogProps) => {
  if (!event) return null;

  const goingCount = event.friends.filter((f) => f.going).length;
  const currentUser = event.friends.find((f) => f.isCurrentUser);
  const iAmGoing = currentUser?.going ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{event.emoji}</span>
            <div>
              <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
                {event.title}
              </DialogTitle>
              <span className="mt-1 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
                {event.category}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Date & Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">{event.description}</p>
            </div>
          )}

          {/* Source URL */}
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4" />
              View Event / Get Tickets
            </a>
          )}

          {/* Who's going */}
          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{goingCount} going</span>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {event.friends
                .filter((f) => f.going)
                .map((f) => (
                  <div key={f.name} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                    <span className="text-sm">{f.emoji}</span>
                    <span className="text-xs font-medium text-foreground">{f.name}</span>
                  </div>
                ))}
              {goingCount === 0 && (
                <span className="text-xs text-muted-foreground">No one yet — be the first!</span>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleRsvp}
              className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
                iAmGoing
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {iAmGoing ? "I'm Going ✓" : "Count Me In"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
