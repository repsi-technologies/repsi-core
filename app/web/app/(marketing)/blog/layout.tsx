import type { Metadata } from "next";

// Default metadata for the blog section.
// No canonical here: a canonical set in a layout is inherited by every child page.
export const metadata: Metadata = {
  title: {
    default: "Repsi (Rhapsy) Blog — Gym Business & Fitness Tech Insights",
    template: "%s | Repsi Blog",
  },
  description:
    "Expert guides, automated WhatsApp playbooks, retention tactics, and growth strategies for gym owners, fitness studios, and personal trainers by Repsi (Rhapsy).",
  keywords: [
    "Rhapsy blog",
    "Repsi blog",
    "gym business tips",
    "gym management software",
    "gym member retention",
    "gym WhatsApp automation",
    "personal trainer business",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
