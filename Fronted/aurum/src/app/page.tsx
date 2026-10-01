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

export default function SingleLinkMasterPage() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('EQ-204');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('DEV-CHILLER-TEMP');
  const [selectedContractId, setSelectedContractId] = useState<string>('CTR-8801');

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
      <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-2xl shadow-xs sticky top-20 z-10">
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#312E81]">
            <Layers className="w-4 h-4 text-[#4F46E5]" />
            <span>AURUM Master View Switcher</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            — Browse every PRD screen and flow from this single link
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveModule(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#312E81] text-white shadow-sm'
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
