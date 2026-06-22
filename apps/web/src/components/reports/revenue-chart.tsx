"use client";

import { formatNgn } from "@/lib/unit-utils";

type RevenueChartProps = {
  data: { month: string; revenueNgn: number; bookingCount: number }[];
};

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenueNgn), 1);
  const width = 480;
  const height = 220;
  const padding = { top: 20, right: 16, bottom: 40, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barGap = 8;
  const barW = data.length > 0 ? (chartW - barGap * (data.length - 1)) / data.length : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-xl"
        role="img"
        aria-label="Monthly revenue chart"
      >
        {data.map((row, i) => {
          const barH = (row.revenueNgn / maxRevenue) * chartH;
          const x = padding.left + i * (barW + barGap);
          const y = padding.top + chartH - barH;
          const label = row.month.slice(5);
          return (
            <g key={row.month}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className="fill-primary/80"
              />
              <text
                x={x + barW / 2}
                y={padding.top + chartH + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {label}
              </text>
              {row.revenueNgn > 0 ? (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-foreground text-[9px]"
                >
                  {formatNgn(row.revenueNgn)}
                </text>
              ) : null}
            </g>
          );
        })}
        <line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          className="stroke-border"
        />
      </svg>
    </div>
  );
}
