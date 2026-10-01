'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useAurumStore } from '@/store/useStore';

export const TopFaultsCard: React.FC = () => {
  const { faults } = useAurumStore();

  const topFaults = [...faults].sort((a, b) => b.occurrences - a.occurrences).slice(0, 5);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />;
    if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title="Top Fault Codes (Last 30 Days)"
        subtitle="Ranked recurrence and historical incident velocity"
        action={
          <Link
            href="/faults"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent>
        <div className="divide-y divide-slate-100">
          {topFaults.map((fault, idx) => (
            <div key={fault.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                  {fault.code}
                </span>
                <span className="text-slate-700 truncate font-medium">{fault.description}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-slate-900">{fault.occurrences} hits</span>
                <div className="flex items-center" title={`Trend: ${fault.trend}`}>
                  {getTrendIcon(fault.trend)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
