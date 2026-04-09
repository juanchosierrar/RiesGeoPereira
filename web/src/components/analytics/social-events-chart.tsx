"use client";

import React from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
  title: string;
  data: { name: string; value: number }[];
  type?: "area" | "bar";
  color?: string;
}

export function SocialEventsChart({ title, data, type = "area", color = "#3b82f6" }: ChartProps) {
  return (
    <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888818" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "8px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888818" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "8px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
