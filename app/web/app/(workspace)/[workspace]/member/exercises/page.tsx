"use client";

import { ExerciseLibrary } from "@/features/fitness/exercise-library";

export default function MemberExercisesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--text)]">Exercise library</h1>
      <ExerciseLibrary memberView />
    </div>
  );
}
