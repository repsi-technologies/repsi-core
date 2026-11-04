"use client";

import { useState } from "react";
import { Share2, HelpCircle } from "lucide-react";

export function BlogShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 border border-zinc-700 transition-colors"
      title="Copy link to article"
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>{copied ? "Link Copied!" : "Share"}</span>
    </button>
  );
}

export function BlogFaqAccordion({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="space-y-4 pt-6 border-t border-zinc-800">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-[var(--primary-dark)]" />
        <span>Frequently Asked Questions</span>
      </h3>
      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <div
              key={i}
              className="border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : i)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-zinc-200 hover:text-[var(--primary-dark)] transition-colors"
              >
                <span>{faq.question}</span>
                <span className="text-[var(--primary-dark)] text-lg font-mono">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 bg-zinc-950/40">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

