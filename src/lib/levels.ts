export type Level = "L1" | "L2" | "L3" | "L4" | "L5";

export const LEVELS: Array<{
  id: Level;
  name: string;
  tagline: string;
  pitch: string;
  pickIf: string[];
  features: string[];
  goal: string;
  emoji: string;
  hue: string;
}> = [
  {
    id: "L1",
    name: "Beginner Reader",
    tagline: "I can sound out words but don’t understand well.",
    pitch: "High support mode — full translations, slow audio, friendly pacing.",
    pickIf: ["You’re new to Korean reading", "You rely on translation", "You need slower pacing"],
    features: ["Full translations visible", "Heavy word highlighting", "Slow native audio", "Frequent repetition"],
    goal: "Build reading confidence and recognition.",
    emoji: "🌱",
    hue: "from-rose-100 to-pink-200",
  },
  {
    id: "L2",
    name: "Familiar Conversation",
    tagline: "I follow conversations on familiar topics.",
    pitch: "Balanced support — translation optional, daily-life focus.",
    pickIf: ["You understand familiar content", "You want moderate support", "You’re growing practical vocab"],
    features: ["Toggleable translation", "Moderate highlighting", "Daily-life vocabulary"],
    goal: "Improve independent comprehension.",
    emoji: "☕",
    hue: "from-pink-100 to-rose-200",
  },
  {
    id: "L3",
    name: "Intermediate Reader",
    tagline: "I understand most content but miss some nuance.",
    pitch: "Nuance-building mode — grammar, tone, expression breakdowns.",
    pickIf: ["You understand most content", "Nuance still feels difficult", "You want deeper understanding"],
    features: ["Reduced translation", "Grammar nuance support", "Tone & expression notes"],
    goal: "Develop stronger contextual reading.",
    emoji: "🎬",
    hue: "from-pink-200 to-rose-300",
  },
  {
    id: "L4",
    name: "Advanced Reader",
    tagline: "I read complex topics but rare words slow me down.",
    pitch: "Advanced fluency mode — academic & rare-word assistance.",
    pickIf: ["You read confidently", "Rare vocabulary slows you", "You want efficiency"],
    features: ["Minimal translation", "Academic vocabulary", "Rare-word assistance"],
    goal: "Increase fluency and reading speed.",
    emoji: "💼",
    hue: "from-rose-200 to-pink-300",
  },
  {
    id: "L5",
    name: "Near-Native Reader",
    tagline: "I read at near-native level.",
    pitch: "Refinement mode — idioms, literary style, news language.",
    pickIf: ["You rarely need translation", "You enjoy authentic content", "You want mastery"],
    features: ["Native reading environment", "Cultural nuance support", "Idioms & literary style"],
    goal: "Master sophisticated Korean.",
    emoji: "🪷",
    hue: "from-pink-300 to-rose-400",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  daily_life: "Daily Life",
  student_life: "Student Life",
  kdrama: "K-drama",
  career: "Career",
  topik: "TOPIK",
  culture: "Culture",
};
