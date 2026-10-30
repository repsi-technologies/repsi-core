"use client";

import { ChevronDown } from "lucide-react";
import { HOME_FAQS } from "@/lib/home-faq";
import { useTranslation } from "@/lib/i18n";

/** Plain <details> keeps every answer in the server HTML, so crawlers and answer engines can read it. */
export function HomeFaqSection() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="home-faq-title" className="bg-[#FAF9F6] px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h2 id="home-faq-title" className="font-heading text-2xl font-bold tracking-tight text-[#191919] sm:text-3xl">
          {t("home_faq.title", "Gym management software — common questions")}
        </h2>
        <div className="mt-8 divide-y divide-[#E4E2DC] rounded-2xl border border-[#E4E2DC] bg-white">
          {HOME_FAQS.map((f) => (
            <details key={f.id} className="group px-5 py-4 open:pb-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-[#191919] [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold">{t(`home_faq.${f.id}_q`, f.question)}</h3>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#6B6F76] transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#4A4E55]">{t(`home_faq.${f.id}_a`, f.answer)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
