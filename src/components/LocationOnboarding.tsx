import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LocationOnboardingProps {
  open: boolean;
  userId: string;
  onComplete: (location: string) => void;
}

const SUGGESTED_LOCATIONS = [
  "San Jose, CA",
  "San Francisco, CA",
  "Los Angeles, CA",
  "New York, NY",
  "Chicago, IL",
  "Austin, TX",
  "Seattle, WA",
  "Miami, FL",
];

const LocationOnboarding = ({ open, userId, onComplete }: LocationOnboardingProps) => {
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (loc: string) => {
    if (!loc.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ location: loc.trim() } as any)
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to save location", variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "📍 Location set!", description: `Finding events near ${loc.trim()}` });
    onComplete(loc.trim());
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Where are you based?
          </DialogTitle>
          <DialogDescription>
            We'll find weekend events within 50 miles of your location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave(location)}
              className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => handleSave(location)}
              disabled={!location.trim() || saving}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "..." : "Go"}
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_LOCATIONS.map((loc) => (
                <motion.button
                  key={loc}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSave(loc)}
                  disabled={saving}
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {loc}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationOnboarding;
