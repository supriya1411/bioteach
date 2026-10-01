'use client';

import React, { useState } from 'react';
import { ShieldCheck, Activity, RefreshCw, FileText, Cpu, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { mockSystemStatus } from '@/lib/mockData';
import { SystemStatusIndicator } from '@/types';

export const LiveSystemStatus: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<SystemStatusIndicator | null>(null);

  const getStatusIcon = (status: SystemStatusIndicator['status']) => {
    switch (status) {
      case 'Operational':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'Degraded':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'Down':
        return <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />;
    }
  };

  const getStatusBadge = (status: SystemStatusIndicator['status']) => {
    switch (status) {
      case 'Operational':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Degraded':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Down':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col justify-between">
        <CardHeader
          title="Live Platform Services"
          subtitle="Real-time ingestion pipelines & computational subsystems"
        />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockSystemStatus.map((sys, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedSystem(sys)}
                className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-800 truncate">{sys.name}</span>
                  {getStatusIcon(sys.status)}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                      sys.status
                    )}`}
                  >
                    {sys.status}
                  </span>
                  <span className="text-slate-400">{sys.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status Detail Modal */}
      <Modal
        isOpen={!!selectedSystem}
        onClose={() => setSelectedSystem(null)}
        title={selectedSystem?.name || 'System Status'}
        subtitle={`Status: ${selectedSystem?.status}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <p className="font-semibold text-slate-800">Operational Telemetry Details:</p>
            <p className="text-slate-600 leading-relaxed">{selectedSystem?.details}</p>
          </div>

          {selectedSystem?.estimatedResolution && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <span className="font-bold">Estimated Resolution: </span>
              {selectedSystem.estimatedResolution}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedSystem(null)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
