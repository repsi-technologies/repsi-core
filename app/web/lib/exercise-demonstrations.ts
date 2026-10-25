/**
 * Open-source exercise demonstrations library.
 * Media hosted via jsDelivr CDN from open fitness repositories (ExerciseGymGifsDB).
 * Provides free, unmetered looping demonstration GIFs with proper human form,
 * optimized WebP thumbnail previews, and full attribution.
 */

export interface ExerciseDemonstration {
  id: string;
  name: string;
  aliases?: string[];
  muscle: string;
  category: "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "cardio" | "full_body" | "mobility";
  equipment: string;
  gifUrl: string;
  thumbUrl?: string;
  instructions?: string[];
  attribution?: string;
}

export const OPEN_SOURCE_ATTRIBUTION =
  "Exercise demonstration animations courtesy of open-source fitness repositories (ExerciseGymGifsDB, jsDelivr CDN). Free and unmetered.";

/** Curated demonstration library covering standard gym movements */
export const EXERCISE_DEMONSTRATIONS: ExerciseDemonstration[] = [
  // CHEST
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    aliases: ["Bench Press", "Flat Barbell Bench Press"],
    muscle: "chest",
    category: "chest",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.thumb.webp",
  },
  {
    id: "dumbbell-incline-bench-press",
    name: "Incline Dumbbell Press",
    aliases: ["Incline Bench Press", "Dumbbell Incline Press", "Incline Dumbbell Bench Press"],
    muscle: "chest",
    category: "chest",
    equipment: "dumbbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-incline-bench-press.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-incline-bench-press.thumb.webp",
  },
  {
    id: "push-up",
    name: "Push-Up",
    aliases: ["Push Up", "Standard Push-Up", "Press-Up"],
    muscle: "chest",
    category: "chest",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/push-up.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/push-up.thumb.webp",
  },
  {
    id: "cable-middle-fly",
    name: "Cable Chest Fly",
    aliases: ["Cable Fly", "Cable Crossover", "Standing Cable Fly"],
    muscle: "chest",
    category: "chest",
    equipment: "cable",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/cable-middle-fly.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/cable-middle-fly.thumb.webp",
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    aliases: ["Flat Dumbbell Press"],
    muscle: "chest",
    category: "chest",
    equipment: "dumbbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-bench-press.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-bench-press.thumb.webp",
  },

  // LEGS / LOWER BODY
  {
    id: "barbell-full-squat",
    name: "Barbell Back Squat",
    aliases: ["Barbell Squat", "Back Squat", "Squat"],
    muscle: "quadriceps",
    category: "legs",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-full-squat.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-full-squat.thumb.webp",
  },
  {
    id: "kettlebell-goblet-squat",
    name: "Goblet Squat",
    aliases: ["Dumbbell Goblet Squat", "Kettlebell Squat"],
    muscle: "quadriceps",
    category: "legs",
    equipment: "kettlebell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/kettlebell-goblet-squat.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/kettlebell-goblet-squat.thumb.webp",
  },
  {
    id: "barbell-romanian-deadlift",
    name: "Romanian Deadlift",
    aliases: ["RDL", "Barbell RDL", "Stiff Leg Deadlift"],
    muscle: "hamstrings",
    category: "legs",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-romanian-deadlift.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-romanian-deadlift.thumb.webp",
  },
  {
    id: "barbell-deadlift",
    name: "Conventional Deadlift",
    aliases: ["Deadlift", "Barbell Deadlift"],
    muscle: "glutes",
    category: "legs",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-deadlift.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-deadlift.thumb.webp",
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    aliases: ["Lunges", "Dumbbell Lunge", "Forward Lunge"],
    muscle: "quadriceps",
    category: "legs",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/walking-lunge.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/walking-lunge.thumb.webp",
  },
  {
    id: "sled-45-leg-press",
    name: "Leg Press",
    aliases: ["45 Degree Leg Press", "Machine Leg Press"],
    muscle: "quadriceps",
    category: "legs",
    equipment: "machine",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/sled-45-leg-press.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/sled-45-leg-press.thumb.webp",
  },
  {
    id: "barbell-standing-calf-raise",
    name: "Standing Calf Raise",
    aliases: ["Calf Raise", "Calf Raises", "Standing Calf Raises"],
    muscle: "calves",
    category: "legs",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/calves/barbell-standing-calf-raise.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/calves/barbell-standing-calf-raise.thumb.webp",
  },
  {
    id: "barbell-glute-bridge-two-legs-on-bench-male",
    name: "Hip Thrust",
    aliases: ["Barbell Hip Thrust", "Glute Bridge", "Bench Hip Thrust"],
    muscle: "glutes",
    category: "legs",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/barbell-glute-bridge-two-legs-on-bench-male.thumb.webp",
  },

  // BACK / PULL
  {
    id: "pull-up",
    name: "Pull-Up",
    aliases: ["Pull Up", "Chin-Up", "Pullups"],
    muscle: "lats",
    category: "back",
    equipment: "pull_up_bar",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/pull-up.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/pull-up.thumb.webp",
  },
  {
    id: "cable-lat-pulldown-full-range-of-motion",
    name: "Lat Pulldown",
    aliases: ["Cable Lat Pulldown", "Pulldown", "Wide Grip Lat Pulldown"],
    muscle: "lats",
    category: "back",
    equipment: "cable",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/cable-lat-pulldown-full-range-of-motion.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/cable-lat-pulldown-full-range-of-motion.thumb.webp",
  },
  {
    id: "barbell-bent-over-row",
    name: "Bent-Over Barbell Row",
    aliases: ["Barbell Row", "Bent Over Row", "Barbell Bent Over Row"],
    muscle: "upper_back",
    category: "back",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/barbell-bent-over-row.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/barbell-bent-over-row.thumb.webp",
  },
  {
    id: "cable-low-seated-row",
    name: "Seated Cable Row",
    aliases: ["Cable Row", "Seated Row", "Low Cable Row"],
    muscle: "upper_back",
    category: "back",
    equipment: "cable",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/cable-low-seated-row.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/cable-low-seated-row.thumb.webp",
  },
  {
    id: "dumbbell-one-arm-bent-over-row",
    name: "One-Arm Dumbbell Row",
    aliases: ["Single Arm Dumbbell Row", "Dumbbell Row", "One Arm Row"],
    muscle: "upper_back",
    category: "back",
    equipment: "dumbbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/dumbbell-one-arm-bent-over-row.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/dumbbell-one-arm-bent-over-row.thumb.webp",
  },

  // SHOULDERS
  {
    id: "barbell-seated-overhead-press",
    name: "Overhead Press",
    aliases: ["Military Press", "Shoulder Press", "Barbell Shoulder Press", "Strict Press"],
    muscle: "delts",
    category: "shoulders",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/barbell-seated-overhead-press.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/barbell-seated-overhead-press.thumb.webp",
  },
  {
    id: "dumbbell-lateral-raise",
    name: "Dumbbell Lateral Raise",
    aliases: ["Side Lateral Raise", "Lateral Raise", "Side Raise"],
    muscle: "delts",
    category: "shoulders",
    equipment: "dumbbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.thumb.webp",
  },
  {
    id: "cable-standing-rear-delt-row-with-rope",
    name: "Face Pull",
    aliases: ["Rope Face Pull", "Cable Face Pull", "Rear Delt Pull"],
    muscle: "delts",
    category: "shoulders",
    equipment: "cable",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/cable-standing-rear-delt-row-with-rope.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/cable-standing-rear-delt-row-with-rope.thumb.webp",
  },

  // ARMS
  {
    id: "barbell-standing-wide-grip-biceps-curl",
    name: "Barbell Biceps Curl",
    aliases: ["Barbell Curl", "Bicep Curl", "Biceps Curl"],
    muscle: "biceps",
    category: "arms",
    equipment: "barbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-standing-wide-grip-biceps-curl.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-standing-wide-grip-biceps-curl.thumb.webp",
  },
  {
    id: "cable-hammer-curl-with-rope",
    name: "Hammer Curl",
    aliases: ["Dumbbell Hammer Curl", "Rope Hammer Curl", "Neutral Grip Curl"],
    muscle: "biceps",
    category: "arms",
    equipment: "dumbbell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/cable-hammer-curl-with-rope.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/cable-hammer-curl-with-rope.thumb.webp",
  },
  {
    id: "cable-triceps-pushdown-v-bar",
    name: "Triceps Rope Pushdown",
    aliases: ["Tricep Pushdown", "Triceps Pushdown", "Cable Tricep Pushdown"],
    muscle: "triceps",
    category: "arms",
    equipment: "cable",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/cable-triceps-pushdown-v-bar.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/cable-triceps-pushdown-v-bar.thumb.webp",
  },
  {
    id: "bench-dip-knees-bent",
    name: "Bench Dip",
    aliases: ["Tricep Dips", "Dips on Bench"],
    muscle: "triceps",
    category: "arms",
    equipment: "bench",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/bench-dip-knees-bent.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/bench-dip-knees-bent.thumb.webp",
  },

  // CORE
  {
    id: "weighted-front-plank",
    name: "Plank",
    aliases: ["Front Plank", "Forearm Plank"],
    muscle: "core",
    category: "core",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/weighted-front-plank.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/weighted-front-plank.thumb.webp",
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    aliases: ["Deadbug"],
    muscle: "core",
    category: "core",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/dead-bug.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/dead-bug.thumb.webp",
  },
  {
    id: "assisted-hanging-knee-raise",
    name: "Hanging Knee Raise",
    aliases: ["Hanging Leg Raise", "Captain's Chair Knee Raise"],
    muscle: "core",
    category: "core",
    equipment: "pull_up_bar",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/assisted-hanging-knee-raise.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/assisted-hanging-knee-raise.thumb.webp",
  },
  {
    id: "russian-twist",
    name: "Russian Twist",
    aliases: ["Seated Russian Twist"],
    muscle: "core",
    category: "core",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/russian-twist.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/russian-twist.thumb.webp",
  },

  // CARDIO & CONDITIONING
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    aliases: ["KB Swing", "Russian Kettlebell Swing"],
    muscle: "hamstrings",
    category: "full_body",
    equipment: "kettlebell",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/kettlebell-swing.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/kettlebell-swing.thumb.webp",
  },
  {
    id: "burpee",
    name: "Burpee",
    aliases: ["Burpees", "Full Body Burpee"],
    muscle: "full_body",
    category: "cardio",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/cardio/burpee.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/cardio/burpee.thumb.webp",
  },
  {
    id: "run-equipment",
    name: "Treadmill Run",
    aliases: ["Running", "Treadmill", "Jogging"],
    muscle: "full_body",
    category: "cardio",
    equipment: "treadmill",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/cardio/run-equipment.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/cardio/run-equipment.thumb.webp",
  },
  {
    id: "stationary-bike-run-v-3",
    name: "Stationary Bike",
    aliases: ["Exercise Bike", "Cycling", "Spin Bike"],
    muscle: "quadriceps",
    category: "cardio",
    equipment: "bike",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/cardio/stationary-bike-run-v-3.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/cardio/stationary-bike-run-v-3.thumb.webp",
  },
  {
    id: "rowing-machine-seated",
    name: "Rowing Machine",
    aliases: ["Ergometer", "Rower", "Indoor Rowing"],
    muscle: "upper_back",
    category: "cardio",
    equipment: "rower",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/cable-low-seated-row.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/cable-low-seated-row.thumb.webp",
  },

  // MOBILITY & STRETCHING
  {
    id: "exercise-ball-hip-flexor-stretch",
    name: "World's Greatest Stretch",
    aliases: ["Hip Flexor Stretch", "Lunge Stretch", "World Greatest Stretch"],
    muscle: "hip_flexors",
    category: "mobility",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/exercise-ball-hip-flexor-stretch.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/glutes/exercise-ball-hip-flexor-stretch.thumb.webp",
  },
  {
    id: "spine-stretch",
    name: "Cat-Cow",
    aliases: ["Spine Stretch", "Cat Cow", "Spinal Mobility"],
    muscle: "lower_back",
    category: "mobility",
    equipment: "bodyweight",
    gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/spine/spine-stretch.gif",
    thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/spine/spine-stretch.thumb.webp",
  },
];

