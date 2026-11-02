"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthlyPoint } from "@/types";

export function AttendanceLineChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1F8460" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#1F8460" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E4DFD0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#26332F", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#26332F", fontSize: 12 }}
          width={32}
          domain={[60, 100]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2DED2",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(20,35,31,0.08)",
          }}
        />
        <Area
          type="monotone"
          dataKey="attendance"
          name="Attendance %"
          stroke="#1F8460"
          strokeWidth={2.5}
          fill="url(#attendanceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
