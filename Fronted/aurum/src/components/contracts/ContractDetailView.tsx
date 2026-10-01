'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Calendar,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Download,
  Server,
  CheckCircle2,
  Clock,
  History,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { RiskPill, HealthScoreBadge } from '../ui/StatusPill';
import { Gauge } from '../ui/Gauge';
import { useAurumStore } from '@/store/useStore';
import { Contract } from '@/types';

interface ContractDetailViewProps {
  contractId: string;
}

export const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contractId }) => {
  const { contracts, assets, addToast } = useAurumStore();

  const contract = contracts.find((c) => c.id === contractId) || contracts[0];
  const coveredAssets = assets.filter((a) => contract.coveredAssets.includes(a.id));

  // Monthly breakdown mock
  const monthlyDelivery = [
    { month: 'May 2026', planned: 3, completed: 3, rate: '100%' },
    { month: 'Jun 2026', planned: 3, completed: 3, rate: '100%' },
    { month: 'Jul 2026', planned: 4, completed: 4, rate: '100%' },
    { month: 'Aug 2026', planned: 3, completed: 3, rate: '100%' },
    { month: 'Sep 2026', planned: 3, completed: 2, rate: '66%' },
    { month: 'Oct 2026', planned: 3, completed: 1, rate: '33% (In Progress)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Band */}
      <div className="flex items-center justify-between">
        <Link href="/contracts">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Contracts
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          onClick={() => addToast(`Downloading signed master agreement for ${contract.id}...`, 'info')}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Download Master Agreement
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded">
                {contract.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                {contract.type} Agreement
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Vendor: <strong className="text-slate-800">{contract.vendor}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {contract.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active Term: <strong>{contract.startDate}</strong> to <strong>{contract.endDate}</strong> • Annual Spend: <strong>${contract.value.toLocaleString()}</strong>
            </p>
          </div>

          {/* Days to Expiry Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right min-w-[200px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Renewal Window</span>
            <p
              className={`text-2xl font-black mt-0.5 ${
                contract.daysToExpiry < 0
                  ? 'text-rose-600'
                  : contract.daysToExpiry < 30
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {contract.daysToExpiry < 0
                ? `Lapsed (${Math.abs(contract.daysToExpiry)}d ago)`
                : `${contract.daysToExpiry} Days Remaining`}
            </p>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Status: {contract.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </Card>

      {/* Compliance Score Gauge & Renewal Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Gauge */}
        <Card className="p-6 flex flex-col justify-between items-center text-center">
          <CardHeader
            title="PM Delivery Compliance"
            subtitle="Contracted SLA maintenance fulfillment"
            className="w-full p-0 pb-3 border-none text-center"
          />
          <div className="my-2">
            <Gauge
              value={contract.complianceScore}
              size={130}
              strokeWidth={10}
              colorScheme="health"
              label={contract.complianceScore >= 80 ? 'SLA Met' : 'SLA Breach Risk'}
            />
          </div>
          <div className="w-full pt-3 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Agreed Cadence:</span>
            <strong className="text-slate-900">{contract.pmCadence}</strong>
          </div>
        </Card>

        {/* Renewal Risk Explanation (PRD Requirement: Score explained, not asserted) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Renewal Risk Assessment</h3>
              </div>
              <RiskPill risk={contract.renewalRisk} />
            </div>

            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-slate-900">Empirical Signals Explaining Risk Rating:</p>
              <p className="text-slate-700 leading-relaxed">{contract.renewalRiskReason}</p>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Days to Expiration</span>
                <p className="font-bold text-slate-800 mt-0.5">{contract.daysToExpiry} days</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Open Alarms on Covered Assets</span>
                <p className="font-bold text-rose-600 mt-0.5">2 Critical Alerts</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Historical Fix SLA</span>
                <p className="font-bold text-emerald-600 mt-0.5">94.2% on-time fix</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Procurement package authorized for Facilities Director.</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => addToast(`Initiated renewal workflow for ${contract.id}.`, 'success')}
            >
              Initiate Renewal Flow
            </Button>
          </div>
        </Card>
      </div>

      {/* Covered Assets Fleet */}
      <Card className="shadow-xs">
        <CardHeader
          title="Covered Equipment Asset Estate"
          subtitle="Physical assets under direct warranty and PM mandate in this agreement"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Current Health</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {coveredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{asset.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{asset.name}</td>
                  <td className="py-3 px-4">{asset.category}</td>
                  <td className="py-3 px-4 text-slate-500">{asset.location}</td>
                  <td className="py-3 px-4">
                    <HealthScoreBadge score={asset.healthScore} />
                  </td>
                  <td className="py-3 px-4">
                    <RiskPill risk={asset.riskLevel} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/assets/${asset.id}`}>
                      <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                        Inspect
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Monthly PM Cadence Table & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cadence */}
        <Card className="p-6">
          <CardHeader
            title="Monthly Service Delivery Log"
            subtitle="Contractual PM visits executed vs planned"
            className="p-0 pb-4 border-none"
          />
          <div className="divide-y divide-slate-100 text-xs">
            {monthlyDelivery.map((row, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="font-bold text-slate-800">{row.month}</span>
                <span className="text-slate-600">
                  {row.completed} of {row.planned} visits
                </span>
                <span className="font-mono font-bold text-indigo-700">{row.rate}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Contract Activity & Audit Log */}
        <Card className="p-6">
          <CardHeader
            title="Contract Lifecycle Audit Trail"
            subtitle="Historical timeline of negotiations, amendments, and signoffs"
            className="p-0 pb-4 border-none"
          />
          <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 pt-1 text-xs">
            {contract.activityLog.map((log, idx) => (
              <div key={idx} className="relative pl-5">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                <p className="font-bold text-slate-900">{log.action}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  By {log.user} • {log.date}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Document Vault */}
      <Card className="p-6">
        <CardHeader
          title="Executed Contract Documents & SLA Annexures"
          subtitle="Official legal agreements, rate schedules, and signed inspection reports"
          className="p-0 pb-4 border-none"
        />
        <div className="divide-y divide-slate-100">
          {contract.documents.map((doc) => (
            <div key={doc.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                  PDF
                </div>
                <div>
                  <p className="font-bold text-slate-900">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Uploaded: {doc.uploadDate} • Size: {doc.size}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => addToast(`Downloading ${doc.name}...`, 'info')}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
