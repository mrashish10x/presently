"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

function colorFor(v: number) {
  if (v >= 85) return "#1F8460";
  if (v >= 75) return "#D2953D";
  return "#C85B45";
}

export function ClassWiseBarChart({
  data,
}: {
  data: { label: string; attendance: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="#E4DFD0" />
        <XAxis
          type="number"
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#26332F", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          axisLine={false}
          tickLine={false}
          width={110}
          tick={{ fill: "#26332F", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "#F0ECE1" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2DED2",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(20,35,31,0.08)",
          }}
        />
        <Bar dataKey="attendance" name="Attendance %" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorFor(d.attendance)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
