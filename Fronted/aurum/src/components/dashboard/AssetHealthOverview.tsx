'use client';

import React from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useAurumStore } from '@/store/useStore';

export const AssetHealthOverview: React.FC = () => {
  const { assets } = useAurumStore();

  const healthyCount = assets.filter((a) => a.healthScore >= 75).length;
  const atRiskCount = assets.filter((a) => a.healthScore >= 50 && a.healthScore < 75).length;
  const criticalCount = assets.filter((a) => a.healthScore < 50).length;
  const total = assets.length || 1;

  const data = [
    { name: 'Healthy (≥75)', value: healthyCount, color: '#10B981', filter: 'healthy' },
    { name: 'At Risk (50–74)', value: atRiskCount, color: '#F59E0B', filter: 'at-risk' },
    { name: 'Critical (<50)', value: criticalCount, color: '#EF4444', filter: 'critical' },
  ];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title="Asset Health Portfolio"
        subtitle="Distribution across operational condition bands"
      />
      <CardContent className="space-y-4">
        {/* Donut Chart */}
        <div className="h-44 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#FFFFFF' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-800">{total}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Assets</span>
          </div>
        </div>

        {/* Breakdown Rows */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-slate-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">
                  {item.value} <span className="text-slate-400 font-normal">({Math.round((item.value / total) * 100)}%)</span>
                </span>
                <Link
                  href={`/assets?health=${item.filter}`}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
