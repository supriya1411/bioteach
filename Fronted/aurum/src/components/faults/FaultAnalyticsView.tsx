'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SeverityPill } from '../ui/StatusPill';
import { Drawer } from '../ui/Drawer';
import { useAurumStore } from '@/store/useStore';
import { mockMTBFData } from '@/lib/mockData';
import { FaultCodeAnalytics } from '@/types';

export const FaultAnalyticsView: React.FC = () => {
  const {
    faults,
    selectedFaultCode,
    setSelectedFaultCode,
    addToast,
  } = useAurumStore();

  const [frequencyToggle, setFrequencyToggle] = useState<'count' | 'assets'>('count');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Drawer state
  const isDrawerOpen = !!selectedFaultCode;

  // Filter faults
  const filteredFaults = faults.filter((f) => {
    if (selectedSeverity !== 'All' && f.severity !== selectedSeverity) return false;
    return true;
  });

  const totalFaultsCount = faults.reduce((sum, f) => sum + f.occurrences, 0);
  const uniqueCodesCount = faults.length;
  const avgMTBFDays = Math.round(
    mockMTBFData.reduce((sum, m) => sum + m.mtbfDays, 0) / mockMTBFData.length
  );
  const mostAffected = 'EQ-204 (Centrifugal Chiller A)';

  // Chart data for frequency
  const frequencyChartData = filteredFaults.map((f) => ({
    code: f.code,
    description: f.description,
    value: frequencyToggle === 'count' ? f.occurrences : f.affectedAssetsCount,
    severity: f.severity,
  }));

  // Trend data over the month
  const trendData = [
    { day: 'Sep 01', faults: 2 },
    { day: 'Sep 05', faults: 3 },
    { day: 'Sep 10', faults: 1 },
    { day: 'Sep 14', faults: 5 }, // spike
    { day: 'Sep 18', faults: 4 },
    { day: 'Sep 22', faults: 6 }, // spike
    { day: 'Sep 26', faults: 3 },
    { day: 'Sep 28', faults: 7 }, // major spike
    { day: 'Oct 01', faults: 4 },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F97316';
      case 'medium':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const handleExportCSV = (fault: FaultCodeAnalytics) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Instance ID,Date,Asset ID,Asset Name,Location,Severity,Resolution Hours,Resolution Summary,Engineer']
        .concat(
          fault.instances.map(
            (i) =>
              `"${i.id}","${i.date}","${i.assetId}","${i.assetName}","${i.location}","${i.severity}","${i.resolutionTimeHours}","${i.resolutionSummary.replace(/"/g, '""')}","${i.engineer}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fault_${fault.code}_Instances_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported CSV for fault ${fault.code}.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Total Recorded Faults</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{totalFaultsCount}</p>
          <span className="text-[11px] text-rose-600 font-semibold">+18% vs prior 30d</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Unique Fault Signatures</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{uniqueCodesCount}</p>
          <span className="text-[11px] text-slate-500 font-semibold">Normalized failure taxonomy</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Estate Avg MTBF</p>
          <p className="text-2xl font-black text-indigo-700 mt-0.5">{avgMTBFDays} Days</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Mean Time Between Failures</span>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/20">
          <p className="text-xs font-semibold text-rose-800">Most Recurrent Equipment</p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">{mostAffected}</p>
          <span className="text-[11px] text-rose-600 font-semibold">14 total incident hits</span>
        </Card>
      </div>

      {/* 2. Charts Row: Frequency & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fault Frequency Chart */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Fault Code Frequency</h3>
              <p className="text-xs text-slate-500">Ranked occurrence distribution by severity band</p>
            </div>

            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setFrequencyToggle('count')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  frequencyToggle === 'count' ? 'bg-white shadow-2xs text-[#4F46E5]' : 'text-slate-500'
                }`}
              >
                By Incident Count
              </button>
              <button
                onClick={() => setFrequencyToggle('assets')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  frequencyToggle === 'assets' ? 'bg-white shadow-2xs text-[#4F46E5]' : 'text-slate-500'
                }`}
              >
                By Affected Assets
              </button>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1">{data.code} — {data.description}</p>
                          <p>
                            {frequencyToggle === 'count' ? 'Total Occurrences:' : 'Assets Affected:'}{' '}
                            <span className="font-bold">{data.value}</span>
                          </p>
                          <p className="text-amber-400 capitalize">Severity: {data.severity}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {frequencyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Fault Trends Over Time */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Incident Velocity & Spikes</h3>
              <p className="text-xs text-slate-500">Daily fault events plotted across the rolling 30-day window</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Spike Flagged on Sep 28
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="faults"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#EF4444' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 3. Recurring Faults Table (Recurrence >= 3 Highlighted) */}
      <Card className="shadow-xs">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Recurring Fault Code Directory</span>
            </div>
          }
          subtitle="Highlighted rows signify high recurrence pattern (≥3 occurrences in 30 days)"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fault Code</th>
                <th className="py-3 px-4">Normalized Description</th>
                <th className="py-3 px-4">Occurrences</th>
                <th className="py-3 px-4">Affected Assets</th>
                <th className="py-3 px-4">Avg MTTR</th>
                <th className="py-3 px-4">First Seen</th>
                <th className="py-3 px-4">Last Seen</th>
                <th className="py-3 px-4">Trend</th>
                <th className="py-3 px-4 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {faults.map((fault) => {
                const isHighRecurrence = fault.occurrences >= 3;
                return (
                  <tr
                    key={fault.id}
                    className={`transition-colors ${
                      isHighRecurrence ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => setSelectedFaultCode(fault)}
                        className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                      >
                        <span
                          className={`px-2 py-0.5 rounded ${
                            fault.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {fault.code}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {fault.description}
                      {isHighRecurrence && (
                        <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Recurrent (≥3)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {fault.occurrences} hits
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {fault.affectedAssets.map((aId) => (
                          <Link
                            key={aId}
                            href={`/assets/${aId}`}
                            className="font-mono text-[10px] bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 px-1.5 py-0.5 rounded font-semibold text-slate-700"
                          >
                            {aId}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {fault.avgResolutionTimeHours}h
                    </td>
                    <td className="py-3 px-4 text-slate-500">{fault.firstSeen}</td>
                    <td className="py-3 px-4 text-slate-500">{fault.lastSeen}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-[11px]">
                        {fault.trend === 'up' ? (
                          <span className="text-rose-600 flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Up
                          </span>
                        ) : fault.trend === 'down' ? (
                          <span className="text-emerald-600 flex items-center">
                            <ArrowDownRight className="w-3.5 h-3.5" /> Down
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center">
                            <Minus className="w-3.5 h-3.5" /> Stable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFaultCode(fault)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Instances
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. MTBF Panel & Root-Cause Co-occurrence Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MTBF Category Bar Chart */}
        <Card className="p-6">
          <CardHeader
            title="MTBF by Asset Category (Days)"
            subtitle="Benchmark target comparison vs actual operating reliability"
            className="p-0 pb-4 border-none"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMTBFData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }} width={110} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1">{data.category}</p>
                          <p>Current MTBF: <span className="font-bold text-emerald-400">{data.mtbfDays} Days</span></p>
                          <p>Target Benchmark: <span>{data.benchmarkDays} Days</span></p>
                          <p className="text-[11px] text-slate-300 pt-1">Primary Driver: {data.drivers}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mtbfDays" radius={[0, 4, 4, 0]}>
                  {mockMTBFData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.mtbfDays < 60 ? '#EF4444' : entry.mtbfDays < 120 ? '#F59E0B' : '#10B981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Evidence Correlation / Root-Cause Matrix */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Fault Co-occurrence & Signal Evidence</span>
                </div>
              }
              subtitle="Observed multi-fault co-occurrences (Evidence signals without unwarranted causal assertions)"
              className="p-0 pb-4 border-none"
            />

            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-900">E-204 & V-88 Co-occurrence</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
                    71% Correlation
                  </span>
                </div>
                <p className="text-slate-700">
                  Thermal discharge overheat (E-204) and harmonic vibration (V-88) co-occur within 4 hours in 71% of Chiller EQ-204 incidents.
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-900">F-301 & P-109 Co-occurrence</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
                    65% Correlation
                  </span>
                </div>
                <p className="text-slate-700">
                  RO differential pressure saturation (F-301) coincides with pressure variation (P-109) during heavy morning clinical wash cycles.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">T-402 & E-204 Co-occurrence</span>
                  <span className="font-extrabold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full text-[11px]">
                    43% Correlation
                  </span>
                </div>
                <p className="text-slate-600">
                  Cryogenic shield temperature drift co-occurs during central chiller water loop maintenance periods.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Note: Co-occurrence patterns represent observed statistical correlations for engineering review.
          </p>
        </Card>
      </div>

      {/* 5. Fault Detail Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setSelectedFaultCode(null)}
        title={`Fault Drilldown: ${selectedFaultCode?.code}`}
        subtitle={selectedFaultCode?.description}
        width="xl"
      >
        {selectedFaultCode && (
          <div className="space-y-6 text-xs">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold">Total Logged Instances:</span>{' '}
                <strong className="text-slate-900">{selectedFaultCode.instances.length}</strong>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleExportCSV(selectedFaultCode)}
              >
                Export Instances CSV
              </Button>
            </div>

            {/* Instances list */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Historical Incident Log
              </h4>

              {selectedFaultCode.instances.map((inst) => (
                <div
                  key={inst.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{inst.id}</span>
                      <SeverityPill severity={inst.severity} />
                    </div>
                    <span className="text-[11px] text-slate-500">{inst.date}</span>
                  </div>

                  <div>
                    <Link
                      href={`/assets/${inst.assetId}`}
                      className="font-bold text-indigo-700 hover:underline"
                    >
                      {inst.assetName} ({inst.assetId})
                    </Link>
                    <p className="text-[11px] text-slate-500">{inst.location}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-0.5">Resolution Applied:</p>
                    <p>{inst.resolutionSummary}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Lead Tech: <strong className="text-slate-800">{inst.engineer}</strong></span>
                    <span>Fix Duration: <strong className="text-slate-800">{inst.resolutionTimeHours}h</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
