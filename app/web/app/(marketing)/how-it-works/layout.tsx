import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "How Repsi Works — Set Up Your Gym in Minutes",
  description: "See how gyms set up Repsi: add members, create membership plans, collect payments, track QR attendance and send automatic renewal reminders.",
  path: "/how-it-works",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
