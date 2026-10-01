'use client';

import React from 'react';
import Link from 'next/link';
import {
  Server,
  AlertOctagon,
  AlertTriangle,
  Clock,
  FileClock,
  HeartPulse,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useAurumStore } from '@/store/useStore';

export const KpiStrip: React.FC = () => {
  const { assets, alerts, pmSchedules, contracts } = useAurumStore();

  const totalAssetsCount = assets.length;
  const highRiskAssetsCount = assets.filter((a) => a.riskScore >= 80).length;
  const criticalAlertsCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  ).length;
  const pmDueCount = pmSchedules.filter(
    (pm) => pm.status === 'due_today' || pm.status === 'overdue' || pm.status === 'upcoming'
  ).length;
  const expiringContractsCount = contracts.filter(
    (c) => c.daysToExpiry <= 30 && c.daysToExpiry >= 0
  ).length;

  const avgHealthScore = Math.round(
    assets.reduce((sum, a) => sum + a.healthScore, 0) / (assets.length || 1)
  );

  const kpis = [
    {
      label: 'Total Assets',
      value: totalAssetsCount,
      delta: '+2 vs last month',
      trend: 'up',
      icon: Server,
      accent: 'text-slate-700',
      bgIcon: 'bg-slate-100 text-slate-600',
      href: '/assets',
    },
    {
      label: 'High-Risk Assets',
      value: highRiskAssetsCount,
      delta: '3 require inspection',
      trend: 'up',
      icon: AlertOctagon,
      accent: 'text-rose-600',
      bgIcon: 'bg-rose-50 text-rose-600 border border-rose-100',
      href: '/assets?filter=high-risk',
    },
    {
      label: 'Critical Alerts',
      value: criticalAlertsCount,
      delta: 'Active anomalies',
      trend: 'down',
      icon: AlertTriangle,
      accent: 'text-rose-600',
      bgIcon: 'bg-rose-50 text-rose-600 border border-rose-100',
      href: '/alerts?severity=critical',
    },
    {
      label: 'PM Due (7 days)',
      value: pmDueCount,
      delta: '2 overdue',
      trend: 'up',
      icon: Clock,
      accent: 'text-amber-600',
      bgIcon: 'bg-amber-50 text-amber-600 border border-amber-100',
      href: '/maintenance',
    },
    {
      label: 'Expiring Contracts',
      value: expiringContractsCount,
      delta: 'Within 30 days',
      trend: 'up',
      icon: FileClock,
      accent: 'text-amber-600',
      bgIcon: 'bg-amber-50 text-amber-600 border border-amber-100',
      href: '/contracts',
    },
    {
      label: 'Avg Health Score',
      value: `${avgHealthScore}%`,
      delta: '+1.4% vs Q2',
      trend: 'up',
      icon: HeartPulse,
      accent: avgHealthScore >= 75 ? 'text-emerald-600' : 'text-amber-600',
      bgIcon: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      href: '/reports',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Link key={idx} href={kpi.href} className="group">
            <Card
              hoverable
              className="p-4 transition-all duration-200 hover:-translate-y-0.5 border-[#E2E8F0] h-full flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#4F46E5] transition-colors truncate">
                  {kpi.label}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kpi.bgIcon}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className={`text-2xl font-black tracking-tight ${kpi.accent}`}>
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-[#64748B]">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-slate-400" />
                  )}
                  <span className="truncate">{kpi.delta}</span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};
