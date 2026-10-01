/**
 * AURUM Service Intelligence API Client
 * Integrated with the FastAPI backend according to FRONTEND_API_MAPPING.md
 */

const API_BASE = typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error_code?: string | null;
  meta?: Record<string, any>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      console.warn(`API request to ${endpoint} returned status ${res.status}`);
      return null;
    }

    const json: ApiResponse<T> = await res.json();
    if (json && json.success) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.warn(`API communication error on ${endpoint}:`, error);
    return null;
  }
}

export const aurumApi = {
  // 1. Composite Dashboard
  getDashboard: () => request<any>('/dashboard'),

  // 2. Action Center
  getActionCenter: (filterType?: string) =>
    request<any[]>(filterType && filterType !== 'ALL' ? `/action-center?filter_type=${filterType}` : '/action-center'),

  // 3. Assets & Risk Engine
  getAssets: (params?: { query?: string; category?: string; risk_level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set('query', params.query);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.risk_level) searchParams.set('risk_level', params.risk_level);
    const qs = searchParams.toString();
    return request<any[]>(qs ? `/assets?${qs}` : '/assets');
  },
  getAssetDetail: (id: string) => request<any>(`/assets/${id}`),
  getAssetRiskExplanation: (id: string) => request<any>(`/assets/${id}/risk-explanation`),

  // 4. IoT & Telemetry
  getIoTSensors: (params?: { sensor_type?: string; status?: string; asset_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.sensor_type) searchParams.set('sensor_type', params.sensor_type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.asset_id) searchParams.set('asset_id', params.asset_id);
    const qs = searchParams.toString();
    return request<any[]>(qs ? `/iot/sensors?${qs}` : '/iot/sensors');
  },
  getSensorDetail: (id: string) => request<any>(`/iot/sensors/${id}`),
  getSensorReadings: (sensorId: string, limit = 50) =>
    request<any[]>(`/iot/readings?sensor_id=${sensorId}&limit=${limit}`),
  postSensorReading: (sensorId: string, value: number, unit: string) =>
    request<any>('/iot/readings', {
      method: 'POST',
      body: JSON.stringify({ sensor_id: sensorId, value, unit }),
    }),

  // 5. Fault Analytics & MTBF
  getFaultAnalytics: () => request<any>('/fault-analytics'),
  getMtbf: (assetIdOrCategory?: string) =>
    request<any>(assetIdOrCategory ? `/fault-analytics/mtbf?category=${assetIdOrCategory}` : '/fault-analytics/mtbf'),
  logServiceCall: (data: { asset_id: string; technician_notes: string; resolution_hours?: number }) =>
    request<any>('/service-calls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 6. Maintenance & Compliance
  getMaintenance: (status?: string) =>
    request<any[]>(status ? `/maintenance?status=${status}` : '/maintenance'),
  getMaintenanceCompliance: () => request<any[]>('/maintenance/compliance'),

  // 7. Contracts & Renewal Pipeline
  getContracts: () => request<any[]>('/contracts'),
  getContractRenewalPipeline: () => request<any[]>('/contracts/renewal-pipeline'),
  getContractCompliance: () => request<any>('/contracts/compliance'),

  // 8. Grounded AI Assistant
  queryAiAssistant: (question: string) =>
    request<{
      answer: string;
      evidence: Array<{ source: string; type: string; timestamp: string; detail: string }>;
      recommended_actions: string[];
      confidence_score: number;
    }>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  // 9. Reports & Exports
  getReportSummary: (reportType = 'ASSET_HEALTH') =>
    request<any>(`/reports/summary?report_type=${reportType}`),
};
