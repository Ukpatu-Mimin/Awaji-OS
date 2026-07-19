import { CarouselFeature, ClassSubject, DeadlineTask } from "./types";

export const CAROUSEL_FEATURES: CarouselFeature[] = [
  {
    id: "class",
    title: "Class Hub & Desk",
    tagline: "Your digital academic headquarters",
    description: "Organize your lectures, group syllabus schedules, and digital note catalogs. Keep instructors, locations, and real-time calendars synchronized in one beautifully crafted desk layout.",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    iconName: "BookOpen",
    benefits: [
      "Dynamic course card designer",
      "Interactive time blocks",
      "Note archiving integrated with courses"
    ]
  },
  {
    id: "deadline",
    title: "Dynamic Deadline Board",
    tagline: "Never lose track of a deliverable",
    description: "Manage complex assignment deadlines, exam calendars, and project milestones. Filter tasks by urgency, priority tiers, or course affiliation, with visual progress milestones.",
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80",
    iconName: "CalendarClock",
    benefits: [
      "Prioritization Matrix (Low, Medium, High)",
      "Interactive done-state indicators",
      "Dynamic days-remaining counter"
    ]
  },
  {
    id: "study",
    title: "Immersive Focus Arena",
    tagline: "Unleash elite cognitive flow state",
    description: "Pair custom Pomodoro cycles with therapeutic soundscapes. Harness visual timer systems, focused task checklists, and session progress trackers designed for academic work.",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    iconName: "Hourglass",
    benefits: [
      "Aesthetic analog progress wheels",
      "Curated ambient white noise generator",
      "Post-session focus metric analysis"
    ]
  },
  {
    id: "guardian",
    title: "Awaji AI Companion",
    tagline: "Your hyper-intelligent 24/7 tutor",
    description: "Converse with our customized AI mentor built on Gemini. Solve calculus problems, draft essay outlines, explain historical paradigms, or generate tailored mock flashcards instantly.",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    iconName: "Sparkles",
    benefits: [
      "Instant, clear academic explanations",
      "Structured flashcard generator",
      "Creative writing outline co-pilot"
    ]
  },
  {
    id: "mood",
    title: "Vibe & Mind Check",
    tagline: "Nurturing mental wellness with academic rigors",
    description: "Track your study energy levels, anxiety markers, and sleep indicators over time. Instantly unlock relaxing breathing sessions when exam pressure peaks.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    iconName: "Heart",
    benefits: [
      "Intuitive mood slider logs",
      "Rhythmic Zen respiration guidelines",
      "Correlation insights for stress triggers"
    ]
  },
  {
    id: "streak",
    title: "Daily Streak Forge",
    tagline: "Consistency outperforms raw talent",
    description: "Transform daily studies into an engaging habit quest. Cultivate consecutive study streaks, rank up from 'Novice Scribe' to 'Sage Architect', and win customizable aesthetic trophies.",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    iconName: "Flame",
    benefits: [
      "Interactive habit checkbox rings",
      "Creative milestone tier rewards",
      "Visual statistics and completion metrics"
    ]
  }
];

export const INITIAL_CLASSES: ClassSubject[] = [];

export const INITIAL_DEADLINES: DeadlineTask[] = [];
