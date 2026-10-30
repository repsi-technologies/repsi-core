"use client";

/* eslint-disable @next/next/no-img-element -- object URLs from authenticated fetches */
import { useEffect, useState } from "react";
import { FileText, ImageOff, Loader2 } from "lucide-react";
import { fetchProtectedFile } from "@/lib/api";
import { cn } from "@/lib/utils";

/** <img> for API files that need the bearer token (merchant QR, payment receipts). PDFs get a link instead. */
export function AuthImage({ src, alt, className, version }: { src: string; alt: string; className?: string; version?: string | null }) {
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let live = true;
    setFile(null);
    setFailed(false);
    fetchProtectedFile(src)
      .then((f) => {
        url = f.url;
        if (live) setFile(f);
        else URL.revokeObjectURL(f.url);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, version]);

  if (failed) return <ImageOff className="h-6 w-6 text-[var(--text-muted)]" aria-label={alt} />;
  if (!file) return <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" aria-label={alt} />;
  if (file.type === "application/pdf") {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--link)] hover:underline">
        <FileText className="h-4 w-4" aria-hidden /> {alt}
      </a>
    );
  }
  return <img src={file.url} alt={alt} className={cn("object-contain", className)} />;
}

/** Opens a protected file in a new tab (links can't carry the bearer token either). */
export async function openProtectedFile(src: string) {
  const tab = window.open("", "_blank");
  try {
    const f = await fetchProtectedFile(src);
    if (tab) tab.location.href = f.url;
    else window.location.href = f.url;
  } catch {
    tab?.close();
  }
}
