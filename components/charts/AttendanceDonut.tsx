"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function AttendanceDonut({
  present,
  absent,
  late = 0,
  size = 160,
}: {
  present: number;
  absent: number;
  late?: number;
  size?: number;
}) {
  const data = [
    { name: "Present", value: present, color: "#1F8460" },
    { name: "Late", value: late, color: "#D2953D" },
    { name: "Absent", value: absent, color: "#C85B45" },
  ].filter((d) => d.value > 0);

  const total = present + absent + late;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E2DED2",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display text-xl font-semibold text-ink">
          {total ? Math.round(((present + late) / total) * 100) : 0}%
        </span>
        <span className="text-[10px] text-ink-soft/50 uppercase tracking-wide">Present</span>
      </div>
    </div>
  );
}
