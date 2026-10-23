"use client";

import { Suspense, use } from "react";
import { LoadingRow } from "@/features/fitness/shared";
import { WorkoutsHub } from "@/features/fitness/workouts-hub";

export default function WorkspaceWorkoutsPage(props: { params: Promise<{ workspace: string }> }) {
  const { workspace } = use(props.params);
  return (
    <Suspense fallback={<LoadingRow />}>
      <WorkoutsHub title="Workouts & training" basePath={`/${workspace}/workouts`} memberHref={(id) => `/${workspace}/members/${id}?tab=training`} />
    </Suspense>
  );
}
