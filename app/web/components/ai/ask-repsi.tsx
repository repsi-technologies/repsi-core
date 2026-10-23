"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { aiApi, SOURCE_LABEL, type AssistantAnswer } from "@/lib/ai-api";
import { getWorkspaceFromPath } from "@/lib/workspace";
import { getAuthUser } from "@/lib/auth";

interface Turn {
  q: string;
  a?: AssistantAnswer;
  error?: string;
}

const STARTERS = ["How do I add a member?", "How do I record a payment?", "Who owes dues?", "How do I send an announcement?"];
const MEMBER_STARTERS = ["Where is my QR pass?", "When does my membership end?", "Suggest a workout for me"];

/** Floating help assistant (owner help guide) has been removed. Only useful AI features (Insights, Smart Reminders, AI Coach) remain active. */
export function AskRepsi() {
  return null;
}
