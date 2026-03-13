import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const QUESTIONS = [
  {
    question: "It's Saturday night — what's your vibe?",
    options: [
      { label: "🍷 Chill bar with deep convos", types: ["The Mom Friend", "The Cultured One"] },
      { label: "💃 Dancing till 2am", types: ["The Wild Card", "The Hype Person"] },
      { label: "🎨 Gallery opening or live show", types: ["The Cultured One", "The Planner"] },
      { label: "🏕️ Already left town for a road trip", types: ["The Wild Card", "The Adventure Seeker"] },
    ],
  },
  {
    question: "Your friend group chat is planning — you're the one who...",
    options: [
      { label: "📋 Made a spreadsheet already", types: ["The Planner", "The Mom Friend"] },
      { label: "🔥 Sends chaotic energy & memes", types: ["The Wild Card", "The Hype Person"] },
      { label: "🎯 Finds the coolest hidden gem spot", types: ["The Cultured One", "The Adventure Seeker"] },
      { label: "💖 Makes sure everyone feels included", types: ["The Mom Friend", "The Hype Person"] },
    ],
  },
  {
    question: "Pick your ideal SF Bay Area day:",
    options: [
      { label: "🌉 Brunch in Hayes Valley → museum → sunset at Baker Beach", types: ["The Cultured One", "The Planner"] },
      { label: "🎤 Karaoke in Japantown → late-night ramen", types: ["The Wild Card", "The Hype Queen"] },
      { label: "🥾 Hike Muir Woods → farmers market → home cooking", types: ["The Adventure Seeker", "The Mom Friend"] },
      { label: "🍸 Rooftop cocktails → underground comedy show", types: ["The Wild Card", "The Cultured One"] },
    ],
  },
  {
    question: "What do your friends always thank you for?",
    options: [
      { label: "Keeping everyone safe & fed", types: ["The Mom Friend", "The Planner"] },
      { label: "Making boring things fun", types: ["The Hype Queen", "The Wild Card"] },
      { label: "Discovering the best new spots", types: ["The Cultured One", "The Adventure Seeker"] },
      { label: "Always saying YES to plans", types: ["The Wild Card", "The Adventure Seeker"] },
    ],
  },
  {
    question: "Pick a weekend event that excites you most:",
    options: [
      { label: "🎵 Music festival in Golden Gate Park", types: ["The Hype Queen", "The Wild Card"] },
      { label: "🧘 Wellness retreat & sound bath", types: ["The Mom Friend", "The Cultured One"] },
      { label: "🍜 Night market food crawl", types: ["The Adventure Seeker", "The Hype Queen"] },
      { label: "🎭 Theater premiere + after-party", types: ["The Cultured One", "The Planner"] },
    ],
  },
];

const RESULTS: Record<string, { emoji: string; tagline: string; color: string }> = {
  "The Mom Friend": { emoji: "🫶", tagline: "Heart of the crew", color: "hsl(var(--accent))" },
  "The Wild Card": { emoji: "⚡", tagline: "Never a dull moment", color: "hsl(var(--primary))" },
  "The Planner": { emoji: "📋", tagline: "Always 3 steps ahead", color: "hsl(var(--secondary))" },
  "The Hype Queen": { emoji: "👑", tagline: "Chief vibes officer", color: "hsl(var(--primary))" },
  "The Cultured One": { emoji: "🎭", tagline: "Taste level: immaculate", color: "hsl(var(--accent))" },
  "The Adventure Seeker": { emoji: "🌍", tagline: "Down for anything", color: "hsl(var(--primary))" },
};

interface PersonalityQuizProps {
  currentType: string | null;
  onComplete: (type: string) => void;
}

const PersonalityQuiz = ({ currentType, onComplete }: PersonalityQuizProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Tally
      const tally: Record<string, number> = {};
      newAnswers.forEach((ai, qi) => {
        const types = QUESTIONS[qi].options[ai].types;
        types.forEach((t) => (tally[t] = (tally[t] || 0) + 1));
      });
      const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
      onComplete(winner);
    }
  };

  const resultData = result ? RESULTS[result] : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <button className="group flex flex-col items-center gap-1 transition-transform hover:scale-105">
          {currentType ? (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm">
                {RESULTS[currentType]?.emoji ?? "✨"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">{currentType.replace("The ", "")}</span>
            </>
          ) : (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-primary/40 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
              <span className="text-[10px] font-medium text-primary">Take Quiz</span>
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            {result ? "Your Result ✨" : "What's Your Vibe?"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {step + 1} / {QUESTIONS.length}
                </p>
                <div className="flex gap-1">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        i <= step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {QUESTIONS[step].question}
              </p>

              <div className="space-y-2">
                {QUESTIONS[step].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-card-foreground transition-all hover:border-primary hover:bg-accent"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <span className="text-6xl">{resultData?.emoji}</span>
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {result}
              </h2>
              <p className="text-muted-foreground">{resultData?.tagline}</p>
              <Button onClick={() => setOpen(false)} className="mt-2 rounded-full">
                Love it! 💕
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalityQuiz;
