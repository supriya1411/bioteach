import { create } from 'zustand';
import {
  Asset,
  IoTDevice,
  FaultCodeAnalytics,
  WorkOrder,
  PMScheduleEvent,
  Contract,
  AlertItem,
  ChatMessage,
  ContractStatus,
} from '@/types';
import {
  mockAssets,
  mockIoTDevices,
  mockFaults,
  mockWorkOrders,
  mockPMSchedules,
  mockContracts,
  mockAlerts,
  mockEngineers,
} from '@/lib/mockData';
import { aurumApi } from '@/lib/api';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

interface AurumState {
  // Navigation & UI
  activeModule: string;
  setActiveModule: (module: string) => void;
  selectedAssetId: string;
  setSelectedAssetId: (id: string) => void;
  selectedSensorId: string;
  setSelectedSensorId: (id: string) => void;
  selectedContractId: string;
  setSelectedContractId: (id: string) => void;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Search Modal
  isSearchOpen: boolean;
  searchQuery: string;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;

  // Global Filters
  selectedLocation: string;
  selectedCategory: string;
  setSelectedLocation: (loc: string) => void;
  setSelectedCategory: (cat: string) => void;

  // Data Collections
  assets: Asset[];
  devices: IoTDevice[];
  faults: FaultCodeAnalytics[];
  workOrders: WorkOrder[];
  pmSchedules: PMScheduleEvent[];
  contracts: Contract[];
  alerts: AlertItem[];
  engineers: typeof mockEngineers;

  // Backend Sync Status
  isBackendConnected: boolean;
  initBackendSync: () => Promise<void>;

  // Fault Detail Drawer
  selectedFaultCode: FaultCodeAnalytics | null;
  setSelectedFaultCode: (fault: FaultCodeAnalytics | null) => void;

  // Action Center & Alert Actions
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  acknowledgeAllAlerts: () => void;
  acknowledgeAnomaly: (deviceId: string, anomalyId: string) => void;

  // Work Orders & PMs
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt'>) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrder['status']) => void;
  schedulePM: (pm: Omit<PMScheduleEvent, 'id'>) => void;

  // Contracts
  updateContractStatus: (id: string, status: ContractStatus) => void;

  // AI Chat
  chatMessages: ChatMessage[];
  isAiStreaming: boolean;
  sendChatMessage: (text: string) => Promise<void>;
  clearChatMessages: () => void;

