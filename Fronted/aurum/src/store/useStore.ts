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

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Offline detection
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAurumStore = create<AurumState>((set, get) => ({
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
      id: 'msg-1',
      sender: 'assistant',
      timestamp: '14:00',
      text: 'Welcome to AURUM Service Intelligence. I can correlate equipment health, live IoT telemetry, recurring faults, and contract status across your estate. How can I assist you today?',
    },
  ],
  isAiStreaming: false,

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

    // Resilient local intelligent fallback
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let responseText = '';
      let citations: ChatMessage['citations'] = [];

      if (lower.includes('high risk') || lower.includes('equipment') || lower.includes('today')) {
        responseText =
          'Currently, 3 assets are categorized as High Risk:\n\n' +
          '1. **EQ-204 (Centrifugal Chiller A)** — Risk Score 88. Discharge temp reached 38.4°C (exceeding 35°C critical limit). 3 recurring E-204 faults in 30 days and PM is 14 days overdue.\n' +
          '2. **EQ-711 (RO Water System)** — Risk Score 86. Membrane differential pressure saturated at 14.8 bar with PM overdue by 5 days.\n' +
          '3. **EQ-108 (3.0T MRI Scanner)** — Risk Score 82. Harmonic coldhead vibration drift (+18%) and quarterly PM due in 3 days.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Centrifugal Chiller A', link: '/assets/EQ-204' },
          { type: 'asset', id: 'EQ-711', label: 'RO Water System', link: '/assets/EQ-711' },
          { type: 'asset', id: 'EQ-108', label: '3.0T MRI Scanner', link: '/assets/EQ-108' },
        ];
      } else if (lower.includes('overdue') || lower.includes('pm') || lower.includes('maintenance')) {
        responseText =
          'There are 2 overdue Preventive Maintenance events requiring immediate resolution:\n\n' +
          '• **EQ-204 (Centrifugal Chiller A)**: Monthly Condenser Overhaul overdue by 14 days (Mandated by Carrier AMC clause 4.2).\n' +
          '• **EQ-711 (RO Water System)**: Sanitization & Membrane Replacement overdue by 5 days.';
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Centrifugal Chiller A', link: '/assets/EQ-204' },
          { type: 'asset', id: 'EQ-711', label: 'RO Water System', link: '/assets/EQ-711' },
        ];
      } else if (lower.includes('contract') || lower.includes('expire') || lower.includes('renewal')) {
        responseText =
          'Contract Renewal Priority Assessment:\n\n' +
          '• **CTR-5510 (Veolia Water & Steam)**: Expires in 13 days ($68,000/yr). Multiple unresolved pressure alarms on EQ-711.\n' +
          '• **CTR-8801 (Carrier HVAC AMC)**: Expires in 28 days ($145,000/yr). Overdue PM on high-risk Chiller A.\n' +
          '• **CTR-6612 (Otis Elevator CMC)**: LAPSED 12 days ago! Elevator EQ-099 is operating without active warranty.';
        citations = [
          { type: 'contract', id: 'CTR-5510', label: 'Veolia Water & Steam', link: '/contracts/CTR-5510' },
          { type: 'contract', id: 'CTR-8801', label: 'Carrier HVAC AMC', link: '/contracts/CTR-8801' },
          { type: 'contract', id: 'CTR-6612', label: 'Otis Elevator Fleet', link: '/contracts/CTR-6612' },
        ];
      } else {
        responseText = `Based on current estate telemetry: We are monitoring 12 physical assets with an average health score of 76.4/100. There are 4 active critical/high alerts in the Action Center. Telemetry gateways are operating normally at 1,420 msgs/sec.`;
        citations = [
          { type: 'asset', id: 'EQ-204', label: 'Inspect Chiller A', link: '/assets/EQ-204' },
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
    }, 500);
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
