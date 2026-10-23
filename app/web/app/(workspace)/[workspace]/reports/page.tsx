import type { Metadata } from "next";
import { ReportsCenter } from "@/features/reports/reports-center";

export const metadata: Metadata = {
  title: "Reports",
  description: "Revenue, membership, attendance, dues, trainer and class reports with CSV, Excel and PDF export.",
};

export default function WorkspaceReportsPage() {
  return <ReportsCenter />;
}
