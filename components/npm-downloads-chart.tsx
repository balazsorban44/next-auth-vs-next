"use client";

import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { getDownloads } from "./data";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: { next: Date; nextAuth: Date } }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const ratio = payload[0].value.toFixed(2);
    const nextDownloads = payload[0].payload.next.toLocaleString();
    const nextAuthDownloads = payload[0].payload.nextAuth.toLocaleString();

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-md shadow-md">
        <p className="font-semibold">{label}</p>
        <p className="text-sm">Next.js: {nextDownloads}</p>
        <p className="text-sm">NextAuth: {nextAuthDownloads}</p>
        <p className="text-sm font-semibold mt-1">Ratio: {ratio}%</p>
      </div>
    );
  }
  return null;
};

export default function Component() {
  const [isMounted, setIsMounted] = useState(false);

  const [data, setData] = useState<
    {
      date: string;
      next: number;
      nextAuth: number;
      ratio: number;
    }[]
  >([]);
  useEffect(() => {
    getDownloads(30, 4).then((downloads) => {
      setData(downloads);
    });
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full max-w-[920px] mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2">
        NextAuth.js to Next.js Download Ratio
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Monthly comparison of NextAuth.js downloads as a percentage of Next.js
        downloads
      </p>
      <div className="w-full h-[400px] sm:h-[500px] md:h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              domain={[0, "dataMax + 5"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ratio"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorRatio)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
