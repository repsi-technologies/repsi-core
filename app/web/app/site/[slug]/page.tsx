"use client";

import { useState, useEffect, use } from "react";
import { repsiApi } from "@/lib/api";
import {
  Dumbbell,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  Users,
  Flame,
  Send,
} from "lucide-react";
import { GymAssistantWidget } from "@/components/public-site/gym-assistant-widget";
import { useTranslation, tr, richText } from "@/lib/i18n";

export default function PublicGymWebsitePage(props: { params: Promise<{ slug: string }> }) {
  const { t } = useTranslation();
  const params = use(props.params);
  const slug = params.slug;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lead Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interested_plan: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadSite() {
      try {
        const res = await repsiApi.getPublicWebsite(slug);
        setData(res);
      } catch (err: any) {
        setError(err.message || t("site.this_gym_website_is_not_yet"));
      } finally {
        setLoading(false);
      }
    }
    loadSite();
  }, [slug]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await repsiApi.submitPublicLead(slug, form);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || t("site.failed_to_submit_inquiry"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">{t("site.loading_website")}</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("site.website_coming_soon")}</h1>
          <p className="text-sm text-zinc-400 mb-6">
            {error || t("site.this_gym_website_hasn_t_been")}
          </p>
        </div>
      </div>
    );
  }

  const { website, gym_name, plans, trainers, classes } = data;
  const primaryColor = website.primary_color || "#E11D48";
  const templateName = website.template_id || t("site.modern_fitness");

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-rose-500 selection:text-[var(--primary-foreground)]">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">{website.title || gym_name}</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#about" className="hover:text-white transition">
              {t("site.about")}
            </a>
            <a href="#plans" className="hover:text-white transition">
              {t("navItem.memberships")}
            </a>
            <a href="#trainers" className="hover:text-white transition">
              {t("site.coaches")}
            </a>
            <a href="#classes" className="hover:text-white transition">
              {t("nav.classes")}
            </a>
            <a href="#contact" className="hover:text-white transition">
              {t("site.location")}
            </a>
          </nav>

          <div>
            <a
              href="#lead-form"
              className="px-4 py-2 rounded-xl font-medium text-xs md:text-sm text-white transition shadow-lg inline-flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {t("site.book_free_trial")}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-[#09090b]" />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px] opacity-25 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("site.welcome_to_value", undefined, { value: website.title || gym_name })}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            {website.tagline || website.headline || t("site.elevate_your_strength_transform_your_life")}
          </h1>

          <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("site.experience_world_class_coaching_modern_equipment")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#lead-form"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm text-white shadow-xl transition flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {richText(t("site.start_your_free_trial_arrowright"), { arrowright: <ArrowRight className="w-4 h-4" /> })}</a>
            <a
              href="#plans"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-sm transition"
            >
              {t("site.view_membership_plans")}
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-3 max-w-xl mx-auto border-t border-zinc-800/80 pt-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">500+</div>
              <div className="text-xs text-zinc-500 mt-1">{t("site.active_athletes")}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">100%</div>
              <div className="text-xs text-zinc-500 mt-1">{t("site.certified_coaches")}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">4.9 ★</div>
              <div className="text-xs text-zinc-500 mt-1">{t("site.community_rating")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      {website.about_text && (
        <section id="about" className="py-20 border-b border-zinc-800/60 bg-zinc-950/40">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 block mb-2">{t("site.our_mission")}</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{t("site.about_value", undefined, { value: website.title || gym_name })}</h2>
            <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-line">{website.about_text}</p>
          </div>
        </section>
      )}

      {/* Membership Plans Section */}
      <section id="plans" className="py-24 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 block mb-2">{t("navItem.memberships")}</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{t("site.transparent_pricing_for_every_goal")}</h2>
            <p className="text-sm text-zinc-400">
              {t("site.no_hidden_fees_full_access_to")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans && plans.length > 0 ? (
              plans.map((p: any, idx: number) => (
                <div
                  key={p.id || idx}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition ${
                    idx === 1
                      ? "border-rose-500/50 bg-zinc-900 shadow-2xl relative"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {idx === 1 && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white shadow"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {t("site.most_popular")}
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-white mb-1">{p.name}</h3>
                    <p className="text-xs text-zinc-400 mb-6">{p.description || t("site.comprehensive_gym_access_plan")}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl md:text-4xl font-black text-white">₹{p.price}</span>
                      <span className="text-xs text-zinc-500">/ {p.duration_days} days</span>
                    </div>

                    <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                      <li className="flex items-center gap-2">
                        {richText(t("site.checkcircle2unlimited_gym_access"), { checkcircle2: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> })}</li>
                      <li className="flex items-center gap-2">
                        {richText(t("site.checkcircle2free_fitness_assessment_body_scan"), { checkcircle2: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> })}</li>
                      <li className="flex items-center gap-2">
                        {richText(t("site.checkcircle2locker_shower_facilities"), { checkcircle2: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> })}</li>
                    </ul>
                  </div>

                  <a
                    href="#lead-form"
                    onClick={() => setForm({ ...form, interested_plan: p.name })}
                    className="w-full py-3 rounded-xl font-medium text-xs text-center text-white transition block"
                    style={{ backgroundColor: idx === 1 ? primaryColor : "#27272a" }}
                  >
                    {t("site.select_plan")}
                  </a>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-zinc-500">
                {t("site.contact_our_gym_team_directly_for")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Coaches Section */}
      {trainers && trainers.length > 0 && (
        <section id="trainers" className="py-20 border-b border-zinc-800/60 bg-zinc-950/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 block mb-2">{t("onboarding.team")}</span>
              <h2 className="text-3xl font-black text-white mb-3">{t("site.meet_your_certified_coaches")}</h2>
              <p className="text-sm text-zinc-400">{t("site.expert_guidance_for_strength_conditioning_and")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trainers.map((t: any, idx: number) => (
                <div key={t.id || idx} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                    {t.name ? t.name[0] : "C"}
                  </div>
                  <h3 className="font-bold text-lg text-white">{t.name}</h3>
                  <div className="text-xs text-rose-400 font-medium mb-3">{t.specialization || tr("site.fitness_coach")}</div>
                  <p className="text-xs text-zinc-400">{t.bio || tr("site.dedicated_to_helping_athletes_hit_their")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Direct Lead Capture Form */}
      <section id="lead-form" className="py-24 border-b border-zinc-800/60">
        <div className="max-w-xl mx-auto px-4">
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />

            <div className="text-center mb-8">
              <span className="text-xs uppercase font-mono text-emerald-400 block mb-1">{t("site.zero_obligation")}</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{t("site.claim_your_free_gym_trial")}</h2>
              <p className="text-xs text-zinc-400">
                {t("site.leave_your_contact_details_and_our")}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-white mb-1">{t("site.inquiry_received")}</h3>
                <p className="text-xs text-zinc-400">
                  {t("site.thank_you_our_gym_reception_team")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">{t("site.full_name")}</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white outline-none focus:border-rose-500"
                    placeholder={t("site.e_g_aditi_roy")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">{t("site.phone_number_whatsapp")}</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white outline-none focus:border-rose-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">{t("auth.email_address")}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white outline-none focus:border-rose-500"
                      placeholder="aditi@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">{t("site.interested_plan_goal")}</label>
                  <input
                    type="text"
                    value={form.interested_plan}
                    onChange={(e) => setForm({ ...form, interested_plan: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white outline-none"
                    placeholder={t("site.e_g_weight_loss_hypertrophy_free")}
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">{t("site.message_preferred_time")}</label>
                  <textarea
                    rows={2}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white outline-none"
                    placeholder={t("site.any_questions_or_special_requests")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-xl transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-4 h-4" />
                  {submitting ? t("site.sending") : t("site.submit_pass_request")}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer / Location */}
      <footer id="contact" className="py-16 bg-zinc-950 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Dumbbell className="w-5 h-5 text-rose-500" />
              <span>{website.title || gym_name}</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              {t("site.powered_by_repsi_app_gym_management")}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t("site.visiting_hours")}</h4>
            <p className="leading-relaxed">{website.opening_hours || t("site.mon_sat_06_00_am_10")}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t("onboarding.contact")}</h4>
            <div className="space-y-1.5">
              {website.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${website.phone}`} className="hover:text-white">
                    {website.phone}
                  </a>
                </div>
              )}
              {website.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${website.email}`} className="hover:text-white">
                    {website.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t("site.location")}</h4>
            <div className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{website.address || t("site.main_street_fitness_plaza")}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Gym Assistant Mascot Widget */}
      <GymAssistantWidget
        website={website}
        gymName={gym_name || website.title}
        plans={plans || []}
        trainers={trainers || []}
        classes={classes || []}
        slug={slug}
      />
    </div>
  );
}
