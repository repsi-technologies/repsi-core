"use client";

import { use } from "react";
import { ProgramEditor } from "@/features/fitness/programs";

export default function ProgramPage(props: { params: Promise<{ workspace: string; programId: string }> }) {
  const { workspace, programId } = use(props.params);
  return <ProgramEditor programId={programId} basePath={`/${workspace}/workouts`} />;
}
