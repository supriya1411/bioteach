'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Calendar as CalendarIcon,
  List,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  User,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle,
  FileCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { SeverityPill, PMPill } from '../ui/StatusPill';
import { Modal } from '../ui/Modal';
import { Drawer } from '../ui/Drawer';
import { useAurumStore } from '@/store/useStore';
import { PMScheduleEvent, WorkOrder } from '@/types';

export const MaintenanceView: React.FC = () => {
  const {
    pmSchedules,
    workOrders,
    engineers,
    assets,
    addWorkOrder,
    updateWorkOrderStatus,
    schedulePM,
    addToast,
  } = useAurumStore();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [workOrderTab, setWorkOrderTab] = useState<string>('all');

  // Modals & Drawers
  const [isCreateWoOpen, setIsCreateWoOpen] = useState(false);
  const [selectedPmForDetail, setSelectedPmForDetail] = useState<PMScheduleEvent | null>(null);
  const [selectedWoForDetail, setSelectedWoForDetail] = useState<WorkOrder | null>(null);

  // Form states for creating Work Order
  const [newWoAssetId, setNewWoAssetId] = useState(assets[0]?.id || 'EQ-204');
  const [newWoType, setNewWoType] = useState<WorkOrder['type']>('Preventive');
  const [newWoPriority, setNewWoPriority] = useState<WorkOrder['priority']>('medium');
  const [newWoEngineer, setNewWoEngineer] = useState(engineers[0]?.name || 'Marcus Vance');
  const [newWoDueDate, setNewWoDueDate] = useState('2026-10-08');
  const [newWoDescription, setNewWoDescription] = useState('');

  // Top KPIs
  const completedPMsCount = pmSchedules.filter((p) => p.status === 'completed').length;
  const overduePMsCount = pmSchedules.filter((p) => p.status === 'overdue').length;
  const plannedPMsCount = pmSchedules.length;
  const complianceRate = Math.round((completedPMsCount / (completedPMsCount + overduePMsCount || 1)) * 100);

  // Overdue PMs sorted
  const overdueList = pmSchedules
    .filter((p) => p.status === 'overdue')
    .sort((a, b) => a.date.localeCompare(b.date));

  // Filter Work Orders
  const filteredWorkOrders = workOrders.filter((w) => {
    if (workOrderTab === 'all') return true;
    return w.status.toLowerCase().replace(' ', '_') === workOrderTab;
  });

  const woTabs = [
    { id: 'all', label: 'All Orders', count: workOrders.length },
    {
      id: 'open',
      label: 'Open',
      count: workOrders.filter((w) => w.status === 'Open').length,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      count: workOrders.filter((w) => w.status === 'In Progress').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: workOrders.filter((w) => w.status === 'Completed').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: workOrders.filter((w) => w.status === 'Cancelled').length,
    },
  ];

  const handleCreateWorkOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find((a) => a.id === newWoAssetId);
    addWorkOrder({
      assetId: newWoAssetId,
      assetName: targetAsset?.name || 'Asset Equipment',
      type: newWoType,
      priority: newWoPriority,
      assignedEngineer: newWoEngineer,
      dueDate: newWoDueDate,
      status: 'Open',
      description: newWoDescription || `${newWoType} service for ${targetAsset?.name}`,
    });
    setIsCreateWoOpen(false);
    setNewWoDescription('');
  };

  // Cadence compliance chart data
  const complianceMonthlyData = [
    { month: 'May', compliant: 28, late: 4, missed: 1 },
    { month: 'Jun', compliant: 30, late: 3, missed: 0 },
    { month: 'Jul', compliant: 32, late: 5, missed: 2 },
    { month: 'Aug', compliant: 31, late: 4, missed: 1 },
    { month: 'Sep', compliant: 26, late: 6, missed: 2 },
    { month: 'Oct (Est)', compliant: 29, late: 3, missed: 1 },
  ];

  // Calendar dates mock grid (October 2026)
  const calendarDays = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;
    const events = pmSchedules.filter((p) => p.date === dateStr || (p.status === 'overdue' && dayNum === 1));
    return { dayNum, dateStr, events };
  });

  const getStatusColorClass = (status: PMScheduleEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'due_today':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'overdue':
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-semibold text-slate-500">PMs This Month</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900">{plannedPMsCount}</span>
            <span className="text-xs text-slate-500">Planned ({completedPMsCount} Done)</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">82% on-track target</span>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <p className="text-xs font-semibold text-emerald-800">Compliance Rate</p>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">{complianceRate}%</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Contractual SLA standard: 80%</span>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/30">
          <p className="text-xs font-semibold text-rose-800">Overdue PM Tasks</p>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{overduePMsCount}</p>
          <span className="text-[11px] text-rose-600 font-semibold">Immediate dispatch required</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Engineers Deployed</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{engineers.length}</p>
          <span className="text-[11px] text-indigo-600 font-semibold">10 active work assignments</span>
        </Card>
      </div>

      {/* 2. PM Calendar & Schedule View */}
      <Card className="p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Preventive Maintenance Schedule</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">October 2026 Planned Operations Calendar</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Upcoming
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Due Today
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue
              </span>
            </div>

            {/* Toggle View */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'calendar' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
                }`}
                title="Calendar View"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          /* Calendar Grid */
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-1.5 text-center font-bold text-slate-400 bg-slate-50 rounded text-[11px]"
              >
                {day}
              </div>
            ))}

            {/* Days placeholder for alignment (e.g. Thu Oct 1) */}
            <div className="h-20 bg-slate-50/40 rounded border border-transparent" />
            <div className="h-20 bg-slate-50/40 rounded border border-transparent" />
            <div className="h-20 bg-slate-50/40 rounded border border-transparent" />
            <div className="h-20 bg-slate-50/40 rounded border border-transparent" />

            {calendarDays.slice(0, 24).map((day) => (
              <div
                key={day.dayNum}
                className={`h-20 p-1.5 rounded-lg border transition-colors flex flex-col justify-between ${
                  day.dayNum === 1
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-[11px] ${
                      day.dayNum === 1
                        ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                        : 'text-slate-700'
                    }`}
                  >
                    {day.dayNum}
                  </span>
                  {day.events.length > 0 && (
                    <span className="text-[9px] font-bold text-slate-400">
                      {day.events.length} PM
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto no-scrollbar">
                  {day.events.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedPmForDetail(ev)}
                      className={`w-full text-left p-1 rounded border text-[10px] font-bold truncate block ${getStatusColorClass(
                        ev.status
                      )}`}
                    >
                      [{ev.engineerInitials}] {ev.assetName}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="divide-y divide-slate-100">
            {pmSchedules.map((pm) => (
              <div
                key={pm.id}
                onClick={() => setSelectedPmForDetail(pm)}
                className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {pm.id}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{pm.type}</p>
                    <p className="text-[11px] text-slate-500">
                      {pm.assetName} ({pm.assetId}) • Mandated Contract: {pm.contractRequired ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-600">Lead: <strong>{pm.engineer}</strong></span>
                  <span className="text-slate-600">Target Date: <strong>{pm.date}</strong></span>
                  <PMPill status={pm.status === 'due_today' ? 'due' : pm.status === 'overdue' ? 'overdue' : 'ok'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3. Overdue PM Attention List */}
      {overdueList.length > 0 && (
        <Card className="border-rose-200 shadow-xs overflow-hidden">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-rose-950 font-bold">Overdue Preventive Maintenance Backlog</span>
              </div>
            }
            subtitle="Immediate priority tickets requiring engineer assignment to restore warranty compliance"
            className="bg-rose-50/50"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50/70 text-rose-900 font-semibold border-b border-rose-200">
                <tr>
                  <th className="py-3 px-4">Asset ID / Name</th>
                  <th className="py-3 px-4">PM Procedure</th>
                  <th className="py-3 px-4">Scheduled Deadline</th>
                  <th className="py-3 px-4">Contract Mandated</th>
                  <th className="py-3 px-4">Assigned Engineer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 text-slate-700 bg-white">
                {overdueList.map((pm) => (
                  <tr key={pm.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/assets/${pm.assetId}`} className="font-bold text-slate-900 hover:text-indigo-600">
                        {pm.assetName}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-500 block">{pm.assetId}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{pm.type}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{pm.date} (Overdue)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Mandated
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{pm.engineer}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setSelectedPmForDetail(pm)}
                      >
                        Schedule Now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. Corrective Work Orders Module */}
      <Card className="shadow-xs">
        <CardHeader
          title="Maintenance Work Orders"
          subtitle="Corrective, preventive, and emergency ticket lifecycle management"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateWoOpen(true)}
            >
              Create Work Order
            </Button>
          }
        />

        <div className="px-5 pt-2 bg-slate-50 border-b border-slate-200">
          <Tabs tabs={woTabs} activeTab={workOrderTab} onChange={setWorkOrderTab} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">WO ID</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Engineer</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredWorkOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{wo.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <Link href={`/assets/${wo.assetId}`} className="hover:underline hover:text-indigo-600">
                      {wo.assetName}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {wo.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <SeverityPill severity={wo.priority} />
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{wo.assignedEngineer}</td>
                  <td className="py-3 px-4 text-slate-500">{wo.createdAt}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{wo.dueDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        wo.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : wo.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : wo.status === 'Cancelled'
                          ? 'bg-slate-100 text-slate-500 border-slate-300'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {wo.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWoForDetail(wo)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. PM Cadence Compliance & Engineer Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Stacked Bar */}
        <Card className="p-6">
          <CardHeader
            title="Monthly PM Cadence Compliance"
            subtitle="Rolling 6-month breakdown: Compliant vs Late vs Missed"
            className="p-0 pb-4 border-none"
          />
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceMonthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="compliant" stackId="a" fill="#10B981" name="Compliant" radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="#F59E0B" name="Late" radius={[0, 0, 0, 0]} />
                <Bar dataKey="missed" stackId="a" fill="#EF4444" name="Missed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Engineer Assignments */}
        <Card className="p-6">
          <CardHeader
            title="Service Engineer Resource Load"
            subtitle="Active work orders, specialty roles, and next availability"
            className="p-0 pb-4 border-none"
          />
          <div className="space-y-3">
            {engineers.map((eng) => (
              <div
                key={eng.id}
                className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                    style={{ backgroundColor: eng.avatarColor }}
                  >
                    {eng.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{eng.name}</p>
                    <p className="text-[11px] text-slate-500">{eng.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{eng.activeWorkOrders} Active Orders</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Free: {eng.nextAvailable}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={isCreateWoOpen}
        onClose={() => setIsCreateWoOpen(false)}
        title="Create Service Work Order"
        subtitle="Log corrective, preventive, or emergency maintenance ticket"
      >
        <form onSubmit={handleCreateWorkOrderSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Asset</label>
            <select
              value={newWoAssetId}
              onChange={(e) => setNewWoAssetId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance Type</label>
              <select
                value={newWoType}
                onChange={(e) => setNewWoType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              >
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Inspection">Inspection</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={newWoPriority}
                onChange={(e) => setNewWoPriority(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Engineer</label>
              <select
                value={newWoEngineer}
                onChange={(e) => setNewWoEngineer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              >
                {engineers.map((eng) => (
                  <option key={eng.id} value={eng.name}>
                    {eng.name} ({eng.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
              <input
                type="date"
                value={newWoDueDate}
                onChange={(e) => setNewWoDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Problem Description & Work Instructions</label>
            <textarea
              rows={3}
              required
              value={newWoDescription}
              onChange={(e) => setNewWoDescription(e.target.value)}
              placeholder="Detail the failure symptoms, component replacement requirements, or safety lockout procedures..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateWoOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Dispatch Work Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* PM Detail Modal */}
      <Modal
        isOpen={!!selectedPmForDetail}
        onClose={() => setSelectedPmForDetail(null)}
        title="Preventive Maintenance Task Detail"
        subtitle={selectedPmForDetail?.id}
      >
        {selectedPmForDetail && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-bold text-base text-slate-900">{selectedPmForDetail.type}</p>
              <p className="text-slate-600">
                Asset: <strong>{selectedPmForDetail.assetName}</strong> ({selectedPmForDetail.assetId})
              </p>
              <p className="text-slate-600">Assigned Engineer: <strong>{selectedPmForDetail.engineer}</strong></p>
              <p className="text-slate-600">Scheduled Date: <strong>{selectedPmForDetail.date}</strong></p>
            </div>

            {selectedPmForDetail.notes && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
                <p className="font-semibold mb-0.5">Special Instructions:</p>
                <p>{selectedPmForDetail.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Link href={`/assets/${selectedPmForDetail.assetId}`}>
                <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                  Inspect Asset
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    addToast(`Marked ${selectedPmForDetail.id} as Completed.`, 'success');
                    setSelectedPmForDetail(null);
                  }}
                >
                  Mark as Completed
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Work Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedWoForDetail}
        onClose={() => setSelectedWoForDetail(null)}
        title={`Work Order: ${selectedWoForDetail?.id}`}
        subtitle={selectedWoForDetail?.assetName}
      >
        {selectedWoForDetail && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold">Priority:</span>
                <div className="mt-1">
                  <SeverityPill severity={selectedWoForDetail.priority} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Status:</span>
                <span className="ml-2 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold">
                  {selectedWoForDetail.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Work Scope & Task Description
                </h4>
                <p className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                  {selectedWoForDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Technician</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedWoForDetail.assignedEngineer}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Due Date</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedWoForDetail.dueDate}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Update Work Order Status
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateWorkOrderStatus(selectedWoForDetail.id, 'In Progress');
                    setSelectedWoForDetail(null);
                  }}
                >
                  Set In Progress
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateWorkOrderStatus(selectedWoForDetail.id, 'Completed');
                    setSelectedWoForDetail(null);
                  }}
                >
                  Mark Completed
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateWorkOrderStatus(selectedWoForDetail.id, 'Cancelled');
                    setSelectedWoForDetail(null);
                  }}
                  className="text-rose-600"
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