/**
 * Normalizes text for reliable matching against exercise names and aliases
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[—–\-_\s]+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/**
 * Finds a matching demonstration GIF by exercise name.
 * Uses exact match first, then alias matching, then fuzzy word overlap.
 */
export function findDemonstrationByName(name?: string | null): ExerciseDemonstration | null {
  if (!name) return null;
  const target = normalizeName(name);

  // 1. Exact match on name
  const exact = EXERCISE_DEMONSTRATIONS.find((d) => normalizeName(d.name) === target);
  if (exact) return exact;

  // 2. Exact match on alias
  const alias = EXERCISE_DEMONSTRATIONS.find((d) =>
    (d.aliases || []).some((a) => normalizeName(a) === target)
  );
  if (alias) return alias;

  // 3. Substring containment
  const sub = EXERCISE_DEMONSTRATIONS.find(
    (d) => target.includes(normalizeName(d.name)) || normalizeName(d.name).includes(target)
  );
  if (sub) return sub;

  // 4. Token overlap (e.g. "Bench Press" in "Barbell Bench Press")
  const targetTokens = new Set(target.split(" ").filter((t) => t.length > 2));
  let best: ExerciseDemonstration | null = null;
  let maxOverlap = 0;

  for (const demo of EXERCISE_DEMONSTRATIONS) {
    const demoTokens = normalizeName(demo.name).split(" ");
    let count = 0;
    for (const t of demoTokens) {
      if (targetTokens.has(t)) count++;
    }
    if (count > maxOverlap && count >= 2) {
      maxOverlap = count;
      best = demo;
    }
  }

  return best;
}

/**
 * Search the demonstration catalog by text query, muscle, or equipment.
 */
export function searchDemonstrations(opts: {
  query?: string;
  category?: string;
  muscle?: string;
  equipment?: string;
}): ExerciseDemonstration[] {
  const q = opts.query ? normalizeName(opts.query) : "";

  return EXERCISE_DEMONSTRATIONS.filter((demo) => {
    if (opts.category && opts.category !== "all" && demo.category !== opts.category) return false;
    if (opts.muscle && opts.muscle !== "all" && demo.muscle.toLowerCase() !== opts.muscle.toLowerCase()) return false;
    if (opts.equipment && opts.equipment !== "all" && demo.equipment.toLowerCase() !== opts.equipment.toLowerCase()) return false;

    if (!q) return true;
    const nameNorm = normalizeName(demo.name);
    if (nameNorm.includes(q)) return true;
    if ((demo.aliases || []).some((a) => normalizeName(a).includes(q))) return true;
    if (normalizeName(demo.muscle).includes(q)) return true;
    if (normalizeName(demo.equipment).includes(q)) return true;
    return false;
  });
}