  // Live Telemetry Simulation
  isLiveStreaming: boolean;
  toggleLiveStreaming: () => void;
  simulateTelemetryTick: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Offline detection
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAurumStore = create<AurumState>((set, get) => ({
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),
  selectedAssetId: 'EQ-204',
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),
  selectedSensorId: 'DEV-CHILLER-TEMP',
  setSelectedSensorId: (id) => set({ selectedSensorId: id }),
  selectedContractId: 'CTR-8801',
  setSelectedContractId: (id) => set({ selectedContractId: id }),

  isSidebarOpen: false,
  isSidebarCollapsed: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

  isSearchOpen: false,
  searchQuery: '',
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedLocation: 'All',
  selectedCategory: 'All',
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  assets: mockAssets,
  devices: mockIoTDevices,
  faults: mockFaults,
  workOrders: mockWorkOrders,
  pmSchedules: mockPMSchedules,
  contracts: mockContracts,
  alerts: mockAlerts,
  engineers: mockEngineers,

  isBackendConnected: false,

  initBackendSync: async () => {
    try {
      const dashboardData = await aurumApi.getDashboard();
      if (dashboardData) {
        set({ isBackendConnected: true });
        console.log('Successfully connected to AURUM FastAPI backend.');
      }
    } catch (e) {
      console.log('Operating in standalone mode with resilient local store.');
    }
  },

  selectedFaultCode: null,
  setSelectedFaultCode: (fault) => set({ selectedFaultCode: fault }),

  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a)),
    }));
    get().addToast(`Alert ${id} acknowledged.`, 'info');
  },

  resolveAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a)),
    }));
    get().addToast(`Alert ${id} marked as resolved.`, 'success');
  },

  acknowledgeAllAlerts: () => {
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, status: 'acknowledged' })),
    }));
    get().addToast('All active alerts acknowledged.', 'info');
  },

  acknowledgeAnomaly: (deviceId, anomalyId) => {
    set((state) => ({
      devices: state.devices.map((d) => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          anomalies: d.anomalies.map((an) =>
            an.id === anomalyId
              ? { ...an, acknowledged: true, acknowledgedBy: 'Current Operator (Manual)' }
              : an
          ),
        };
      }),
    }));
    get().addToast(`Anomaly acknowledged for sensor.`, 'info');
  },

  addWorkOrder: (woData) => {
    const newId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newWo: WorkOrder = {
      ...woData,
      id: newId,
      createdAt: now,
    };
    set((state) => ({
      workOrders: [newWo, ...state.workOrders],
    }));
    get().addToast(`Work Order ${newId} created successfully.`, 'success');

    // Also forward to backend if available
    aurumApi.logServiceCall({
      asset_id: woData.assetId,
      technician_notes: woData.description,
    });
  },

  updateWorkOrderStatus: (id, status) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === id
          ? {
              ...w,
              status,
              completedAt:
                status === 'Completed'
                  ? new Date().toISOString().replace('T', ' ').substring(0, 16)
                  : w.completedAt,
            }
          : w
      ),
    }));
    get().addToast(`Work Order ${id} updated to ${status}.`, 'info');
  },

  schedulePM: (pmData) => {
    const newId = `PM-${Date.now().toString().slice(-6)}`;
    const newPm: PMScheduleEvent = {
      ...pmData,
      id: newId,
    };
    set((state) => ({
      pmSchedules: [newPm, ...state.pmSchedules],
    }));
    get().addToast(`Preventive Maintenance scheduled for ${pmData.assetName}.`, 'success');
  },

  updateContractStatus: (id, status) => {
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
    get().addToast(`Contract ${id} status updated to ${status}.`, 'info');
  },

  chatMessages: [
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: '14:00',
      text: 'Welcome to AURUM Service Intelligence. I can correlate equipment health, live IoT telemetry, recurring faults, and contract status across your estate. How can I assist you today?',
    },
  ],
  isAiStreaming: false,

  clearChatMessages: () => {
    set({
      chatMessages: [
        {
          id: 'msg-welcome',
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Conversation history reset. I am ready to correlate equipment health, telemetry anomalies, maintenance schedules, and contract terms. What would you like to inspect?',
        },
      ],
      isAiStreaming: false,
    });
    get().addToast('AI conversation reset.', 'info');
  },

  isLiveStreaming: true,
  toggleLiveStreaming: () => {
    const nextState = !get().isLiveStreaming;
    set({ isLiveStreaming: nextState });
    get().addToast(
      nextState ? 'Live telemetry streaming active (1,420 msgs/sec).' : 'Live telemetry stream paused.',
      nextState ? 'success' : 'info'
    );
  },

  simulateTelemetryTick: () => {
    if (!get().isLiveStreaming) return;
    set((state) => ({
      devices: state.devices.map((device) => {
        // Minor realistic random drift within safe bounds
        let delta = 0;
        if (device.sensorType === 'Temperature') {
          delta = (Math.random() - 0.48) * 0.2;
        } else if (device.sensorType === 'Vibration') {
          delta = (Math.random() - 0.49) * 0.05;
        } else if (device.sensorType === 'Pressure') {
          delta = (Math.random() - 0.48) * 0.4;
        } else if (device.sensorType === 'Current') {
          delta = (Math.random() - 0.5) * 2;
        }
        const updatedReading = Math.max(
          0,
          Math.round((device.currentReading + delta) * 10) / 10
        );
        return {
          ...device,
          currentReading: updatedReading,
          lastSeen: 'Just now',
        };
      }),
    }));
  },

  sendChatMessage: async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      isAiStreaming: true,
    }));

    try {
      // Try backend AI API endpoint
      const backendAiResult = await aurumApi.queryAiAssistant(userText);

      if (backendAiResult && backendAiResult.answer) {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: backendAiResult.answer,
          citations: backendAiResult.evidence?.map((e) => ({
            type: 'asset',
            id: e.source,
            label: e.source,
            link: e.source.includes('EQ') ? `/assets/${e.source.split(' ')[0]}` : '/assets',
          })),
        };

        set((state) => ({
          chatMessages: [...state.chatMessages, assistantMsg],
          isAiStreaming: false,
        }));
        return;
      }
    } catch (e) {
      console.warn('Backend AI query fallback.');
    }

    // Resilient local intelligent operational engine
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let responseText = '';
      let citations: ChatMessage['citations'] = [];

      if (lower.includes('eq-204') || lower.includes('chiller')) {
        responseText =
          '### Asset Audit: EQ-204 (Centrifugal Chiller A)\n\n' +
          '• **Health Score:** 42/100 (CRITICAL Risk Index: 88)\n' +
          '• **Location:** Central Energy Plant B1\n' +
          '• **Telemetry Alarm:** Discharge temperature registered **38.4°C** (exceeding 35.0°C critical threshold).\n' +
          '• **Recurring Faults:** Fault code `E-204` logged 3 times in the past 30 days.\n' +
          '• **Compliance Gap:** PM overhaul is **14 days overdue** under Carrier AMC (`CTR-8801`).\n' +
          '• **Recommended Action:** Dispatch technician for condenser coil chemical descaling and verify refrigerant charge.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Centrifugal Chiller A', link: '/assets/EQ-204' },
          { type: 'contract', id: 'CTR-8801', label: 'Carrier HVAC AMC', link: '/contracts/CTR-8801' },
        ];
      } else if (lower.includes('eq-711') || lower.includes('ro water') || lower.includes('dialysis')) {
        responseText =
          '### Asset Audit: EQ-711 (Reverse Osmosis Water Purification)\n\n' +
          '• **Health Score:** 48/100 (Risk Index: 86)\n' +
          '• **Location:** Dialysis & Cleanroom Wing\n' +
          '• **Telemetry Alarm:** Membrane differential pressure saturated at **14.8 bar** (threshold: 14.0 bar).\n' +
          '• **Overdue Maintenance:** Chemical Sanitization CIP wash is **5 days overdue**.\n' +
          '• **Contract Notice:** Covered under Veolia Agreement `CTR-5510` which expires in 13 days.';
        citations = [
          { type: 'asset', id: 'EQ-711', label: 'RO Water System', link: '/assets/EQ-711' },
          { type: 'contract', id: 'CTR-5510', label: 'Veolia Critical Water', link: '/contracts/CTR-5510' },
        ];
      } else if (lower.includes('eq-108') || lower.includes('mri')) {
        responseText =
          '### Asset Audit: EQ-108 (3.0T High-Field MRI Scanner)\n\n' +
          '• **Health Score:** 61/100 (Risk Index: 82)\n' +
          '• **Location:** Radiology Wing (Vault B)\n' +
          '• **Telemetry Alarm:** Cryogenic coldhead vibration harmonic drift at **3.9 mm/s** (warning threshold: 3.2 mm/s).\n' +
          '• **PM Cadence:** Quarterly cryogenic adsorber replacement due in 3 days.';
        citations = [
          { type: 'asset', id: 'EQ-108', label: '3.0T MRI Scanner', link: '/assets/EQ-108' },
        ];
      } else if (lower.includes('high risk') || lower.includes('equipment') || lower.includes('today')) {
        responseText =
          'Currently, 3 physical assets require immediate operational attention:\n\n' +
          '1. **EQ-204 (Centrifugal Chiller A)** — Risk Score 88. Discharge temp 38.4°C (>35°C critical limit). 3 recurring E-204 faults in 30 days and PM is 14 days overdue.\n' +
          '2. **EQ-711 (RO Water System)** — Risk Score 86. Membrane differential pressure saturated at 14.8 bar with PM overdue by 5 days.\n' +
          '3. **EQ-108 (3.0T MRI Scanner)** — Risk Score 82. Harmonic coldhead vibration drift (+18%) with quarterly PM due in 3 days.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Centrifugal Chiller A', link: '/assets/EQ-204' },
          { type: 'asset', id: 'EQ-711', label: 'RO Water System', link: '/assets/EQ-711' },
          { type: 'asset', id: 'EQ-108', label: '3.0T MRI Scanner', link: '/assets/EQ-108' },
        ];
      } else if (lower.includes('overdue') || lower.includes('pm') || lower.includes('maintenance')) {
        responseText =
          'There are 2 overdue Preventive Maintenance events requiring immediate resolution:\n\n' +
          '• **EQ-204 (Centrifugal Chiller A)**: Monthly Condenser Overhaul overdue by 14 days (Mandated by Carrier AMC clause 4.2).\n' +
          '• **EQ-711 (RO Water System)**: Sanitization & Membrane Replacement overdue by 5 days.\n\n' +
          'Overall PM delivery compliance rate across the estate stands at **81.2%**.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Centrifugal Chiller A', link: '/assets/EQ-204' },
          { type: 'asset', id: 'EQ-711', label: 'RO Water System', link: '/assets/EQ-711' },
        ];
      } else if (lower.includes('contract') || lower.includes('expire') || lower.includes('renewal')) {
        responseText =
          '### Contract Renewal Priority Assessment\n\n' +
          '• **CTR-5510 (Veolia Water & Steam)**: Expires in 13 days ($68,000/yr). High renewal risk due to unresolved pressure alarms on EQ-711.\n' +
          '• **CTR-8801 (Carrier HVAC AMC)**: Expires in 28 days ($145,000/yr). Overdue PM on high-risk Chiller A.\n' +
          '• **CTR-6612 (Otis Elevator CMC)**: **LAPSED 12 days ago!** Elevator EQ-099 is currently operating without active warranty coverage.';
        citations = [
          { type: 'contract', id: 'CTR-5510', label: 'Veolia Water & Steam', link: '/contracts/CTR-5510' },
          { type: 'contract', id: 'CTR-8801', label: 'Carrier HVAC AMC', link: '/contracts/CTR-8801' },
          { type: 'contract', id: 'CTR-6612', label: 'Otis Elevator Fleet', link: '/contracts/CTR-6612' },
        ];
      } else if (lower.includes('mtbf') || lower.includes('reliability') || lower.includes('root cause')) {
        responseText =
          '### Estate Reliability & Failure Analysis\n\n' +
          '• **Fleet Mean Time Between Failures (MTBF):** **118 Days** (vs 140-day target benchmark).\n' +
          '• **Primary Failure Mode:** Thermal excess (`E-204`) and membrane pressure saturation (`F-301`).\n' +
          '• **Co-occurrence Signal:** Thermal discharge (E-204) and harmonic vibration (V-88) co-occur within 4 hours in **71%** of incidents on Chiller A.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Inspect Chiller Correlations', link: '/assets/EQ-204' },
        ];
      } else if (lower.includes('engineer') || lower.includes('technician') || lower.includes('vance')) {
        responseText =
          '### Engineering Team Status\n\n' +
          '• **Lead HVAC Specialist:** Marcus Vance (Assigned to EQ-204 overhaul)\n' +
          '• **Biomedical Engineer:** Sarah Chen (Assigned to EQ-108 coldhead calibration)\n' +
          '• **Water Systems Lead:** Elena Rostova (Assigned to EQ-711 sanitization)\n' +
          '• **Electrical Systems:** David Kim\n' +
          '• **All 5 certified technicians** have active credentials logged in the compliance registry.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'View Work Orders', link: '/maintenance' },
        ];
      } else {
        responseText =
          '### AURUM Estate Status Summary\n\n' +
          '• **Monitored Assets:** 12 Physical equipment installations\n' +
          '• **Portfolio Health Index:** **76.4 / 100**\n' +
          '• **Active Telemetry Gateways:** 1,420 msgs/sec streaming with 99.4% uptime\n' +
          '• **Action Center:** 4 prioritized alerts (2 critical, 2 high)\n' +
          '• **Audit Readiness Score:** 92% certified';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Inspect High Risk Chiller A', link: '/assets/EQ-204' },
          { type: 'contract', id: 'CTR-8801', label: 'Review Carrier AMC', link: '/contracts/CTR-8801' },
        ];
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: responseText,
        citations,
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMsg],
        isAiStreaming: false,
      }));
    }, 400);
  },

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, timestamp: Date.now() };
    set((s) => ({ toasts: [...s.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),
}));
