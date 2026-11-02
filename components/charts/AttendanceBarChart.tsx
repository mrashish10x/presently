"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { WeeklyPoint } from "@/types";

export function AttendanceBarChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="#E4DFD0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#26332F", fontSize: 12 }}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#26332F", fontSize: 12 }} width={28} />
        <Tooltip
          cursor={{ fill: "#F0ECE1" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2DED2",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(20,35,31,0.08)",
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Bar dataKey="present" name="Present" fill="#1F8460" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="absent" name="Absent" fill="#C85B45" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
