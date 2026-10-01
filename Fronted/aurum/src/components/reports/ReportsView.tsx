'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  Download,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { mockReports } from '@/lib/mockData';
import { useAurumStore } from '@/store/useStore';
import { ReportItem } from '@/types';

export const ReportsView: React.FC = () => {
  const { addToast } = useAurumStore();
  const [reportsList, setReportsList] = useState<ReportItem[]>(mockReports);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ReportItem['type']>('Executive Asset Risk');
  const [newPeriod, setNewPeriod] = useState('October 2026');

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: ReportItem = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      title: newTitle || `${newType} — ${newPeriod}`,
      type: newType,
      period: newPeriod,
      generatedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Ready',
      author: 'David Ross (Operations Director)',
      fileSize: '3.4 MB',
      summary: `Automated ${newType} generated for compliance review and executive audit verification.`,
      metrics: [
        { label: 'Estate Assets Covered', value: 12 },
        { label: 'Audit Compliance Score', value: '94%' },
        { label: 'Identified Mitigations', value: 3 },
      ],
    };

    setReportsList([newReport, ...reportsList]);
    addToast(`Report "${newReport.title}" generated successfully.`, 'success');
    setIsGenerateModalOpen(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">Executive & Audit Reports</h3>
          <p className="text-xs text-slate-500">Certified compliance documents, health audits, and telemetry logs</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsGenerateModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Generate New Report
        </Button>
      </Card>

      {/* 2. Audit Readiness Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 uppercase">Audit Readiness Index</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">92% Ready</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">All regulatory PM reports signed and archived</p>
        </Card>

        <Card className="p-4 border-indigo-200 bg-indigo-50/30">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-800 uppercase">Certified PM Reports</span>
          </div>
          <p className="text-2xl font-black text-indigo-700">26 Reports</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Cryptographically signed by certified technicians</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase">Next Scheduled Audit</span>
          </div>
          <p className="text-2xl font-black text-slate-800">Q4 Joint Comm.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Scheduled for November 15, 2026</p>
        </Card>
      </div>

      {/* 3. Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((report) => (
          <Card key={report.id} hoverable className="p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {report.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {report.status}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 leading-tight">{report.title}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Type: <strong>{report.type}</strong> • Period: {report.period}
              </p>
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {report.summary}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
                {report.metrics.map((m, idx) => (
                  <div key={idx} className="text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">{m.label}</span>
                    <span className="font-extrabold text-xs text-slate-800">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Author: <strong className="text-slate-700">{report.author}</strong> ({report.fileSize})</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => addToast(`Downloading PDF for ${report.id}...`, 'info')}
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Operational Intelligence Report"
        subtitle="Compile automated executive analytics, compliance audits, or telemetry logs"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Report Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. October 2026 Dialysis & Cleanroom Compliance Review"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Report Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              >
                <option value="Executive Asset Risk">Executive Asset Risk</option>
                <option value="Contract Compliance Audit">Contract Compliance Audit</option>
                <option value="IoT Anomaly Summary">IoT Anomaly Summary</option>
                <option value="Maintenance Monthly Review">Maintenance Monthly Review</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Period</label>
              <select
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              >
                <option value="October 2026">October 2026 (MTD)</option>
                <option value="Q3 2026">Q3 2026 Full Quarter</option>
                <option value="Last 30 Days">Last 30 Rolling Days</option>
                <option value="Year-to-Date 2026">Year-to-Date 2026</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Included Audit Artifacts:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Asset condition scores & Bayesian risk indexes</li>
              <li>IoT telemetry excursions & alarm durations</li>
              <li>Vendor PM fulfillment & contract renewal milestones</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Compile & Generate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
