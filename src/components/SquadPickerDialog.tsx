import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users } from "lucide-react";

interface SquadOption {
  id: string;
  name: string;
}

interface SquadPickerDialogProps {
  open: boolean;
  squads: SquadOption[];
  onSelect: (squadId: string) => void;
  onClose: () => void;
}

const SquadPickerDialog = ({ open, squads, onSelect, onClose }: SquadPickerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Choose a Squad
          </DialogTitle>
          <DialogDescription>
            Multiple squads share this invite code. Pick the one you'd like to join.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          {squads.map((squad) => (
            <button
              key={squad.id}
              onClick={() => onSelect(squad.id)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left font-medium text-card-foreground transition-all hover:border-primary hover:bg-accent"
            >
              {squad.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SquadPickerDialog;
