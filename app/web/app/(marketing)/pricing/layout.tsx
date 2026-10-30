import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Pricing — Gym Management Software Plans from ₹199/month",
  description: "Simple monthly plans for gyms, studios and trainers, priced by active members. Compare Lite, Starter, Growth, Pro and Enterprise, with savings on 3-, 6- and 12-month billing.",
  path: "/pricing",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
