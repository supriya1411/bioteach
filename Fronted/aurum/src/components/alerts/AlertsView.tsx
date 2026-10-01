'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  CheckCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { SeverityPill, RiskPill } from '../ui/StatusPill';
import { EmptyState } from '../ui/EmptyState';
import { useAurumStore } from '@/store/useStore';
import { AlertItem, Severity } from '@/types';

export const AlertsView: React.FC = () => {
  const router = useRouter();
  const { alerts, acknowledgeAlert, resolveAlert, acknowledgeAllAlerts } = useAurumStore();

  const [activeSeverity, setActiveSeverity] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (activeSeverity !== 'all' && alert.severity !== activeSeverity) return false;
    if (activeCategory !== 'all' && alert.category !== activeCategory) return false;
    return true;
  });

  const tabItems = [
    { id: 'all', label: 'All Alerts', count: alerts.length },
    {
      id: 'critical',
      label: 'Critical',
      count: alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
    },
    {
      id: 'high',
      label: 'High',
      count: alerts.filter((a) => a.severity === 'high' && a.status === 'active').length,
    },
    {
      id: 'medium',
      label: 'Medium',
      count: alerts.filter((a) => a.severity === 'medium' && a.status === 'active').length,
    },
    {
      id: 'low',
      label: 'Low',
      count: alerts.filter((a) => a.severity === 'low' && a.status === 'active').length,
    },
  ];

  const categoryFilters = [
    { id: 'all', label: 'All Categories' },
    { id: 'iot', label: 'IoT Telemetry' },
    { id: 'fault', label: 'Fault Signatures' },
    { id: 'pm', label: 'PM Maintenance' },
    { id: 'contract', label: 'Contract Expiry' },
  ];

  const handleCtaClick = (alert: AlertItem) => {
    if (alert.ctaAction === 'inspect') {
      router.push(`/assets/${alert.assetId}`);
    } else if (alert.ctaAction === 'renew_contract') {
      router.push(`/contracts/${alert.assetId}`);
    } else if (alert.ctaAction === 'schedule_pm') {
      router.push('/maintenance');
    } else if (alert.ctaAction === 'assign') {
      router.push('/maintenance');
    } else {
      acknowledgeAlert(alert.id);
    }
  };

  const getBorderColor = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-rose-500 bg-rose-50/15';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/15';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/15';
      default:
        return 'border-l-blue-500 bg-blue-50/15';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {categoryFilters.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#312E81] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={acknowledgeAllAlerts}
            icon={<CheckCheck className="w-3.5 h-3.5 text-slate-600" />}
          >
            Acknowledge All
          </Button>
        </div>
      </Card>

      {/* 2. Severity Tab Bar */}
      <Card className="shadow-xs overflow-hidden">
        <div className="px-5 pt-2 bg-slate-50 border-b border-slate-200">
          <Tabs tabs={tabItems} activeTab={activeSeverity} onChange={setActiveSeverity} />
        </div>

        {/* 3. Alert Cards Feed */}
        <div className="divide-y divide-slate-100">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 border-l-4 transition-all hover:bg-slate-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${getBorderColor(
                  alert.severity
                )}`}
              >
                {/* Left side problem breakdown */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityPill severity={alert.severity} />
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {alert.assetId}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{alert.assetName}</span>
                    <RiskPill risk={alert.riskLevel} />
                    <span className="text-[11px] text-slate-400 ml-auto lg:ml-2">
                      {alert.timestamp} ({alert.durationMinutes}m active)
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-mono">{alert.readingSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-700 block mb-0.5">Identified Reason:</span>
                      <span className="text-slate-600">{alert.reason}</span>
                    </div>
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                      <span className="font-bold text-indigo-900 block mb-0.5">
                        Recommended Engineering Action:
                      </span>
                      <span className="text-indigo-950 font-medium">{alert.recommendation}</span>
                    </div>
                  </div>
                </div>

                {/* Right side CTA actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Link
                    href={
                      alert.category === 'contract'
                        ? `/contracts/${alert.assetId}`
                        : `/assets/${alert.assetId}`
                    }
                  >
                    <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                      Inspect
                    </Button>
                  </Link>

                  {alert.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 px-2">Acknowledged</span>
                  )}

                  <Button
                    variant={alert.severity === 'critical' ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => handleCtaClick(alert)}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    {alert.ctaLabel}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12">
              <EmptyState
                icon="check"
                title="All Clear — No Active Alerts"
                description="No active alerts in this severity band. All operational parameters within normal limits."
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
