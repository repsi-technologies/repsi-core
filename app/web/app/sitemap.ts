import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { FEATURES_DATA } from "@/lib/features-data";
import { COMPARISON_DATA } from "@/lib/compare-data";
import { CITY_DATA } from "@/lib/city-data";
import { SOLUTION_ALIASES, SOLUTIONS_DATA } from "@/lib/solutions-data";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

/**
 * Only indexable, existing pages. Dynamic sections are derived from the same data the pages
 * render from, so a removed page can't linger here as a 404.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entry = (path: string, priority: number, changeFrequency: Freq = "monthly") => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    entry("", 1.0, "weekly"),
    entry("/pricing", 0.9, "weekly"),
    entry("/features", 0.9),
    entry("/gym-management-software-india", 0.9),
    entry("/how-it-works", 0.7),
    entry("/integrations", 0.6),
    entry("/download", 0.6),
    entry("/use-cases", 0.6),
    entry("/about", 0.5),
    entry("/contact", 0.5),
    entry("/help", 0.5),
    entry("/blog", 0.6, "weekly"),
    entry("/changelog", 0.4, "weekly"),
    entry("/privacy", 0.2, "yearly"),
    entry("/terms", 0.2, "yearly"),
    ...Object.keys(FEATURES_DATA).map((slug) => entry(`/features/${slug}`, 0.85)),
    ...Object.keys(SOLUTIONS_DATA)
      .filter((slug) => !(slug in SOLUTION_ALIASES))
      .map((slug) => entry(`/solutions/${slug}`, 0.8)),
    ...Object.keys(COMPARISON_DATA).map((slug) => entry(`/compare/${slug}`, 0.7)),
    ...Object.keys(CITY_DATA).map((slug) => entry(`/cities/${slug}`, 0.7)),
  ];
}
