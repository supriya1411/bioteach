'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SeverityPill, RiskPill } from '../ui/StatusPill';
import { Gauge } from '../ui/Gauge';
import { useAurumStore } from '@/store/useStore';
import { Contract, ContractStatus } from '@/types';

export const ContractsView: React.FC = () => {
  const { contracts, updateContractStatus, addToast } = useAurumStore();

  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');

  const totalActive = contracts.filter((c) => c.status === 'active').length;
  const expiringUnder30 = contracts.filter((c) => c.daysToExpiry <= 30 && c.daysToExpiry >= 0).length;
  const criticalExpiring = contracts.filter((c) => c.daysToExpiry < 14);
  const avgCompliance = Math.round(
    contracts.reduce((sum, c) => sum + c.complianceScore, 0) / contracts.length
  );
  const contractsAtRiskCount = contracts.filter((c) => c.renewalRisk === 'HIGH').length;

  const filteredContracts = contracts.filter((c) => {
    if (filterType !== 'All' && c.type !== filterType) return false;
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    return true;
  });

  const kanbanColumns: { id: ContractStatus; title: string; color: string }[] = [
    { id: 'active', title: 'Active & In Good Standing', color: 'border-t-emerald-500' },
    { id: 'renewal_initiated', title: 'Renewal Initiated', color: 'border-t-indigo-500' },
    { id: 'under_review', title: 'Under SLA / Price Review', color: 'border-t-amber-500' },
    { id: 'lapsed', title: 'Lapsed / Expired', color: 'border-t-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Expiring Contracts Alert Banner (<14 Days) */}
      {criticalExpiring.length > 0 && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-950 text-sm">
                Critical Renewal Alert: {criticalExpiring.length} contract(s) expire within 14 days
              </p>
              <p className="text-rose-800 mt-0.5">
                {criticalExpiring.map((c) => `${c.name} (${c.daysToExpiry}d left)`).join(', ')}
              </p>
            </div>
          </div>
          <Link href={`/contracts/${criticalExpiring[0].id}`}>
            <Button variant="danger" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} iconPosition="right">
              Review Renewal Now
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Total Active Agreements</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{contracts.length}</p>
          <span className="text-[11px] text-indigo-600 font-semibold">$895,000 portfolio value</span>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/20">
          <p className="text-xs font-semibold text-amber-800">Expiring &lt;30 Days</p>
          <p className="text-2xl font-black text-amber-700 mt-0.5">{expiringUnder30}</p>
          <span className="text-[11px] text-amber-600 font-semibold">2 pending SLA negotiations</span>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <p className="text-xs font-semibold text-emerald-800">Avg Compliance Score</p>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">{avgCompliance}%</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Contractual PM delivery</span>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/30">
          <p className="text-xs font-semibold text-rose-800">Agreements at Risk</p>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{contractsAtRiskCount}</p>
          <span className="text-[11px] text-rose-600 font-semibold">High risk renewal scores</span>
        </Card>
      </div>

      {/* 3. Toolbar & View Toggle */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Contract Types</option>
            <option value="AMC">Annual Maintenance Contract (AMC)</option>
            <option value="CMC">Comprehensive Maintenance (CMC)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="renewal_initiated">Renewal Initiated</option>
            <option value="under_review">Under Review</option>
            <option value="lapsed">Lapsed</option>
          </select>
        </div>

        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'table' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
            }`}
          >
            Directory Table
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'pipeline' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
            }`}
          >
            Renewal Pipeline Kanban
          </button>
        </div>
      </Card>

      {/* 4. Table View or Pipeline Kanban */}
      {viewMode === 'table' ? (
        <Card className="shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contract ID</th>
                  <th className="py-3 px-4">Agreement Name</th>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Assets Covered</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Compliance</th>
                  <th className="py-3 px-4">Renewal Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link href={`/contracts/${contract.id}`} className="hover:text-indigo-600 hover:underline">
                        {contract.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <Link href={`/contracts/${contract.id}`} className="hover:text-indigo-600">
                        {contract.name}
                      </Link>
                      <p className="text-[11px] font-normal text-slate-500">{contract.pmCadence}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{contract.vendor}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {contract.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {contract.coveredAssets.length} Assets
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{contract.endDate}</span>
                      <span className={`block text-[10px] font-bold ${contract.daysToExpiry < 0 ? 'text-rose-600' : contract.daysToExpiry < 30 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {contract.daysToExpiry < 0 ? `Lapsed ${Math.abs(contract.daysToExpiry)}d ago` : `${contract.daysToExpiry}d left`}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${contract.value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${contract.complianceScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {contract.complianceScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskPill risk={contract.renewalRisk} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {contract.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/contracts/${contract.id}`}>
                        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colContracts = contracts.filter((c) => c.status === col.id);
            return (
              <div key={col.id} className="space-y-3">
                <div className={`p-3 bg-slate-100 rounded-xl border-t-4 ${col.color} flex items-center justify-between`}>
                  <h4 className="text-xs font-bold text-slate-800">{col.title}</h4>
                  <span className="px-2 py-0.5 bg-white text-slate-700 text-[11px] font-bold rounded-full shadow-2xs">
                    {colContracts.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {colContracts.map((c) => (
                    <Card key={c.id} hoverable className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {c.id}
                        </span>
                        <RiskPill risk={c.renewalRisk} />
                      </div>

                      <div>
                        <Link href={`/contracts/${c.id}`} className="font-bold text-xs text-slate-900 hover:text-indigo-600 block">
                          {c.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.vendor}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                        <span>Expiry: <strong>{c.endDate}</strong></span>
                        <span className="font-bold text-slate-900">${c.value.toLocaleString()}</span>
                      </div>

                      {/* Quick Status Shift */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <select
                          value={c.status}
                          onChange={(e) => updateContractStatus(c.id, e.target.value as ContractStatus)}
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="renewal_initiated">Renewal Initiated</option>
                          <option value="under_review">Under Review</option>
                          <option value="lapsed">Lapsed</option>
                        </select>

                        <Link href={`/contracts/${c.id}`} className="text-indigo-600 hover:underline text-[11px] font-semibold flex items-center gap-0.5">
                          <span>Audit</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
