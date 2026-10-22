'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { AssetHealthOverview } from '@/components/dashboard/AssetHealthOverview';
import { AssetsByLocation } from '@/components/dashboard/AssetsByLocation';
import { TopFaultsCard } from '@/components/dashboard/TopFaultsCard';
import { LiveSystemStatus } from '@/components/dashboard/LiveSystemStatus';
import { HighRiskEquipmentTable } from '@/components/dashboard/HighRiskEquipmentTable';
import { IoTSummaryCard } from '@/components/dashboard/IoTSummaryCard';
import { PMSummaryCard } from '@/components/dashboard/PMSummaryCard';
import { ContractRenewalPipelineCard } from '@/components/dashboard/ContractRenewalPipelineCard';
import { AiCopilotWidget } from '@/components/dashboard/AiCopilotWidget';

// Full Module Views for Single-Link Access
import { AssetListView } from '@/components/assets/AssetListView';
import { AssetDetailView } from '@/components/assets/AssetDetailView';
import { IoTOverviewView } from '@/components/iot/IoTOverviewView';
import { SensorDetailView } from '@/components/iot/SensorDetailView';
import { FaultAnalyticsView } from '@/components/faults/FaultAnalyticsView';
import { MaintenanceView } from '@/components/maintenance/MaintenanceView';
import { ContractsView } from '@/components/contracts/ContractsView';
import { ContractDetailView } from '@/components/contracts/ContractDetailView';
import { AlertsView } from '@/components/alerts/AlertsView';
import { ReportsView } from '@/components/reports/ReportsView';
import { AiAssistantView } from '@/components/ai/AiAssistantView';
import { SettingsView } from '@/components/settings/SettingsView';

import {
  LayoutDashboard,
  Server,
  Activity,
  Zap,
  Wrench,
  FileText,
  Bell,
  BarChart3,
  Sparkles,
  Settings as SettingsIcon,
  Layers,
} from 'lucide-react';

import { useAurumStore } from '@/store/useStore';
import { Suspense } from 'react';

function SingleLinkMasterContent() {
  const searchParams = useSearchParams();
  const {
    activeModule,
    setActiveModule,
    selectedAssetId,
    setSelectedAssetId,
    selectedSensorId,
    setSelectedSensorId,
    selectedContractId,
    setSelectedContractId,
    assets,
    devices,
    contracts,
  } = useAurumStore();

  // Sync tab/module from URL query params
  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('module');
    if (tabParam) {
      setActiveModule(tabParam);
    }
    const assetParam = searchParams.get('assetId') || searchParams.get('id');
    if (assetParam) {
      setSelectedAssetId(assetParam);
    }
    const sensorParam = searchParams.get('sensorId');
    if (sensorParam) {
      setSelectedSensorId(sensorParam);
    }
    const contractParam = searchParams.get('contractId');
    if (contractParam) {
      setSelectedContractId(contractParam);
    }
  }, [searchParams]);

  const handleModuleChange = (tabId: string) => {
    setActiveModule(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const navigationTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets Directory', icon: Server },
    { id: 'asset-detail', label: 'Asset Inspection', icon: Server, badge: selectedAssetId },
    { id: 'iot', label: 'IoT Telemetry', icon: Activity },
    { id: 'sensor-detail', label: 'Sensor Detail', icon: Activity, badge: 'Live' },
    { id: 'faults', label: 'Fault Analytics', icon: Zap },
    { id: 'maintenance', label: 'PM & Work Orders', icon: Wrench },
    { id: 'contracts', label: 'Contracts & SLA', icon: FileText },
    { id: 'contract-detail', label: 'Contract Audit', icon: FileText, badge: selectedContractId },
    { id: 'alerts', label: 'Alerts Center', icon: Bell, badge: 'Active' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'ai', label: 'AI Copilot', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <AppLayout title="AURUM Service Operations Command Center">
      {/* Quick Master View Navigator (Single-Link Access) */}
      <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] p-3 rounded-2xl shadow-xs sticky top-20 z-10 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#312E81]">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
              </div>
              <span className="font-black">AURUM Unified Navigator</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              — Instant switch across all PRD modules
            </span>
          </div>

          {/* Quick Target Selectors for Detailed Inspection Views */}
          {activeModule === 'asset-detail' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500">Inspect Asset:</span>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-900 focus:outline-none"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeModule === 'sensor-detail' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500">Inspect Channel:</span>
              <select
                value={selectedSensorId}
                onChange={(e) => setSelectedSensorId(e.target.value)}
                className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-900 focus:outline-none"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} — {d.sensorType} ({d.assetName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeModule === 'contract-detail' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500">Audit Agreement:</span>
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-900 focus:outline-none"
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleModuleChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#312E81] text-white shadow-sm ring-2 ring-indigo-300/40'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected View */}
      {activeModule === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <section aria-label="Key Performance Indicators">
            <KpiStrip />
          </section>

          <section aria-label="Action Center">
            <ActionCenter />
          </section>

          <section aria-label="AI Service Copilot">
            <AiCopilotWidget />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetHealthOverview />
            <AssetsByLocation />
          </div>

          <section aria-label="High Risk Equipment">
            <HighRiskEquipmentTable />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopFaultsCard />
            <LiveSystemStatus />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <IoTSummaryCard />
            <PMSummaryCard />
            <div className="md:col-span-2 lg:col-span-1">
              <ContractRenewalPipelineCard />
            </div>
          </div>
        </div>
      )}

      {activeModule === 'assets' && (
        <div className="animate-in fade-in duration-200">
          <AssetListView />
        </div>
      )}

      {activeModule === 'asset-detail' && (
        <div className="animate-in fade-in duration-200">
          <AssetDetailView assetId={selectedAssetId} />
        </div>
      )}

      {activeModule === 'iot' && (
        <div className="animate-in fade-in duration-200">
          <IoTOverviewView />
        </div>
      )}

      {activeModule === 'sensor-detail' && (
        <div className="animate-in fade-in duration-200">
          <SensorDetailView deviceId={selectedSensorId} />
        </div>
      )}

      {activeModule === 'faults' && (
        <div className="animate-in fade-in duration-200">
          <FaultAnalyticsView />
        </div>
      )}

      {activeModule === 'maintenance' && (
        <div className="animate-in fade-in duration-200">
          <MaintenanceView />
        </div>
      )}

      {activeModule === 'contracts' && (
        <div className="animate-in fade-in duration-200">
          <ContractsView />
        </div>
      )}

      {activeModule === 'contract-detail' && (
        <div className="animate-in fade-in duration-200">
          <ContractDetailView contractId={selectedContractId} />
        </div>
      )}

      {activeModule === 'alerts' && (
        <div className="animate-in fade-in duration-200">
          <AlertsView />
        </div>
      )}

      {activeModule === 'reports' && (
        <div className="animate-in fade-in duration-200">
          <ReportsView />
        </div>
      )}

      {activeModule === 'ai' && (
        <div className="animate-in fade-in duration-200">
          <AiAssistantView />
        </div>
      )}

      {activeModule === 'settings' && (
        <div className="animate-in fade-in duration-200">
          <SettingsView />
        </div>
      )}
    </AppLayout>
  );
}

export default function SingleLinkMasterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Initializing AURUM Command Center...</p>
          </div>
        </div>
      }
    >
      <SingleLinkMasterContent />
    </Suspense>
  );
}
