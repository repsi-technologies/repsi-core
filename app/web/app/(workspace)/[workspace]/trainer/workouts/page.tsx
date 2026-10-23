"use client";

import { Suspense, use } from "react";
import { LoadingRow } from "@/features/fitness/shared";
import { WorkoutsHub } from "@/features/fitness/workouts-hub";

export default function TrainerWorkoutsPage(props: { params: Promise<{ workspace: string }> }) {
  const { workspace } = use(props.params);
  return (
    <Suspense fallback={<LoadingRow />}>
      <WorkoutsHub title="Workouts" basePath={`/${workspace}/trainer/workouts`} memberHref={(id) => `/${workspace}/trainer/clients/${id}`} />
    </Suspense>
  );
}
