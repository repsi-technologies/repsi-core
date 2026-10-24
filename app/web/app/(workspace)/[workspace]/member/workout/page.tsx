"use client";

import { MemberWorkouts } from "@/features/fitness/workout-runner";
import { useTranslation } from "@/lib/i18n";

export default function MemberWorkoutPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">
          {t("fitness.myWorkouts", "My workouts")}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {t("fitness.myWorkoutsSubtitle", "Today's session, your week and your workout history.")}
        </p>
      </div>
      <MemberWorkouts />
    </div>
  );
}

