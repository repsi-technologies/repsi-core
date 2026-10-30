import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Contact Repsi",
  description: "Talk to the Repsi team about gym management software for your gym, studio or fitness chain — demos, onboarding, migration and support.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
