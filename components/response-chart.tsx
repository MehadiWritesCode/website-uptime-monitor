"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useIsClient } from "@/lib/use-is-client";

export type SeriesPoint = {
  t: string;
  avg: number | null;
  checks: number;
  failures: number;
};

const tickTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

export function ResponseChart({ data }: { data: SeriesPoint[] }) {
  const isClient = useIsClient();

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-neutral-500">
        No checks in the last 24 hours yet.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      {isClient && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.15}
            />
            <XAxis
              dataKey="t"
              tickFormatter={tickTime}
              minTickGap={40}
              tick={{ fontSize: 12 }}
            />
            <YAxis unit=" ms" width={70} tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) =>
                new Date(String(label)).toLocaleString()
              }
              formatter={(value) => [`${value} ms`, "Avg response"]}
              contentStyle={{ color: "#171717" }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
