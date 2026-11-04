import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ChevronRight, Tag, Sparkles, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { constructMetadata } from "@/lib/seo";
import { INITIAL_BLOGS } from "@/lib/blog-data";
import { BlogShareButton, BlogFaqAccordion } from "@/components/marketing/blog-interactions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return INITIAL_BLOGS.filter((b) => b.status === "published").map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = INITIAL_BLOGS.find((b) => b.slug === slug);

  if (!post) {
    return constructMetadata({
      title: "Article Not Found",
      description: "The requested fitness business article could not be found.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return constructMetadata({
    title: post.seoTitle || `${post.title} | Repsi Blog`,
    description: post.seoDescription || post.summary,
    keywords: [
      ...post.tags,
      "Rhapsy",
      "Rhapsy gym",
      "Repsi",
      "gym management software",
      "fitness studio management",
    ],
    path: `/blog/${post.slug}`,
    ogType: "article",
    image: post.featuredImage,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const currentPost = INITIAL_BLOGS.find((b) => b.slug === slug);

  if (!currentPost) {
    notFound();
  }

  const relatedPosts = INITIAL_BLOGS.filter(
    (b) =>
      b.id !== currentPost.id &&
      (currentPost.relatedSlugs?.includes(b.slug) || b.category === currentPost.category)
  ).slice(0, 3);

  // Structured Schema data for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: currentPost.title,
    description: currentPost.seoDescription || currentPost.summary,
    image: currentPost.featuredImage,
    datePublished: currentPost.publishDate,
    dateModified: currentPost.publishDate,
    author: {
      "@type": "Person",
      name: currentPost.author.name,
      jobTitle: currentPost.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "Repsi",
      alternateName: ["Rhapsy", "REPSI", "Rhapsy Technologies"],
      logo: {
        "@type": "ImageObject",
        url: "https://repsi.app/icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentPost.canonicalUrl || `https://repsi.app/blog/${currentPost.slug}`,
    },
  };

  const faqSchema =
    currentPost.faqs && currentPost.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: currentPost.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#17191C] text-[#F7F7F5] font-sans antialiased flex flex-col selection:bg-[var(--primary)]/30 selection:text-[var(--primary-dark)]">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <MarketingNav />

      {/* Breadcrumbs & Header */}
      <section className="pt-28 pb-10 px-4 sm:px-6 lg:px-8 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[var(--primary)]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-5">
          {/* Breadcrumb row */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/" className="hover:text-[var(--primary-dark)] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <Link href="/blog" className="hover:text-[var(--primary-dark)] transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-300 truncate max-w-xs">{currentPost.category}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-md bg-[var(--primary)]/20 text-[var(--primary-dark)] text-xs font-bold uppercase">
              {currentPost.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              {currentPost.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {currentPost.title}
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
            {currentPost.summary}
          </p>

          {/* Author & Share Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                <img
                  src={currentPost.author.avatar}
                  alt={currentPost.author.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#F7F7F5]">{currentPost.author.name}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <span>{currentPost.author.role}</span>
                  <span>•</span>
                  <span>Published {currentPost.publishDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BlogShareButton />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Banner Image */}
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl h-[300px] sm:h-[420px] relative">
          <img
            src={currentPost.featuredImage}
            alt={currentPost.title}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <article className="prose prose-invert prose-emerald max-w-none space-y-6 text-zinc-300 leading-relaxed text-base sm:text-lg">
          {currentPost.content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            if (trimmed === "---") {
              return <hr key={idx} className="border-zinc-800 my-8" />;
            }
            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  className="text-2xl sm:text-3xl font-bold text-white pt-6 pb-2 border-b border-zinc-800"
                >
                  {trimmed.replace("## ", "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3
                  key={idx}
                  className="text-xl sm:text-2xl font-semibold text-[var(--primary-dark)] pt-4"
                >
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("#### ")) {
              return (
                <h4
                  key={idx}
                  className="text-lg sm:text-xl font-semibold text-white pt-3"
                >
                  {trimmed.replace("#### ", "")}
                </h4>
              );
            }
            if (trimmed.startsWith("|") && trimmed.includes("\n|")) {
              const rows = trimmed.split("\n").filter((r) => r.trim().startsWith("|"));
              if (rows.length >= 2) {
                const headerCells = rows[0]
                  .split("|")
                  .filter((c, i, arr) => i > 0 && i < arr.length - 1)
                  .map((c) => c.trim());
                const bodyRows = rows.slice(2);
                return (
                  <div key={idx} className="overflow-x-auto my-6 rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-sm text-zinc-300">
                      <thead className="bg-zinc-900 text-xs uppercase text-zinc-400 border-b border-zinc-800">
                        <tr>
                          {headerCells.map((hc, hIdx) => (
                            <th key={hIdx} className="px-4 py-3 font-semibold">
                              {hc.replace(/\*\*/g, "")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                        {bodyRows.map((br, bIdx) => {
                          const cells = br
                            .split("|")
                            .filter((c, i, arr) => i > 0 && i < arr.length - 1)
                            .map((c) => c.trim());
                          return (
                            <tr key={bIdx} className="hover:bg-zinc-900/40 transition-colors">
                              {cells.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-xs sm:text-sm">
                                  {cell.replace(/\*\*/g, "")}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
            }
            if (trimmed.startsWith("- ")) {
              const items = trimmed.split("\n").map((li) => li.replace(/^- /, ""));
              return (
                <ul key={idx} className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm sm:text-base">
                      {item.includes("**") ? (
                        <span>
                          {item.split("**").map((part, pIdx) =>
                            pIdx % 2 === 1 ? (
                              <strong key={pIdx} className="font-semibold text-white">
                                {part}
                              </strong>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>
              );
            }
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split("\n").map((li) => li.replace(/^\d+\.\s*/, ""));
              return (
                <ol key={idx} className="list-decimal list-inside space-y-2 text-zinc-300 pl-2">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm sm:text-base">
                      {item.includes("**") ? (
                        <span>
                          {item.split("**").map((part, pIdx) =>
                            pIdx % 2 === 1 ? (
                              <strong key={pIdx} className="font-semibold text-white">
                                {part}
                              </strong>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={idx} className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {trimmed.includes("**") ? (
                  <span>
                    {trimmed.split("**").map((part, pIdx) =>
                      pIdx % 2 === 1 ? (
                        <strong key={pIdx} className="font-semibold text-white">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </span>
                ) : (
                  trimmed
                )}
              </p>
            );
          })}
        </article>

        {/* Tags */}
        <div className="pt-6 border-t border-zinc-800 flex items-center flex-wrap gap-2">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mr-2">
            <Tag className="w-3.5 h-3.5 text-[var(--primary-dark)]" />
            Topic Tags:
          </span>
          {currentPost.tags.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* FAQs Section */}
        {currentPost.faqs && currentPost.faqs.length > 0 && (
          <BlogFaqAccordion faqs={currentPost.faqs} />
        )}

        {/* Mid-Article Repsi Showcase Banner */}
        <div className="rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary)]/15 via-zinc-900 to-zinc-950 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-[var(--primary-dark)] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Repsi (Rhapsy) All-In-One Fitness OS</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-bold text-white">
            Transform Your Fitness Business With Zero Complexity
          </h4>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
            Join hundreds of gyms, fitness studios, and personal trainers running QR check-ins, automated WhatsApp billing, and trainer apps on Repsi.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs shadow-lg transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-zinc-300 hover:text-[var(--primary-dark)] underline underline-offset-4"
            >
              View Plans from ₹199/mo →
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-zinc-800">
            <h3 className="text-xl font-bold text-white">Related In This Topic Cluster</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-[var(--primary)]/40 transition-all block space-y-2.5"
                >
                  <div className="h-32 rounded-lg overflow-hidden relative">
                    <img
                      src={r.featuredImage}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--primary-dark)] uppercase tracking-wide">
                    {r.category}
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-[var(--primary-dark)] line-clamp-2">
                    {r.title}
                  </h5>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
