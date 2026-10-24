"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "@/lib/i18n";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-xs">
      <div className="font-bold text-[var(--text)] mb-1">{label}</div>
      <div className="text-[var(--text-muted)]">
        {t("dashboard.check_ins")}{" "}
        <span className="font-bold text-[var(--text)] tabular-nums">
          {payload[0].value}
        </span>
      </div>
    </div>
  );
}

export function AttendanceChart({ data }: { data?: Array<{ label: string; value: number }> }) {
  const { t } = useTranslation();
  const chartData = data || [
    { label: t("dashboard.mon"), value: 0 },
    { label: t("dashboard.tue"), value: 0 },
    { label: t("dashboard.wed"), value: 0 },
    { label: t("dashboard.thu"), value: 0 },
    { label: t("dashboard.fri"), value: 0 },
    { label: t("dashboard.sat"), value: 0 },
    { label: t("dashboard.sun"), value: 0 },
  ];

  const totalThisWeek = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] dark:bg-gradient-to-b dark:from-[var(--surface)] dark:to-[var(--background)] p-4 sm:p-6 shadow-[0_1px_3px_rgba(23,25,28,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-[var(--text)] tracking-tight">{t("nav.attendance")}</h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            {t("dashboard.daily_check_ins_this_week")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-[var(--text)] tabular-nums">
            {totalThisWeek}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium">{t("dashboard.total_this_week")}</div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          barSize={28}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--divider)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-soft)", radius: 4 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => {
              const isLatest = index === chartData.length - 1;
              const hasActivity = entry.value > 0;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    hasActivity || isLatest
                      ? "var(--primary)"
                      : "var(--surface-soft)"
                  }
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
