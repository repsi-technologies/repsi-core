"use client";

import { MemberWorkouts } from "@/features/fitness/workout-runner";

export default function MemberWorkoutPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">My workouts</h1>
        <p className="text-sm text-[var(--text-muted)]">Today&apos;s session, your week and your workout history.</p>
      </div>
      <MemberWorkouts />
    </div>
  );
}
