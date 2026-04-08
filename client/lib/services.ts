/**
 * lib/services.ts — static service catalogue shared by the Services component
 * and the booking/payment modals.
 */

export type ServiceCategory = "Workouts" | "Nutrition" | "Wellness" | "Sculpting";

export interface Service {
  id: string;
  title: string;
  desc: string;
  /** relative path to /public/services/ icon (optional) */
  icon?: string;
  duration: string;
  price: string;
  /** Amount in cents for Stripe checkout (use the per-session rate) */
  cents: number;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Workouts",
  "Nutrition",
  "Wellness",
  "Sculpting",
];

export const SERVICES: Record<ServiceCategory, Service[]> = {
  Workouts: [
    {
      id: "personal-training",
      title: "Personal Training",
      desc: "One-on-one customized workout sessions built around your fitness level, goals, and schedule. Progressive programming with full coach accountability.",
      icon: "/services/personal-training.svg",
      duration: "3× / wk · 60 min each",
      price: "$90 / week · $350 / month",
      cents: 9000,
    },
    {
      id: "virtual-training",
      title: "Virtual Training",
      desc: "All the intensity of a personal session delivered remotely. Live video coaching, form correction in real time, and weekly program updates.",
      icon: "/services/personal-training.svg",
      duration: "50 min / session",
      price: "$40 / session",
      cents: 4000,
    },
    {
      id: "group-kamp",
      title: "Group Session — KAMP",
      desc: "High-energy group training in a motivating camp-style format. HIIT circuits, strength complexes, and community-driven accountability.",
      icon: "/services/personal-training.svg",
      duration: "Mon–Fri · 6–10 AM & 6:30–10:30 PM",
      price: "$75 / person",
      cents: 7500,
    },
    {
      id: "athletic-performance",
      title: "Athletic Performance",
      desc: "Sport-specific conditioning designed to increase speed, power, agility, and endurance. Perfect for athletes looking for a competitive edge.",
      icon: "/services/personal-training.svg",
      duration: "75 min / session",
      price: "$75 / session",
      cents: 7500,
    },
  ],
  Nutrition: [
    {
      id: "meal-planning",
      title: "Custom Meal Planning",
      desc: "Personalised weekly meal plans aligned to your calorie and macro targets. Includes grocery lists, meal-prep tips, and recipe ideas.",
      icon: "/services/meal-planning.svg",
      duration: "Ongoing · updated weekly",
      price: "$35 / session",
      cents: 3500,
    },
    {
      id: "nutrition-coaching",
      title: "Nutrition Coaching",
      desc: "Deep-dive into your eating habits, triggers, and goals. Monthly check-ins, habit tracking, and science-backed guidance to fuel sustainable change.",
      icon: "/services/meal-planning.svg",
      duration: "Monthly coaching package",
      price: "$120 / month",
      cents: 12000,
    },
    {
      id: "supplement-guidance",
      title: "Supplement Guidance",
      desc: "Evidence-based supplement protocol built around your lifestyle. Cut through the noise and invest only in what actually works for your goals.",
      icon: "/services/meal-planning.svg",
      duration: "45 min consultation",
      price: "$25 / session",
      cents: 2500,
    },
    {
      id: "macro-tracking",
      title: "Macro Tracking Setup",
      desc: "Learn to track macros confidently. Covers calorie targets, flexible dieting principles, and how to adjust on the fly without obsessing over food.",
      icon: "/services/meal-planning.svg",
      duration: "Monthly support",
      price: "$50 / month",
      cents: 5000,
    },
  ],
  Wellness: [
    {
      id: "mindfulness",
      title: "Mindfulness & Meditation",
      desc: "Guided sessions to quiet mental noise, reduce cortisol, and sharpen focus. Practical tools for stress management woven directly into your daily routine.",
      icon: "/services/mindfulness.svg",
      duration: "45 min / session",
      price: "$30 / session",
      cents: 3000,
    },
    {
      id: "mobility-recovery",
      title: "Mobility & Recovery",
      desc: "Strategic stretching, foam rolling, and breath-work protocols to reduce soreness, prevent injury, and keep you training consistently over the long term.",
      icon: "/services/mindfulness.svg",
      duration: "60 min / session",
      price: "$35 / session",
      cents: 3500,
    },
    {
      id: "lifestyle-coaching",
      title: "Lifestyle Coaching",
      desc: "Holistic approach covering sleep, stress, hydration, and daily habits. Bridge the gap between gym progress and whole-life wellness.",
      icon: "/services/mindfulness.svg",
      duration: "Monthly programme",
      price: "$100 / month",
      cents: 10000,
    },
    {
      id: "stress-management",
      title: "Stress Management",
      desc: "Evidence-based techniques to manage work, life, and training stress. Includes nervous-system regulation exercises and recovery planning.",
      icon: "/services/mindfulness.svg",
      duration: "50 min / session",
      price: "$40 / session",
      cents: 4000,
    },
  ],
  Sculpting: [
    {
      id: "body-sculpting",
      title: "Body Sculpting Programme",
      desc: "12-week transformation programme combining resistance training, targeted conditioning, and nutrition to reshape and define your physique.",
      icon: "/services/body-sculpting.svg",
      duration: "12-week programme",
      price: "$400 / programme",
      cents: 40000,
    },
    {
      id: "hiit-cardio",
      title: "HIIT & Cardio Blast",
      desc: "Calorie-torching high-intensity intervals designed to accelerate fat loss while preserving hard-earned muscle. Adaptable to any fitness level.",
      icon: "/services/body-sculpting.svg",
      duration: "45 min / session",
      price: "$25 / session",
      cents: 2500,
    },
    {
      id: "strength-training",
      title: "Strength & Toning",
      desc: "Progressive resistance training programme targeting muscle definition and functional strength. Builds the lean, athletic physique you're after.",
      icon: "/services/body-sculpting.svg",
      duration: "60 min / session",
      price: "$55 / session",
      cents: 5500,
    },
    {
      id: "core-abs",
      title: "Core & Abs Focus",
      desc: "Dedicated core strengthening and abdominal sculpting sessions. Pillar strength work + targeted ab circuits for a tight, stable midsection.",
      icon: "/services/body-sculpting.svg",
      duration: "45 min / session",
      price: "$35 / session",
      cents: 3500,
    },
  ],
};
