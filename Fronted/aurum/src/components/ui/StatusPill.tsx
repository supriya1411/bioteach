import React from 'react';
import { Severity, RiskLevel, IoTStatus, PMStatus } from '@/types';

export const SeverityPill: React.FC<{ severity: Severity; className?: string }> = ({
  severity,
  className = '',
}) => {
  const map: Record<Severity, { bg: string; text: string; border: string; label: string }> = {
    critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'CRITICAL' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'HIGH' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MEDIUM' },
    low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'LOW' },
  };
  const style = map[severity] || map.low;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {style.label}
    </span>
  );
};

export const RiskPill: React.FC<{ risk: RiskLevel; className?: string }> = ({
  risk,
  className = '',
}) => {
  const map: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    HIGH: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };
  const style = map[risk] || map.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {risk}
    </span>
  );
};

export const IoTPill: React.FC<{ status: IoTStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const map: Record<IoTStatus, { bg: string; text: string; border: string; label: string; dot: string }> = {
    online: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Live Online', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Warning', dot: 'bg-amber-500' },
    critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Critical', dot: 'bg-rose-500' },
    offline: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Offline', dot: 'bg-slate-400' },
    no_sensor: { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200', label: 'No Sensor', dot: 'bg-slate-300' },
  };
  const item = map[status] || map.no_sensor;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${item.bg} ${item.text} ${item.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

export const PMPill: React.FC<{ status: PMStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const map: Record<PMStatus, { bg: string; text: string; border: string; label: string }> = {
    ok: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'PM OK' },
    due: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'PM Due' },
    overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'PM Overdue' },
  };
  const item = map[status] || map.ok;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.bg} ${item.text} ${item.border} ${className}`}
    >
      {item.label}
    </span>
  );
};

export const HealthScoreBadge: React.FC<{ score: number; className?: string }> = ({
  score,
  className = '',
}) => {
  let style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score < 50) {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (score < 75) {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${style} ${className}`}
    >
      {score} <span className="text-[10px] font-normal opacity-70 ml-0.5">/100</span>
    </span>
  );
};
