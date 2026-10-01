'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Wrench,
  FileCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { SeverityPill, RiskPill } from '../ui/StatusPill';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { useAurumStore } from '@/store/useStore';
import { AlertItem } from '@/types';

export const ActionCenter: React.FC = () => {
  const router = useRouter();
  const { alerts, acknowledgeAlert, schedulePM, addWorkOrder, updateContractStatus, addToast } =
    useAurumStore();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'risk' | 'asset'>('severity');

  // Modal states for action triggers
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<AlertItem | null>(null);
  const [actionModalType, setActionModalType] = useState<
    'inspect' | 'schedule_pm' | 'assign' | 'renew_contract' | null
  >(null);

  // Form states
  const [assignee, setAssignee] = useState('Marcus Vance');
  const [pmDate, setPmDate] = useState('2026-10-05');
  const [workOrderNotes, setWorkOrderNotes] = useState('');

  // Filter alerts by tab
  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');

  const filteredAlerts = activeAlerts.filter((alert) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'critical') return alert.severity === 'critical';
    if (activeTab === 'high') return alert.severity === 'high';
    if (activeTab === 'pm') return alert.category === 'pm';
    if (activeTab === 'contract') return alert.category === 'contract';
    return true;
  });

  // Sort alerts
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'severity') {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.severity] - order[a.severity];
    }
    if (sortBy === 'risk') {
      const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return order[b.riskLevel] - order[a.riskLevel];
    }
    return a.assetName.localeCompare(b.assetName);
  });

  const tabItems = [
    { id: 'all', label: 'All Actions', count: activeAlerts.length },
    {
      id: 'critical',
      label: 'Critical',
      count: activeAlerts.filter((a) => a.severity === 'critical').length,
    },
    {
      id: 'high',
      label: 'High Risk',
      count: activeAlerts.filter((a) => a.severity === 'high').length,
    },
    {
      id: 'pm',
      label: 'PM Overdue',
      count: activeAlerts.filter((a) => a.category === 'pm').length,
    },
    {
      id: 'contract',
      label: 'Contract Expiring',
      count: activeAlerts.filter((a) => a.category === 'contract').length,
    },
  ];

  const handleCtaClick = (alert: AlertItem) => {
    if (alert.ctaAction === 'inspect') {
      router.push(`/assets/${alert.assetId}`);
    } else if (alert.ctaAction === 'acknowledge') {
      acknowledgeAlert(alert.id);
    } else if (alert.ctaAction === 'schedule_pm') {
      setSelectedAlertForAction(alert);
      setActionModalType('schedule_pm');
    } else if (alert.ctaAction === 'assign') {
      setSelectedAlertForAction(alert);
      setActionModalType('assign');
    } else if (alert.ctaAction === 'renew_contract') {
      setSelectedAlertForAction(alert);
      setActionModalType('renew_contract');
    }
  };

  const handleConfirmSchedulePM = () => {
    if (!selectedAlertForAction) return;
    schedulePM({
      assetId: selectedAlertForAction.assetId,
      assetName: selectedAlertForAction.assetName,
      type: 'Emergency Overhaul & Calibration',
      engineer: assignee,
      engineerInitials: assignee
        .split(' ')
        .map((n) => n[0])
        .join(''),
      date: pmDate,
      status: 'upcoming',
      contractRequired: true,
      notes: `Triggered from Action Center: ${selectedAlertForAction.reason}`,
    });
    acknowledgeAlert(selectedAlertForAction.id);
    setActionModalType(null);
    setSelectedAlertForAction(null);
  };

  const handleConfirmAssignWorkOrder = () => {
    if (!selectedAlertForAction) return;
    addWorkOrder({
      assetId: selectedAlertForAction.assetId,
      assetName: selectedAlertForAction.assetName,
      type: 'Emergency',
      priority: selectedAlertForAction.severity,
      assignedEngineer: assignee,
      dueDate: pmDate,
      status: 'In Progress',
      description: `${selectedAlertForAction.title}: ${selectedAlertForAction.recommendation}. ${workOrderNotes}`,
    });
    acknowledgeAlert(selectedAlertForAction.id);
    setActionModalType(null);
    setSelectedAlertForAction(null);
  };

  const handleConfirmRenewContract = () => {
    if (!selectedAlertForAction) return;
    updateContractStatus(selectedAlertForAction.assetId, 'renewal_initiated');
    acknowledgeAlert(selectedAlertForAction.id);
    addToast(
      `Renewal package initiated for ${selectedAlertForAction.assetName}.`,
      'success'
    );
    setActionModalType(null);
    setSelectedAlertForAction(null);
  };

  const getBorderColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-rose-500 bg-rose-50/10';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/10';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/10';
      case 'low':
        return 'border-l-blue-500 bg-blue-50/10';
      default:
        return 'border-l-slate-400';
    }
  };

  return (
    <>
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <span>Operational Action Center</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Problem → Risk → Reason → Recommendation
              </span>
            </div>
          }
          subtitle="Real-time prioritized queue requiring operational intervention or engineering dispatch"
          action={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="severity">Severity</option>
                  <option value="risk">Risk Level</option>
                  <option value="asset">Asset Name</option>
                </select>
              </div>
            </div>
          }
        />

        {/* Tab Strip */}
        <div className="px-5 pt-2 bg-slate-50/60 border-b border-[#F1F5F9]">
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>

        {/* Action Items List */}
        <div className="divide-y divide-slate-100">
          {sortedAlerts.length > 0 ? (
            sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 sm:p-5 border-l-4 transition-colors hover:bg-slate-50/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${getBorderColor(
                  alert.severity
                )}`}
              >
                {/* Left: Problem & Asset */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityPill severity={alert.severity} />
                    <Link
                      href={
                        alert.category === 'contract'
                          ? `/contracts/${alert.assetId}`
                          : `/assets/${alert.assetId}`
                      }
                      className="font-mono text-xs font-bold text-slate-900 bg-slate-100 hover:bg-indigo-100 hover:text-[#4F46E5] px-2 py-0.5 rounded transition-colors"
                    >
                      {alert.assetId}
                    </Link>
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {alert.assetName}
                    </span>
                    <RiskPill risk={alert.riskLevel} />
                    {alert.status === 'acknowledged' && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Acknowledged
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Issue:</span>
                    <span>{alert.title}</span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="text-slate-600">{alert.readingSummary}</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                    <div className="flex items-start gap-1.5">
                      <span className="font-semibold text-slate-700 shrink-0">Reason:</span>
                      <span className="text-slate-600">{alert.reason}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-semibold text-indigo-700 shrink-0">
                        Recommendation:
                      </span>
                      <span className="text-slate-700 font-medium">
                        {alert.recommendation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: CTA Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Link
                    href={
                      alert.category === 'contract'
                        ? `/contracts/${alert.assetId}`
                        : `/assets/${alert.assetId}`
                    }
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </Link>

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
            <div className="p-8">
              <EmptyState
                icon="check"
                title="No Pending Operational Actions"
                description="All telemetry feeds are within normal tolerances and preventive maintenance schedules are up to date."
              />
            </div>
          )}
        </div>
      </Card>

      {/* Schedule PM Modal */}
      <Modal
        isOpen={actionModalType === 'schedule_pm'}
        onClose={() => setActionModalType(null)}
        title="Schedule Emergency Preventive Maintenance"
        subtitle={selectedAlertForAction?.assetName}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
            <strong>Reason:</strong> {selectedAlertForAction?.reason}
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assign Lead Service Engineer
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            >
              <option value="Marcus Vance">Marcus Vance (HVAC Specialist - Available Today)</option>
              <option value="Sara Lin">Sara Lin (Electrical & Automation)</option>
              <option value="Tariq Al-Mansoor">Tariq Al-Mansoor (Vibration Diagnostics)</option>
              <option value="Elena Gomez">Elena Gomez (Biomedical Engineer)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Execution Target Date</label>
            <input
              type="date"
              value={pmDate}
              onChange={(e) => setPmDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setActionModalType(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmSchedulePM}>
              Confirm & Dispatch PM
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Work Order Modal */}
      <Modal
        isOpen={actionModalType === 'assign'}
        onClose={() => setActionModalType(null)}
        title="Create & Assign Corrective Work Order"
        subtitle={selectedAlertForAction?.assetName}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Technician</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            >
              <option value="Marcus Vance">Marcus Vance (HVAC Specialist)</option>
              <option value="Sara Lin">Sara Lin (Electrical & Automation)</option>
              <option value="Tariq Al-Mansoor">Tariq Al-Mansoor (Mechanical Diagnostics)</option>
              <option value="Elena Gomez">Elena Gomez (Biomedical Lead)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Instructions & Scope</label>
            <textarea
              rows={3}
              value={workOrderNotes}
              onChange={(e) => setWorkOrderNotes(e.target.value)}
              placeholder="e.g., Isolate inlet valve, perform differential pressure purge and verify membrane flux rate..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setActionModalType(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmAssignWorkOrder}>
              Create Work Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Renew Contract Modal */}
      <Modal
        isOpen={actionModalType === 'renew_contract'}
        onClose={() => setActionModalType(null)}
        title="Initiate Contract Renewal Package"
        subtitle={selectedAlertForAction?.assetName}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            You are initiating the procurement renewal package for{' '}
            <strong>{selectedAlertForAction?.assetName}</strong>. This will notify the
            procurement officer and vendor representative.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="font-semibold text-slate-900">Recommended Contract Adjustments:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
              <li>Increase quarterly PM cadence from 4x to 6x annually</li>
              <li>Include mandatory 2-hour response SLA clause</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setActionModalType(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmRenewContract}>
              Initiate Renewal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
