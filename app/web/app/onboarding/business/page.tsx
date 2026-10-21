import { redirect } from "next/navigation";

// The onboarding flow lives at /onboarding and resumes from the server-saved step.
export default function LegacyOnboardingStep() {
  redirect("/onboarding");
}
