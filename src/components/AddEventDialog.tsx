import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "Nightlife & Dining", emoji: "🍷" },
  { value: "Wellness & Outdoors", emoji: "🧘" },
  { value: "Arts & Culture", emoji: "🎨" },
  { value: "Music & Concerts", emoji: "🎶" },
  { value: "Food & Drink", emoji: "🍽️" },
  { value: "Social", emoji: "💃" },
  { value: "Other", emoji: "🎉" },
];

interface AddEventDialogProps {
  onEventAdded: () => void;
  squadId?: string | null;
}

const AddEventDialog = ({ onEventAdded, squadId }: AddEventDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const selectedEmoji = CATEGORIES.find((c) => c.value === category)?.emoji ?? "🎉";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !date.trim() || !location.trim() || !category) return;

    setSubmitting(true);
    const { error } = await supabase.from("events").insert({
      title: title.trim().slice(0, 200),
      date: date.trim().slice(0, 100),
      location: location.trim().slice(0, 200),
      category,
      emoji: selectedEmoji,
      created_by: user.id,
      squad_id: squadId || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: "Failed to add event", variant: "destructive" });
    } else {
      toast({ title: "🎉 Event added!", description: `"${title.trim()}" is on the agenda.` });
      setTitle("");
      setDate("");
      setLocation("");
      setCategory("");
      setOpen(false);
      onEventAdded();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            Suggest an Event
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Event Name</Label>
            <Input
              id="title"
              placeholder="Rooftop drinks at The View"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="The View Lounge, SF"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !category}>
            {submitting ? "Adding..." : `${selectedEmoji} Add to Agenda`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
