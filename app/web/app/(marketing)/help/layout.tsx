import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Help Center",
  description: "Guides and answers for using Repsi: members, memberships, attendance, payments, trainers, workouts and the member app.",
  path: "/help",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
