import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Changelog — What's New in Repsi",
  description: "Product updates and new features in Repsi gym management software.",
  path: "/changelog",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
