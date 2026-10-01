export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type HealthBand = 'healthy' | 'at_risk' | 'critical';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IoTStatus = 'online' | 'offline' | 'warning' | 'critical' | 'no_sensor';

export type PMStatus = 'ok' | 'due' | 'overdue';

export type ContractStatus = 'active' | 'renewal_initiated' | 'under_review' | 'renewed' | 'lapsed';

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  floor: string;
  healthScore: number; // 0 - 100
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  iotStatus: IoTStatus;
  lastFaultDate: string;
  lastFaultCode: string;
  pmStatus: PMStatus;
  contractStatus: 'AMC' | 'CMC' | 'None' | 'Expired';
  contractId?: string;
  installedDate: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  warrantyExpiry: string;
  coordinates?: { lat: number; lng: number };
  trend30d: number[]; // sparkline values
  riskContributingFactors: string[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  time: string;
  value: number;
}

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  reading: number;
  threshold: number;
  deviation: string;
  durationMinutes: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  severity: Severity;
}

export interface IoTDevice {
  id: string;
  assetId: string;
  assetName: string;
  location: string;
  sensorType: 'Temperature' | 'Vibration' | 'Pressure' | 'Humidity' | 'Current' | 'Flow';
  currentReading: number;
  unit: string;
  status: IoTStatus;
  minThreshold: number;
  maxThreshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  lastSeen: string;
  history: Record<'1h' | '6h' | '24h' | '7d' | '30d', TimeSeriesPoint[]>;
  anomalies: AnomalyEvent[];
}

export interface FaultInstance {
  id: string;
  date: string;
  assetId: string;
  assetName: string;
  location: string;
  severity: Severity;
  resolutionTimeHours: number;
  resolutionSummary: string;
  engineer: string;
}

export interface FaultCodeAnalytics {
  id: string;
  code: string;
  description: string;
  occurrences: number;
  affectedAssetsCount: number;
  affectedAssets: string[];
  avgResolutionTimeHours: number;
  firstSeen: string;
  lastSeen: string;
  severity: Severity;
  trend: 'up' | 'down' | 'stable';
  coOccurringWith: { code: string; percent: number }[];
  instances: FaultInstance[];
}

export interface PMScheduleEvent {
  id: string;
  assetId: string;
  assetName: string;
  type: string;
  engineer: string;
  engineerInitials: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'upcoming' | 'due_today' | 'overdue';
  contractRequired: boolean;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  type: 'Preventive' | 'Corrective' | 'Inspection' | 'Emergency';
  priority: Severity;
  assignedEngineer: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  description: string;
}

export interface Engineer {
  id: string;
  name: string;
  initials: string;
  role: string;
  activeWorkOrders: number;
  nextAvailable: string;
  avatarColor: string;
}

export interface ContractDoc {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}

export interface Contract {
  id: string;
  name: string;
  vendor: string;
  type: 'AMC' | 'CMC';
  coveredAssets: string[]; // asset IDs
  startDate: string;
  endDate: string;
  value: number;
  complianceScore: number; // 0 - 100
  pmCadence: string; // e.g. "Monthly (12x/yr)"
  status: ContractStatus;
  daysToExpiry: number;
  renewalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  renewalRiskReason: string;
  scope: string;
  documents: ContractDoc[];
  activityLog: { date: string; action: string; user: string }[];
}

export interface AlertItem {
  id: string;
  assetId: string;
  assetName: string;
  severity: Severity;
  title: string;
  readingSummary: string;
  durationMinutes: number;
  reason: string;
  recommendation: string;
  ctaLabel: string;
  ctaAction: 'inspect' | 'schedule_pm' | 'acknowledge' | 'assign' | 'renew_contract';
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
  category: 'iot' | 'fault' | 'pm' | 'contract';
  riskLevel: RiskLevel;
}

export interface ReportItem {
  id: string;
  title: string;
  type: 'Executive Asset Risk' | 'Contract Compliance Audit' | 'IoT Anomaly Summary' | 'Maintenance Monthly Review';
  period: string;
  generatedDate: string;
  status: 'Ready' | 'Generating' | 'Archived';
  author: string;
  fileSize: string;
  summary: string;
  metrics: { label: string; value: string | number }[];
}

export interface SystemStatusIndicator {
  name: string;
  status: 'Operational' | 'Degraded' | 'Down';
  lastUpdated: string;
  details: string;
  estimatedResolution?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  citations?: {
    type: 'asset' | 'fault' | 'sensor' | 'contract';
    id: string;
    label: string;
    link: string;
  }[];
}
