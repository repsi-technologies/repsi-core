import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

// No canonical: it would be inherited by every post under this segment.
export const metadata: Metadata = {
  title: "Blog — Gym Business Guides",
  description: "Practical guides on running a gym: memberships, renewals, retention, payments, staff and marketing.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
