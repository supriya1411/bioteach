'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, AlertOctagon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { HealthScoreBadge } from '../ui/StatusPill';
import { Button } from '../ui/Button';
import { useAurumStore } from '@/store/useStore';

export const HighRiskEquipmentTable: React.FC = () => {
  const { assets } = useAurumStore();

  const highRiskAssets = [...assets]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6);

  return (
    <Card className="shadow-xs">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>High-Risk Physical Equipment</span>
          </div>
        }
        subtitle="Priority assets ranked by composite Bayesian operational risk score"
        action={
          <Link
            href="/assets?filter=high-risk"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All ({assets.filter((a) => a.riskScore >= 50).length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 text-slate-500 font-semibold border-y border-slate-200/80">
            <tr>
              <th className="py-3 px-4">Asset ID</th>
              <th className="py-3 px-4">Equipment Name</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Health</th>
              <th className="py-3 px-4 min-w-[140px]">Risk Index</th>
              <th className="py-3 px-4">Last Fault</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {highRiskAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="hover:text-indigo-600 hover:underline"
                  >
                    {asset.id}
                  </Link>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {asset.name}
                  <p className="text-[11px] font-normal text-slate-500">{asset.category}</p>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {asset.location}
                  <p className="text-[10px] text-slate-400">{asset.floor}</p>
                </td>
                <td className="py-3 px-4">
                  <HealthScoreBadge score={asset.healthScore} />
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className={asset.riskScore >= 75 ? 'text-rose-600' : 'text-amber-600'}>
                        {asset.riskLevel}
                      </span>
                      <span>{asset.riskScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          asset.riskScore >= 75 ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${asset.riskScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    {asset.lastFaultCode}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{asset.lastFaultDate}</p>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/assets/${asset.id}`}>
                      <Button variant="outline" size="sm" icon={<Eye className="w-3 h-3" />}>
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
