import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Use Cases — Gyms, Studios, Pools & Personal Trainers",
  description: "How gyms, boutique studios, yoga studios, swimming pools and personal trainers use Repsi to manage members, payments and training.",
  path: "/use-cases",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
