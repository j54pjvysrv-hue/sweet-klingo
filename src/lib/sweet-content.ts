import type { Passage } from "@/components/candy-reader";

export const cafePassage: Passage = {
  title: "주말 카페 데이트",
  level: "Beginner · A2",
  topic: "Daily life · Cafés",
  englishHint: "A weekend café date — tap any underlined word for an instant breakdown.",
  lines: [
    [
      { text: "오늘은", info: { romanization: "oneul-eun", meaning: "today (topic)", pos: "noun + particle", grammar: "은/는 marks the topic of the sentence." } },
      { text: " 친구하고 ", info: { romanization: "chingu-hago", meaning: "with a friend", pos: "noun + particle", grammar: "하고 is a casual ‘and / with’ particle." } },
      { text: "카페에 ", info: { romanization: "kape-e", meaning: "to the café", pos: "noun + particle", grammar: "에 marks a destination or location." } },
      { text: "갔어요", info: { romanization: "gasseoyo", meaning: "went (polite past)", pos: "verb", grammar: "가다 → 갔어요 (past tense, polite -아/어요)." } },
      { text: "." },
    ],
    [
      { text: "저는 ", info: { romanization: "jeo-neun", meaning: "I (humble, topic)", pos: "pronoun + particle", grammar: "저 is humble ‘I’; pair with 은/는 for the topic." } },
      { text: "달콤한 ", info: { romanization: "dalkomhan", meaning: "sweet", pos: "descriptive verb (adj.)", grammar: "달콤하다 → 달콤한 (modifies a noun)." } },
      { text: "딸기 케이크", info: { romanization: "ttalgi keikeu", meaning: "strawberry cake", pos: "noun phrase" } },
      { text: "를 ", info: { romanization: "-reul", meaning: "object marker", pos: "particle", grammar: "을/를 marks the direct object." } },
      { text: "먹었어요", info: { romanization: "meogeosseoyo", meaning: "ate (polite past)", pos: "verb", grammar: "먹다 → 먹었어요." } },
      { text: "." },
    ],
    [
      { text: "정말 ", info: { romanization: "jeongmal", meaning: "really, truly", pos: "adverb" } },
      { text: "맛있었어요", info: { romanization: "masisseosseoyo", meaning: "it was delicious", pos: "verb", grammar: "맛있다 → 맛있었어요. Past polite form.", note: "맛있다 literally means ‘there is taste’ — a fun Korean way of saying ‘tasty.’" } },
      { text: "!" },
    ],
    [
      { text: "다음에 ", info: { romanization: "daeume", meaning: "next time", pos: "adverbial phrase" } },
      { text: "또 ", info: { romanization: "tto", meaning: "again", pos: "adverb" } },
      { text: "가고 싶어요", info: { romanization: "gago sipeoyo", meaning: "I want to go", pos: "verb + ending", grammar: "-고 싶다 expresses ‘want to (do)’. Attach to a verb stem.", note: "Use 가고 싶어요 in polite settings; with friends say 가고 싶어." } },
      { text: "." },
    ],
  ],
};

export type CandyCard = {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "TOPIK II";
  topic: string;
  emoji: string;
  blurb: string;
};

export const candyLibrary: CandyCard[] = [
  { id: "cafe", title: "Ordering at a Seoul café", level: "Beginner", topic: "Daily life", emoji: "☕", blurb: "Polite ordering phrases, café vocab, and 주세요 patterns." },
  { id: "kdrama", title: "K-drama: confession scene", level: "Intermediate", topic: "Pop culture", emoji: "🎬", blurb: "Dialogue from a rooftop confession, with banmal and emotional verbs." },
  { id: "office", title: "Slack message to your team lead", level: "Intermediate", topic: "Workplace", emoji: "💼", blurb: "Formal endings, honorifics, and corporate Korean nuances." },
  { id: "topik2", title: "TOPIK II reading passage", level: "TOPIK II", topic: "Exam prep", emoji: "📚", blurb: "Dense paragraph with -(으)며, -았/었던, and exam-style questions." },
  { id: "slang", title: "Internet slang of 2025", level: "Advanced", topic: "Pop culture", emoji: "📱", blurb: "갓생, 어쩔티비, 킹받네 — how young Koreans actually text." },
  { id: "travel", title: "Lost in Busan", level: "Beginner", topic: "Travel", emoji: "🧳", blurb: "Asking for directions and using transit vocabulary." },
  { id: "hangul", title: "Hangul Foundation · Day 1", level: "Beginner", topic: "Foundations", emoji: "🌱", blurb: "Vowels ㅏ ㅑ ㅓ ㅕ with native audio and stroke order." },
  { id: "honor", title: "Grammar focus: honorific -(으)시-", level: "Intermediate", topic: "Grammar", emoji: "🪷", blurb: "When to elevate the subject, and what changes in the verb." },
  { id: "kpop", title: "K-pop lyric breakdown", level: "Intermediate", topic: "Pop culture", emoji: "🎤", blurb: "Decode metaphor, slang, and grammar in a recent hit." },
];

export const categories = [
  "All",
  "Daily life",
  "Workplace",
  "Pop culture",
  "Travel",
  "Grammar",
  "Exam prep",
  "Foundations",
] as const;
