'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Wrench,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Upload,
  CheckCircle2,
  AlertOctagon,
  FileSpreadsheet,
  Plus,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { HealthScoreBadge, RiskPill, IoTPill, PMPill, SeverityPill } from '../ui/StatusPill';
import { Gauge } from '../ui/Gauge';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { useAurumStore } from '@/store/useStore';
import { Asset, IoTDevice } from '@/types';

interface AssetDetailViewProps {
  assetId: string;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({ assetId }) => {
  const {
    assets,
    devices,
    faults,
    pmSchedules,
    workOrders,
    contracts,
    schedulePM,
    addToast,
  } = useAurumStore();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Modals
  const [isSchedulePmOpen, setIsSchedulePmOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Manual');

  // Form states for PM
  const [pmType, setPmType] = useState('Comprehensive Diagnostic & Sensor Calibration');
  const [pmEngineer, setPmEngineer] = useState('Marcus Vance');
  const [pmDate, setPmDate] = useState('2026-10-06');

  // Find asset
  const asset = assets.find((a) => a.id === assetId) || assets[0];

  // Associated telemetry devices
  const assetSensors = devices.filter((d) => d.assetId === asset.id);
  const primarySensor: IoTDevice | undefined = assetSensors[0] || devices[0];

  // Associated faults instances
  const assetFaultInstances = faults
    .flatMap((f) =>
      f.instances
        .filter((inst) => inst.assetId === asset.id)
        .map((inst) => ({ ...inst, faultCode: f.code, faultDescription: f.description }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  // Associated PMs & Work Orders
  const assetPMs = pmSchedules.filter((p) => p.assetId === asset.id);
  const assetWorkOrders = workOrders.filter((w) => w.assetId === asset.id);

  // Associated Contract
  const assetContract = contracts.find((c) => c.coveredAssets.includes(asset.id));

  // Custom mock documents
  const [documentsList, setDocumentsList] = useState([
    {
      id: 'DOC-M1',
      name: `${asset.manufacturer}_${asset.model}_Installation_Manual.pdf`,
      type: 'OEM Manual',
      uploadDate: '2025-01-12',
      size: '8.4 MB',
    },
    {
      id: 'DOC-M2',
      name: 'Factory_Warranty_Certification.pdf',
      type: 'Warranty Certificate',
      uploadDate: '2025-01-12',
      size: '1.2 MB',
    },
    {
      id: 'DOC-M3',
      name: 'Q2_Annual_Safety_Inspection_Signoff.pdf',
      type: 'Inspection Report',
      uploadDate: '2026-06-30',
      size: '2.8 MB',
    },
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Server className="w-4 h-4" /> },
    {
      id: 'faults',
      label: 'Fault & Service History',
      count: assetFaultInstances.length,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    { id: 'iot', label: 'IoT Telemetry', count: assetSensors.length, icon: <Activity className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance & PM', count: assetPMs.length, icon: <Wrench className="w-4 h-4" /> },
    { id: 'contract', label: 'Contract & SLA', icon: <FileText className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', count: documentsList.length, icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  const handleConfirmSchedulePM = () => {
    schedulePM({
      assetId: asset.id,
      assetName: asset.name,
      type: pmType,
      engineer: pmEngineer,
      engineerInitials: pmEngineer
        .split(' ')
        .map((n) => n[0])
        .join(''),
      date: pmDate,
      status: 'upcoming',
      contractRequired: true,
      notes: `Scheduled via Asset Detail view.`,
    });
    setIsSchedulePmOpen(false);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    setDocumentsList((prev) => [
      {
        id: `DOC-${Date.now()}`,
        name: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
        type: docType,
        uploadDate: new Date().toISOString().substring(0, 10),
        size: '1.8 MB',
      },
      ...prev,
    ]);
    addToast(`Document "${docName}" uploaded successfully.`, 'success');
    setDocName('');
    setIsUploadDocOpen(false);
  };

  // Telemetry chart data for chosen sensor
  const currentHistoryData = primarySensor?.history[timeRange] || [];

  return (
    <div className="space-y-6">
      {/* Header Band */}
      <Card className="p-5 sm:p-6 shadow-xs border-[#E2E8F0] bg-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-black text-white bg-[#312E81] px-2.5 py-0.5 rounded shadow-2xs">
                {asset.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {asset.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{asset.location} ({asset.floor})</span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {asset.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manufacturer: <strong className="text-slate-700">{asset.manufacturer}</strong> • Model: {asset.model} • S/N: {asset.serialNumber} • Installed: {asset.installedDate}
            </p>
          </div>

          {/* Status Pills Strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <HealthScoreBadge score={asset.healthScore} />
            <RiskPill risk={asset.riskLevel} />
            <IoTPill status={asset.iotStatus} />
            <PMPill status={asset.pmStatus} />
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${
                asset.contractStatus === 'CMC'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {asset.contractStatus} Contract
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-2 border-t border-slate-100">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score & 30d Trend */}
            <Card className="p-6 flex flex-col justify-between items-center text-center">
              <CardHeader
                title="Condition Health Index"
                subtitle="Real-time multi-factor Bayesian score"
                className="w-full p-0 pb-3 border-none text-center"
              />
              <div className="my-3">
                <Gauge
                  value={asset.healthScore}
                  size={140}
                  strokeWidth={12}
                  colorScheme="health"
                  label={asset.healthScore >= 75 ? 'Optimal Condition' : asset.healthScore >= 50 ? 'Operating with Risk' : 'Critical Hazard'}
                />
              </div>

              <div className="w-full pt-4 border-t border-slate-100 text-left">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  30-Day Health Trajectory
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                  {asset.trend30d.map((val, idx) => (
                    <span
                      key={idx}
                      className={`flex-1 text-center py-1 rounded text-[10px] font-bold ${
                        val >= 75 ? 'bg-emerald-100 text-emerald-800' : val >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}
                      title={`Day ${idx + 1}: ${val}%`}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Risk Contributing Factors (Evidence Cards) */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                      <span>Operational Risk Evidence & Factors</span>
                    </div>
                  }
                  subtitle="Underlying signals contributing to current composite risk score"
                  className="p-0 pb-4 border-none"
                />

                <div className="space-y-3">
                  {asset.riskContributingFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-rose-50/70 border-l-4 border-rose-500 border-y border-r border-rose-200/80 rounded-r-xl flex items-start gap-3"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold text-rose-950">{factor}</p>
                        <p className="text-[11px] text-rose-800/80 mt-0.5">
                          Correlated via continuous edge telemetry & CMMS history logs.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Risk Level: <strong className="text-rose-600">{asset.riskLevel} ({asset.riskScore}/100)</strong>
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsSchedulePmOpen(true)}
                  icon={<Wrench className="w-3.5 h-3.5" />}
                >
                  Schedule Mitigating PM
                </Button>
              </div>
            </Card>
          </div>

          {/* Key Specifications & Location Schematic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader
                title="Engineering Specifications"
                subtitle="Master data record and vendor serial details"
                className="p-0 pb-4 border-none"
              />
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-semibold">MANUFACTURER</p>
                  <p className="font-bold text-slate-800 mt-0.5">{asset.manufacturer}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-semibold">MODEL NUMBER</p>
                  <p className="font-bold text-slate-800 mt-0.5">{asset.model}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-semibold">SERIAL NUMBER</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{asset.serialNumber}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-semibold">COMMISSIONED DATE</p>
                  <p className="font-bold text-slate-800 mt-0.5">{asset.installedDate}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-semibold">WARRANTY EXPIRATION</p>
                  <p className="font-bold text-slate-800 mt-0.5">{asset.warrantyExpiry}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-semibold">SERVICE CONTRACT ID</p>
                  <p className="font-mono font-bold text-indigo-700 mt-0.5">
                    {asset.contractId || 'None'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Location & Floor Plan Map Thumbnail */}
            <Card className="p-6 flex flex-col justify-between">
              <CardHeader
                title="Facility Location & Topology"
                subtitle="Spatial placement in physical plant"
                className="p-0 pb-4 border-none"
              />
              <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mb-2 shadow-xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">{asset.location}</p>
                <p className="text-xs text-slate-500">{asset.floor}</p>
                <span className="mt-3 px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 shadow-2xs">
                  Zone Coordinate: Lat 37.7749°, Lng -122.4194°
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Building Management Substation B2</span>
                <span className="font-semibold text-slate-700">Access: Badge Level 3 Required</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Fault / Service History */}
      {activeTab === 'faults' && (
        <Card className="p-6">
          <CardHeader
            title="Fault & Service Incident History"
            subtitle="Chronological log of diagnostic codes and corrective actions"
            className="p-0 pb-4 border-none"
          />

          {assetFaultInstances.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pt-2">
              {assetFaultInstances.map((inst, idx) => (
                <div key={inst.id} className="relative pl-6 group">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-rose-500 group-hover:scale-125 transition-transform" />
                  <div className="p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-xl border border-slate-200 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {inst.faultCode}
                        </span>
                        <SeverityPill severity={inst.severity} />
                        <span className="text-xs font-bold text-slate-900">
                          {inst.faultDescription}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{inst.date}</span>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <strong>Resolution:</strong> {inst.resolutionSummary}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Assigned Engineer: <strong className="text-slate-800">{inst.engineer}</strong></span>
                      <span>Resolution Time: <strong className="text-slate-800">{inst.resolutionTimeHours} hours</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No fault records recorded for this asset.
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: IoT Telemetry */}
      {activeTab === 'iot' && (
        <div className="space-y-6">
          {/* Live Sensor Gauges / Reading Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetSensors.map((sensor) => (
              <Card key={sensor.id} className="p-5 border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{sensor.id}</span>
                    <h4 className="text-sm font-bold text-slate-900">{sensor.sensorType}</h4>
                  </div>
                  <IoTPill status={sensor.status} />
                </div>

                <div className="my-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {sensor.currentReading}
                  </span>
                  <span className="text-sm font-bold text-slate-500 ml-1.5">{sensor.unit}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Threshold Limit: {sensor.warningThreshold} {sensor.unit}</span>
                  <span className="text-slate-400">{sensor.lastSeen}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Time Series Telemetry Chart with Threshold Bands */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {primarySensor?.sensorType} Telemetry Stream
                </h3>
                <p className="text-xs text-slate-500">
                  Safe threshold: &lt;{primarySensor?.maxThreshold}{primarySensor?.unit} • Critical threshold: &gt;{primarySensor?.criticalThreshold}{primarySensor?.unit}
                </p>
              </div>

              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                {(['24h', '7d', '30d'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      timeRange === r ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentHistoryData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                  {primarySensor && (
                    <ReferenceLine
                      y={primarySensor.criticalThreshold}
                      stroke="#EF4444"
                      strokeDasharray="3 3"
                      label={{
                        value: `Critical (${primarySensor.criticalThreshold}${primarySensor.unit})`,
                        fill: '#EF4444',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />
                  )}
                  {primarySensor && (
                    <ReferenceLine
                      y={primarySensor.warningThreshold}
                      stroke="#F59E0B"
                      strokeDasharray="3 3"
                      label={{
                        value: `Warning (${primarySensor.warningThreshold}${primarySensor.unit})`,
                        fill: '#F59E0B',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Anomaly Events List */}
            {primarySensor?.anomalies && primarySensor.anomalies.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Captured Anomaly Events
                </h4>
                <div className="space-y-2">
                  {primarySensor.anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <SeverityPill severity={anom.severity} />
                        <div>
                          <p className="font-bold text-slate-900">{anom.deviation}</p>
                          <p className="text-[11px] text-slate-500">
                            Reading: {anom.reading}{primarySensor.unit} (Limit: {anom.threshold}{primarySensor.unit}) • Duration: {anom.durationMinutes}m
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">{anom.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 4: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Preventive Maintenance Schedule</h3>
                <p className="text-xs text-slate-500">Upcoming planned overhauls and certified inspection tasks</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSchedulePmOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Schedule New PM
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {assetPMs.map((pm) => (
                <div key={pm.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {pm.id}
                      </span>
                      <span className="font-bold text-slate-900">{pm.type}</span>
                      <PMPill status={pm.status === 'due_today' ? 'due' : pm.status === 'overdue' ? 'overdue' : 'ok'} />
                    </div>
                    {pm.notes && <p className="text-[11px] text-slate-500 mt-1">{pm.notes}</p>}
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 shrink-0">
                    <span>Engineer: <strong>{pm.engineer}</strong></span>
                    <span>Date: <strong>{pm.date}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Corrective Work Orders for this asset */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Work Orders Associated</h3>
            <p className="text-xs text-slate-500 mb-4">Corrective and emergency tickets logged on this asset</p>
            <div className="divide-y divide-slate-100">
              {assetWorkOrders.map((wo) => (
                <div key={wo.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{wo.id}</span>
                      <span className="font-bold text-slate-900">{wo.type}</span>
                      <SeverityPill severity={wo.priority} />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{wo.description}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">
                    {wo.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Contract & SLA */}
      {activeTab === 'contract' && (
        <div className="space-y-6">
          {assetContract ? (
            <Card className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {assetContract.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{assetContract.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Vendor: <strong>{assetContract.vendor}</strong> • Type: {assetContract.type}</p>
                </div>
                <Link href={`/contracts/${assetContract.id}`}>
                  <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                    View Master Contract
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Annual Value</p>
                  <p className="text-lg font-black text-slate-900 mt-1">${assetContract.value.toLocaleString()}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">PM Delivery Cadence</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{assetContract.pmCadence}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Contract Expiry</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{assetContract.endDate} ({assetContract.daysToExpiry}d left)</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">Contract Scope & SLA Commitments</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {assetContract.scope}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
              <EmptyState
                title="No Active Service Contract"
                description="This asset is currently operating without an active AMC or CMC agreement."
              />
            </Card>
          )}
        </div>
      )}

      {/* Tab 6: Documents */}
      {activeTab === 'documents' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Equipment Documentation</h3>
              <p className="text-xs text-slate-500">Service manuals, warranty contracts, and calibration sheets</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadDocOpen(true)}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload Document
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {documentsList.map((doc) => (
              <div key={doc.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                    PDF
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{doc.name}</p>
                    <p className="text-[11px] text-slate-500">{doc.type} • {doc.size} • Uploaded {doc.uploadDate}</p>
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
      )}

      {/* Schedule PM Modal */}
      <Modal
        isOpen={isSchedulePmOpen}
        onClose={() => setIsSchedulePmOpen(false)}
        title="Schedule Preventive Maintenance"
        subtitle={asset.name}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Maintenance Type / Procedure</label>
            <input
              type="text"
              value={pmType}
              onChange={(e) => setPmType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Lead Engineer</label>
            <select
              value={pmEngineer}
              onChange={(e) => setPmEngineer(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            >
              <option value="Marcus Vance">Marcus Vance (HVAC Specialist)</option>
              <option value="Sara Lin">Sara Lin (Electrical & Automation)</option>
              <option value="Tariq Al-Mansoor">Tariq Al-Mansoor (Vibration Diagnostics)</option>
              <option value="Elena Gomez">Elena Gomez (Biomedical Lead)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheduled Target Date</label>
            <input
              type="date"
              value={pmDate}
              onChange={(e) => setPmDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSchedulePmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmSchedulePM}>
              Schedule PM
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Equipment Documentation"
        subtitle={asset.name}
      >
        <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Q3_Air_Filter_Inspection_Report.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            >
              <option value="Manual">Equipment Manual / OEM Spec</option>
              <option value="Inspection Report">Field Inspection Report</option>
              <option value="Calibration Sheet">Sensor Calibration Certificate</option>
              <option value="Warranty Certificate">Warranty / Insurance Form</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
