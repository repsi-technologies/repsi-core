import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Download the Repsi App — Android, iOS, Windows",
  description: "Get the Repsi gym management app for members, trainers and owners on Android, iOS and desktop.",
  path: "/download",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
