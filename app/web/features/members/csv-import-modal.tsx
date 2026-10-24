"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  X, 
  Loader2, 
  Users,
  ArrowRight
} from "lucide-react";
import { repsiApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CsvImportModal({ open, onOpenChange, onSuccess }: CsvImportModalProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    total_rows: number;
    imported: number;
    duplicates: number;
    errors: number;
    details: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleDownloadTemplate = () => {
    const csvContent = 
      "Name,Phone,Email,Gender,Plan\n" +
      "Rajesh Kumar,9876543210,rajesh@example.com,Male,Monthly\n" +
      "Priya Sharma,9876543211,priya@example.com,Female,Quarterly\n" +
      "Amit Patel,9876543212,amit@example.com,Male,Annual\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "repsi_members_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t("members.please_select_a_csv_file_to"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await repsiApi.importMembersCsv(file);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t("members.failed_to_import_csv_file_check"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">
                {t("members.import_members_from_csv")}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t("members.onboard_your_gym_members_from_excel")}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download Prompt */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <FileText className="w-4 h-4 text-[var(--primary)]" />
            <span>{t("members.need_the_standard_csv_format")}</span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-hover)] text-[var(--text)] hover:text-[var(--primary)] font-semibold text-xs border border-[var(--border)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("members.download_template")}</span>
          </button>
        </div>

        {/* Dropzone / File Picker */}
        {!result ? (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/70 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[var(--background)]/50 hover:bg-[var(--surface-hover)]/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">{file.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {t("members.countkb_click_to_change_file", undefined, { count: (file.size / 1024).toFixed(1) })}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">{t("members.click_or_drag_csv_here")}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {t("members.supports_csv_with_name_phone_email")}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? t("members.importing") : t("members.start_import")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Import Results Screen */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t("members.csv_import_complete")}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {t("members.processed_total_rowsrecords_from_your_sheet", undefined, { total_rows: result.total_rows })}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-2xl font-black text-emerald-500">{result.imported}</p>
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">{t("members.imported")}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-2xl font-black text-amber-500">{result.duplicates}</p>
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">{t("members.existing")}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-2xl font-black text-red-500">{result.errors}</p>
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">{t("members.skipped")}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs cursor-pointer shadow-md"
              >
                {t("members.done")}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
