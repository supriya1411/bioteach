'use client';

import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Bell,
  Link as LinkIcon,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { useAurumStore } from '@/store/useStore';

export const SettingsView: React.FC = () => {
  const { addToast } = useAurumStore();
  const [activeTab, setActiveTab] = useState('thresholds');

  // Thresholds state
  const [tempCrit, setTempCrit] = useState(35.0);
  const [vibCrit, setVibCrit] = useState(5.5);
  const [pressCrit, setPressCrit] = useState(14.0);

  // Notification settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsCriticalOnly, setSmsCriticalOnly] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/X00');

  const tabs = [
    { id: 'thresholds', label: 'Anomaly Thresholds', icon: <Sliders className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notification Channels', icon: <Bell className="w-4 h-4" /> },
    { id: 'integrations', label: 'CMMS & IoT Ingestion', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'profile', label: 'Operator Profile & Roles', icon: <Shield className="w-4 h-4" /> },
  ];

  const handleSave = () => {
    addToast('Platform configuration saved successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">System & Platform Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure telemetry alarm thresholds, CMMS bridge connectors, and notification policies
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} icon={<Save className="w-3.5 h-3.5" />}>
            Save Changes
          </Button>
        </div>

        <div className="mt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Tab 1: Thresholds */}
      {activeTab === 'thresholds' && (
        <Card className="p-6 space-y-6">
          <CardHeader
            title="Global Telemetry Alarm Limits"
            subtitle="Default baseline thresholds before equipment-specific override rules"
            className="p-0 pb-4 border-none"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Temperature Critical Threshold (°C)</label>
              <input
                type="number"
                step="0.1"
                value={tempCrit}
                onChange={(e) => setTempCrit(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500">Excursions above trigger Red Critical status</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Vibration Critical Limit (mm/s)</label>
              <input
                type="number"
                step="0.1"
                value={vibCrit}
                onChange={(e) => setVibCrit(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500">RMS harmonic vibration baseline</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Pressure Limit (bar)</label>
              <input
                type="number"
                step="0.1"
                value={pressCrit}
                onChange={(e) => setPressCrit(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500">Maximum allowable differential head</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <Card className="p-6 space-y-6">
          <CardHeader
            title="Dispatch & Alert Channels"
            subtitle="Configure who receives critical alerts and overdue PM notifications"
            className="p-0 pb-4 border-none"
          />

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Email Notifications for Critical Events</p>
                <p className="text-[11px] text-slate-500">Sends instant diagnostic summary to Operations Team</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">SMS / On-Call Dispatch Escalation</p>
                <p className="text-[11px] text-slate-500">Dispatches SMS to duty engineer for Level-1 alarms</p>
              </div>
              <input
                type="checkbox"
                checked={smsCriticalOnly}
                onChange={(e) => setSmsCriticalOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-900 block">Corporate Collaboration Webhook (Slack / MS Teams)</label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Integrations */}
      {activeTab === 'integrations' && (
        <Card className="p-6 space-y-4">
          <CardHeader
            title="Active Data Pipelines & Gateway Bridges"
            subtitle="Connected IoT ingestion brokers and CMMS work order sync"
            className="p-0 pb-4 border-none"
          />

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">MQTT IoT Telemetry Ingress</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Connected (1,420 msgs/s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Endpoint: ssl://mqtt-gateway.aurum-ops.internal:8883</p>
              </div>
              <Button variant="outline" size="sm">
                Test Ping
              </Button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Enterprise CMMS / Maximo Bridge</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Sync Active (Queue: 8 items)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Bi-directional work order and PM schedule sync</p>
              </div>
              <Button variant="outline" size="sm">
                Force Sync
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Operator Profile */}
      {activeTab === 'profile' && (
        <Card className="p-6 space-y-4">
          <CardHeader
            title="User Profile & Security Access"
            subtitle="Current session privileges and role permissions"
            className="p-0 pb-4 border-none"
          />

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg">
              DR
            </div>
            <div className="text-xs">
              <h4 className="text-base font-bold text-slate-900">David Ross</h4>
              <p className="text-slate-500">d.ross@hospital-ops.internal</p>
              <p className="text-indigo-700 font-semibold mt-1">Role: Operations Director (Full Admin Access)</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
