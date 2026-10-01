'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useAurumStore } from '@/store/useStore';

export const AssetsByLocation: React.FC = () => {
  const { assets } = useAurumStore();

  // Aggregate assets by location
  const locationMap: Record<string, { healthy: number; atRisk: number; critical: number; total: number; avgHealth: number }> = {};

  assets.forEach((asset) => {
    const loc = asset.location.split(',')[0].trim();
    if (!locationMap[loc]) {
      locationMap[loc] = { healthy: 0, atRisk: 0, critical: 0, total: 0, avgHealth: 0 };
    }
    locationMap[loc].total += 1;
    locationMap[loc].avgHealth += asset.healthScore;
    if (asset.healthScore >= 75) locationMap[loc].healthy += 1;
    else if (asset.healthScore >= 50) locationMap[loc].atRisk += 1;
    else locationMap[loc].critical += 1;
  });

  const chartData = Object.entries(locationMap)
    .map(([location, stats]) => ({
      location,
      total: stats.total,
      healthy: stats.healthy,
      atRisk: stats.atRisk,
      critical: stats.critical,
      avgHealth: Math.round(stats.avgHealth / stats.total),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const getBarColor = (avgHealth: number) => {
    if (avgHealth >= 75) return '#10B981';
    if (avgHealth >= 55) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title="Assets by Estate Location"
        subtitle="Distribution and dominant health band per facility zone"
      />
      <CardContent>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                type="category"
                dataKey="location"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                        <p className="font-bold border-b border-slate-700 pb-1">{data.location}</p>
                        <p>Total Assets: <span className="font-semibold">{data.total}</span></p>
                        <p className="text-emerald-400">Healthy: {data.healthy}</p>
                        <p className="text-amber-400">At Risk: {data.atRisk}</p>
                        <p className="text-rose-400">Critical: {data.critical}</p>
                        <p className="pt-1 text-slate-300">Avg Health: {data.avgHealth}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.avgHealth)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
