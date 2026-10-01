'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useAurumStore } from '@/store/useStore';

export const ContractRenewalPipelineCard: React.FC = () => {
  const { contracts } = useAurumStore();

  const getPillColor = (days: number) => {
    if (days < 0) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (days < 14) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (days <= 30) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (days <= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <Card className="shadow-xs">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4F46E5]" />
            <span>Contract Renewal Pipeline (0–90 Days)</span>
          </div>
        }
        subtitle="AMC/CMC agreements approaching renewal, expiry, or renegotiation windows"
        action={
          <Link
            href="/contracts"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Contracts</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent>
        <div className="space-y-3">
          {/* Horizontal Timeline Bar */}
          <div className="relative pt-6 pb-2">
            <div className="h-2 bg-slate-100 rounded-full w-full relative">
              <div className="absolute left-0 top-0 bottom-0 w-1/6 bg-rose-200/80 rounded-l-full" title="0-14 days (Critical)" />
              <div className="absolute left-[16.6%] top-0 bottom-0 w-1/6 bg-orange-200/80" title="14-30 days (High)" />
              <div className="absolute left-[33.3%] top-0 bottom-0 w-1/3 bg-amber-200/80" title="30-60 days (Medium)" />
              <div className="absolute left-[66.6%] top-0 bottom-0 w-1/3 bg-emerald-200/80 rounded-r-full" title="60-90+ days (Safe)" />
            </div>

            {/* Scale markers */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
              <span>0d (Expiring)</span>
              <span>14d</span>
              <span>30d</span>
              <span>60d</span>
              <span>90d+</span>
            </div>
          </div>

          {/* Plotted Contract Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {contracts.map((c) => (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className={`p-3 rounded-xl border transition-all hover:shadow-sm ${getPillColor(
                  c.daysToExpiry
                )}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] font-bold uppercase">{c.id}</span>
                  <span className="text-[11px] font-extrabold">
                    {c.daysToExpiry < 0
                      ? `Lapsed ${Math.abs(c.daysToExpiry)}d ago`
                      : `${c.daysToExpiry} days left`}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5">
                  <span>{c.vendor}</span>
                  <span className="font-bold text-slate-900">${c.value.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
