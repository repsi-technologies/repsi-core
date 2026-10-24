"use client";

import { useState } from "react";
import { Globe, Search, CheckCircle2, Link as LinkIcon, Sparkles } from "lucide-react";
import { useTranslation, richText } from "@/lib/i18n";

export interface GymSeoFormData {
  pageTitle: string;
  metaDescription: string;
  keywords: string;
  socialImage: string;
  allowSearchEngines: boolean;
  googleBusinessProfileUrl: string;
  enableAutoSchema: boolean;
}

export function GymSeoSettingsForm({
  initialData,
  subdomain = "fitzone",
}: {
  initialData?: Partial<GymSeoFormData>;
  subdomain?: string;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<GymSeoFormData>({
    pageTitle: initialData?.pageTitle || t("builder.subdomain_gym_best_gym_in_coimbatore", undefined, { subdomain: subdomain.toUpperCase() }),
    metaDescription:
      initialData?.metaDescription ||
      t("builder.join_subdomain_gym_in_coimbatore_premium", undefined, { subdomain: subdomain.toUpperCase() }),
    keywords: initialData?.keywords || t("builder.gym_in_coimbatore_fitness_center_personal"),
    socialImage: initialData?.socialImage || "",
    allowSearchEngines: initialData?.allowSearchEngines ?? true,
    googleBusinessProfileUrl: initialData?.googleBusinessProfileUrl || "",
    enableAutoSchema: initialData?.enableAutoSchema ?? true,
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const canonicalUrl = `https://${subdomain}.repsi.app`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            {richText(t("builder.searchseo_google_visibility_settings"), { search: <Search className="w-5 h-5 text-primary" /> })}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("builder.configure_how_your_gym_website_appears")}
          </p>
        </div>
        {saved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
            {richText(t("builder.checkcircle2saved"), { checkcircle2: <CheckCircle2 className="w-3.5 h-3.5" /> })}</div>
        )}
      </div>

      {/* Page Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t("builder.page_title")}{" "}<span className="text-muted-foreground font-normal">{t("builder.recommended_50_60_characters")}</span>
        </label>
        <input
          type="text"
          value={formData.pageTitle}
          onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
          placeholder={t("builder.fitzone_gym_gym_in_coimbatore")}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
        />
        <p className="text-[11px] text-muted-foreground">
          {t("builder.current_length_countcharacters", undefined, { count: formData.pageTitle.length })}</p>
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t("builder.meta_description")}{" "}<span className="text-muted-foreground font-normal">{t("builder.recommended_140_160_characters")}</span>
        </label>
        <textarea
          rows={3}
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          placeholder={t("builder.join_fitzone_gym_in_coimbatore_modern")}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
        />
        <p className="text-[11px] text-muted-foreground">
          {t("builder.current_length_countcharacters", undefined, { count: formData.metaDescription.length })}</p>
      </div>

      {/* Keywords */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t("builder.keywords")}{" "}<span className="text-muted-foreground font-normal">{t("builder.comma_separated")}</span>
        </label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          placeholder={t("builder.gym_in_coimbatore_fitness_center_weight")}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
        />
      </div>

      {/* Automatic Systems */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {richText(t("builder.linkiconcanonical_url"), { linkicon: <LinkIcon className="w-3.5 h-3.5 text-primary" /> })}</div>
          <p className="text-xs font-mono text-muted-foreground truncate">{canonicalUrl}</p>
          <p className="text-[10px] text-emerald-500 font-medium">{t("builder.handled_automatically")}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {richText(t("builder.globesitemap_robots_txt"), { globe: <Globe className="w-3.5 h-3.5 text-primary" /> })}</div>
          <p className="text-xs font-mono text-muted-foreground">{canonicalUrl}/sitemap.xml</p>
          <p className="text-[10px] text-emerald-500 font-medium">{t("builder.enabled_automatically")}</p>
        </div>
      </div>

      {/* Google Business Profile */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t("builder.google_business_profile_url")}
        </label>
        <input
          type="url"
          value={formData.googleBusinessProfileUrl}
          onChange={(e) => setFormData({ ...formData, googleBusinessProfileUrl: e.target.value })}
          placeholder="https://maps.google.com/?cid=..."
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background cursor-pointer">
          <span className="text-xs font-medium text-foreground">{t("builder.allow_google_search_engines_to_index")}</span>
          <input
            type="checkbox"
            checked={formData.allowSearchEngines}
            onChange={(e) => setFormData({ ...formData, allowSearchEngines: e.target.checked })}
            className="w-4 h-4 rounded-md accent-primary"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background cursor-pointer">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            {richText(t("builder.sparklesautomatic_localbusiness_structured_data_json_ld"), { sparkles: <Sparkles className="w-3.5 h-3.5 text-primary" /> })}</span>
          <input
            type="checkbox"
            checked={formData.enableAutoSchema}
            onChange={(e) => setFormData({ ...formData, enableAutoSchema: e.target.checked })}
            className="w-4 h-4 rounded-md accent-primary"
          />
        </label>
      </div>

      {/* Search Snippet Preview */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("builder.google_search_snippet_preview")}</span>
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
          {formData.pageTitle}
        </div>
        <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
          {canonicalUrl}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {formData.metaDescription}
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
      >
        {t("builder.save_seo_settings")}
      </button>
    </form>
  );
}
