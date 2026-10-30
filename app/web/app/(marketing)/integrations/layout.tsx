import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Integrations — Payments, WhatsApp, Google Fit & More",
  description: "Repsi connects with Razorpay and UPI payments, WhatsApp messaging, email, biometric devices and health apps so your gym runs from one system.",
  path: "/integrations",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
