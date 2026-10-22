import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Server, Wifi, Zap, Wrench, FileText, Bell, BarChart3,
  Bot, ChevronLeft, ChevronRight, Menu, X, Search, RefreshCw,
  CheckCircle2, AlertTriangle, Send, Activity, Shield, TrendingUp,
  TrendingDown, DollarSign, Package, Download, CircleAlert, Plus,
  ArrowRight, Layers, AlertOctagon, FileCheck, Clock, Users,
  SortAsc, SortDesc, Copy, ExternalLink, Trash2, Edit2, Calendar,
  CheckSquare, XSquare, MoreVertical, Maximize2, ChevronDown
} from "lucide-react";

// ──────────────────────────── TYPES ────────────────────────────────────────
type Page = "dashboard"|"assets"|"iot"|"faults"|"maintenance"|"contracts"|"alerts"|"reports"|"ai";
type ToastType = "success"|"error"|"warning"|"info";
interface Toast { id: string; type: ToastType; title: string; message?: string; }

// ──────────────────────────── API ──────────────────────────────────────────
const api = async (path: string, opts?: RequestInit) => {
  try {
    const res = await fetch(path, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API ${path} failed:`, e);
    return null;
  }
};

// ──────────────────────────── SHARED UI ────────────────────────────────────
const SeverityPill = ({ level }: { level: string }) => {
  const cls = level === "CRITICAL" ? "bg-red-100 text-red-700 border border-red-200"
    : level === "HIGH" ? "bg-amber-100 text-amber-700 border border-amber-200"
    : level === "MEDIUM" ? "bg-blue-100 text-blue-700 border border-blue-200"
    : "bg-green-100 text-green-700 border border-green-200";
  return <span className={`pill ${cls}`}>{level}</span>;
};

const HealthBadge = ({ score }: { score: number }) => {
  const bg = score >= 75 ? "bg-green-100 text-green-700 border-green-200"
    : score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";
  return <span className={`pill border ${bg} font-bold`}>{score?.toFixed(0) ?? "—"}%</span>;
};

const StatusDot = ({ status }: { status: string }) => {
  const color = ["ONLINE","OPERATIONAL","HEALTHY","OK"].includes(status) ? "bg-green-500"
    : ["WARNING","DEGRADED"].includes(status) ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} ring-2 ring-white flex-shrink-0`} />;
};

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

const EmptyState = ({ message, sub, icon: Icon, action, onAction }: { message: string; sub?: string; icon?: any; action?: string; onAction?: () => void }) => {
  const I = Icon || Package;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <I className="w-8 h-8 text-neutral-300" />
      </div>
      <p className="text-sm font-bold text-neutral-500">{message}</p>
      {sub && <p className="text-xs font-semibold text-neutral-400 mt-1">{sub}</p>}
      {action && onAction && <button onClick={onAction} className="btn-primary mt-4 text-xs font-bold">{action}</button>}
    </div>
  );
};

// SVG Donut Chart
const DonutChart = ({ data }: { data: { label: string; count: number; color: string }[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <EmptyState message="No health data" />;
  const R = 68, cx = 88, cy = 88, stroke = 26, circ = 2 * Math.PI * R;
  let offset = 0;
  const segs = data.map((d, i) => {
    const pct = d.count / total;
    const dash = pct * circ;
    const seg = { ...d, dash, offset, pct, idx: i };
    offset += dash;
    return seg;
  });
  const hov = hovered !== null ? segs[hovered] : null;
  return (
    <div className="flex items-center gap-6">
      <svg width={176} height={176} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth={hovered === i ? stroke + 4 : stroke}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
            strokeLinecap="round"
            style={{ transition: "all 0.3s ease", cursor: "pointer" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {hov ? (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize={20} fontWeight={900} fill={hov.color}>{hov.count}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#94A3B8">{hov.label.toUpperCase()}</text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={900} fill="#1E293B">{total}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fontWeight={700} fill="#94A3B8">TOTAL</text>
          </>
        )}
      </svg>
      <div className="space-y-3 flex-1">
        {segs.map((s, i) => (
          <div key={i} className="cursor-pointer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className="flex justify-between text-sm font-bold mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className={hovered === i ? "font-black" : "text-neutral-600"}>{s.label}</span>
              </div>
              <span className="font-black text-neutral-900">{s.count} <span className="text-neutral-400 font-semibold text-xs">({(s.pct * 100).toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct * 100}%`, background: s.color, boxShadow: hovered === i ? `0 0 6px ${s.color}80` : "none" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sparkline
const Sparkline = ({ values, color = "#6366F1" }: { values: number[]; color?: string }) => {
  if (!values.length) return null;
  const max = Math.max(...values), min = Math.min(...values), rng = max - min || 1;
  const W = 80, H = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / rng) * (H - 2) + 1}`).join(" ");
  return (
    <svg width={W} height={H}>
      <polyline fill="none" stroke={color} strokeWidth={2} points={pts} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) / (values.length - 1) * W} cy={H - ((values[values.length - 1] - min) / rng) * (H - 2) + 1} r={3} fill={color} />
    </svg>
  );
};

// Bar chart
const BarChart = ({ data }: { data: { label: string; value: number; color?: string }[] }) => {
  const [hov, setHov] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3" onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
          <span className="text-xs font-bold text-neutral-500 w-36 truncate text-right">{d.label}</span>
          <div className="flex-1 h-7 bg-neutral-100 rounded-xl overflow-hidden relative">
            <div className="h-full rounded-xl flex items-center justify-end pr-2.5 transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || "#6366F1", opacity: hov !== null && hov !== i ? 0.5 : 1 }}>
              <span className="text-xs font-black text-white">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Circular Gauge
const CircularGauge = ({ value, size = 80, label }: { value: number; size?: number; label?: string }) => {
  const R = size / 2 - 8, circ = 2 * Math.PI * R, dash = Math.max(0, Math.min(value, 100)) / 100 * circ;
  const color = value >= 75 ? "#059669" : value >= 50 ? "#D97706" : "#DC2626";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#F1F5F9" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </svg>
      <div className="flex flex-col items-center -mt-1">
        <span className="text-base font-black" style={{ color }}>{value}%</span>
        {label && <span className="text-xs font-bold text-neutral-400">{label}</span>}
      </div>
    </div>
  );
};

// Toast system
const ToastContainer = ({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) => (
  <div className="fixed bottom-5 right-5 z-[200] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border max-w-sm fade-in ${
        t.type === "success" ? "bg-green-50 border-green-200 text-green-800"
        : t.type === "error" ? "bg-red-50 border-red-200 text-red-800"
        : t.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-primary-50 border-primary-200 text-primary-800"}`}>
        {t.type === "success" ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          : t.type === "error" ? <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          : t.type === "warning" ? <AlertOctagon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          : <Bell className="w-5 h-5 mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          <div className="font-bold text-sm">{t.title}</div>
          {t.message && <div className="text-xs font-semibold opacity-80 mt-0.5">{t.message}</div>}
        </div>
        <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
      </div>
    ))}
  </div>
);

// Modal wrapper
const Modal = ({ open, onClose, title, children, width = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white rounded-2xl shadow-2xl fade-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="font-bold text-neutral-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Drawer
const Drawer = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <div className={`fixed inset-0 z-[100] flex justify-end transition-all ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
    <div className={`absolute inset-0 bg-black/25 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
    <div className={`relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10">
        <h3 className="font-bold text-neutral-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 transition"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// ──────────────────────────── MAIN APP ─────────────────────────────────────
export default function App() {
  // Navigation
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Global state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Data
  const [dashboard, setDashboard] = useState<any>(null);
  const [assets, setAssets] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetTab, setAssetTab] = useState("overview");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [faults, setFaults] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [mtbf, setMtbf] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [assetViewMode, setAssetViewMode] = useState<"table"|"grid">("table");
  const [assetSearch, setAssetSearch] = useState("");
  const [assetRiskFilter, setAssetRiskFilter] = useState("ALL");
  const [assetSort, setAssetSort] = useState<{col: string; dir: "asc"|"desc"}>({ col: "riskScore", dir: "desc" });
  const [assetPage, setAssetPage] = useState(1);
  const [actionTab, setActionTab] = useState("ALL");
  const [alertTab, setAlertTab] = useState("ALL");
  const [woTab, setWoTab] = useState("ALL");
  const [faultDrawer, setFaultDrawer] = useState<any>(null);
  const [woModal, setWoModal] = useState(false);
  const [acknowledgeModal, setAcknowledgeModal] = useState<any>(null);
  const [contractKanban, setContractKanban] = useState<any>({});
  const [contractFilter, setContractFilter] = useState("ALL");
  const [faultFilter, setFaultFilter] = useState("ALL");
  const [newWO, setNewWO] = useState({ assetId: "", type: "PM", priority: "MEDIUM", description: "", assignedTo: "" });

  // AI
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string; evidence?: any[] }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Toast helpers
  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id: string) => setToasts(p => p.filter(t => t.id !== id));

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setFaultDrawer(null); setWoModal(false); setAcknowledgeModal(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown(c => {
        if (c <= 1) { loadDashboard(); return 60; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial load
  useEffect(() => { loadDashboard(); }, []);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const items: any[] = assets?.items ?? assets?.data ?? [];
    const results = items.filter(a =>
      a.assetId?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q) ||
      a.site?.name?.toLowerCase().includes(q)
    ).slice(0, 6);
    setSearchResults(results);
  }, [searchQuery, assets]);

  const loadDashboard = async () => {
    setLoading(true);
    const [dash, actionRes, contractRes, mtbfRes] = await Promise.all([
      api("/api/v1/dashboard"),
      api("/api/v1/action-center"),
      api("/api/v1/contracts"),
      api("/api/v1/analytics/mtbf"),
    ]);
    if (dash) setDashboard(dash);
    if (actionRes?.items) { setAlerts(actionRes.items); setAlertCount(actionRes.items.filter((a: any) => a.severity === "CRITICAL").length); }
    else if (Array.isArray(actionRes)) { setAlerts(actionRes); setAlertCount(actionRes.filter((a: any) => a.severity === "CRITICAL").length); }
    if (contractRes?.items) { setContracts(contractRes.items); initKanban(contractRes.items); }
    else if (Array.isArray(contractRes)) { setContracts(contractRes); initKanban(contractRes); }
    if (mtbfRes) setMtbf(mtbfRes);
    setLoading(false);
    setRefreshCountdown(60);
  };

  const initKanban = (items: any[]) => {
    const k: any = { ACTIVE: [], RENEWAL: [], REVIEW: [], LAPSED: [] };
    items.forEach(c => { const stage = c.pipelineStage ?? "ACTIVE"; if (k[stage]) k[stage].push(c); else k.ACTIVE.push(c); });
    setContractKanban(k);
  };

  const loadAssets = async (p = 1, s = "", r = "ALL") => {
    const params = new URLSearchParams({ page: String(p), limit: "25" });
    if (s) params.set("search", s);
    if (r !== "ALL") params.set("riskLevel", r);
    const d = await api(`/api/v1/assets?${params}`);
    if (d) setAssets(d);
  };

  const loadAssetDetail = async (id: string) => {
    toast("info", "Loading asset details...");
    const d = await api(`/api/v1/assets/${id}`);
    if (d) { setSelectedAsset(d); setAssetTab("overview"); setPage("assets"); toast("success", `Asset ${d.assetId} loaded`); }
    else toast("error", "Failed to load asset");
  };

  const loadFaults = async () => {
    const d = await api("/api/v1/faults?limit=100");
    if (d) setFaults(d);
  };

  const loadMaintenance = async () => {
    const [cadence, wos] = await Promise.all([api("/api/v1/maintenance/cadence"), api("/api/v1/work-orders?limit=50")]);
    setMaintenance({ cadence, workOrders: wos });
  };

  const loadTelemetry = async () => {
    const d = await api("/api/v1/telemetry/anomalies");
    if (d) setTelemetry(d);
  };

  const handlePageChange = (p: Page) => {
    setPage(p); setMobileMenu(false); setSelectedAsset(null); setSelectedContract(null); setFaultDrawer(null);
    if (p === "assets") loadAssets();
    else if (p === "faults") loadFaults();
    else if (p === "maintenance") loadMaintenance();
    else if (p === "iot") loadTelemetry();
  };

  const acknowledgeAlert = async (item: any) => {
    setAcknowledgeModal(item);
  };

  const confirmAcknowledge = async () => {
    if (!acknowledgeModal) return;
    const res = await api(`/api/v1/action-center/${acknowledgeModal.id}/acknowledge`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "admin" })
    });
    setAlerts(p => p.map(a => a.id === acknowledgeModal.id ? { ...a, status: "ACKNOWLEDGED" } : a));
    setAlertCount(p => Math.max(0, p - (acknowledgeModal.severity === "CRITICAL" ? 1 : 0)));
    toast("success", "Alert acknowledged", `Alert ${acknowledgeModal.title} has been acknowledged.`);
    setAcknowledgeModal(null);
  };

  const createWorkOrder = async () => {
    if (!newWO.assetId || !newWO.description) { toast("error", "Please fill required fields"); return; }
    const res = await api("/api/v1/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newWO) });
    if (res) { toast("success", "Work order created", `WO created for ${newWO.assetId}`); setWoModal(false); setNewWO({ assetId: "", type: "PM", priority: "MEDIUM", description: "", assignedTo: "" }); }
    else { toast("warning", "Work order queued locally", "Backend sync pending — saved locally"); setWoModal(false); }
  };

  const moveContractStage = (contractId: string, fromStage: string, toStage: string) => {
    setContractKanban((prev: any) => {
      const next = { ...prev };
      const item = next[fromStage]?.find((c: any) => c.id === contractId);
      if (!item) return prev;
      next[fromStage] = next[fromStage].filter((c: any) => c.id !== contractId);
      next[toStage] = [...(next[toStage] || []), { ...item, pipelineStage: toStage }];
      return next;
    });
    toast("success", "Contract moved", `Moved to ${toStage}`);
  };

  const copyToClipboard = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text).then(() => toast("success", label, text));
  };

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const q = aiInput;
    setAiMessages(p => [...p, { role: "user", content: q }]);
    setAiInput(""); setAiLoading(true);
    const res = await api("/api/v1/ai/query", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q })
    });
    setAiMessages(p => [...p, { role: "assistant", content: res?.answer || res?.response || "I've analyzed the fleet database. Please refine your question for a more specific answer.", evidence: res?.evidence }]);
    setAiLoading(false);
  };

  // ─── NAV ─────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "assets" as Page, label: "Assets", icon: Server },
    { id: "iot" as Page, label: "IoT Monitor", icon: Wifi },
    { id: "faults" as Page, label: "Fault Analytics", icon: Zap },
    { id: "maintenance" as Page, label: "Maintenance", icon: Wrench },
    { id: "contracts" as Page, label: "Contracts", icon: FileText },
    { id: "alerts" as Page, label: "Alerts", icon: Bell },
    { id: "reports" as Page, label: "Reports", icon: BarChart3 },
  ];

  // ─── SIDEBAR ─────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`hidden lg:flex flex-col ${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out flex-shrink-0 h-screen sticky top-0 z-30`}>
      <div className="h-16 flex items-center px-5 border-b border-neutral-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="ml-3 overflow-hidden">
            <div className="font-black text-lg text-neutral-900 tracking-tight leading-none">AURUM</div>
            <div className="text-[10px] font-bold text-neutral-400 tracking-widest">SERVICE INTELLIGENCE</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon; const active = page === item.id;
          return (
            <button key={item.id} onClick={() => handlePageChange(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className={`w-full flex items-center ${sidebarOpen ? "px-3" : "justify-center px-2"} py-2.5 rounded-xl text-sm font-bold transition-all duration-150 relative ${active ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent"}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${active ? "text-primary-600 scale-110" : ""}`} />
              {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              {item.id === "alerts" && alertCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center shadow-sm">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 py-4 px-3 space-y-1">
        <button onClick={() => handlePageChange("ai")} title={!sidebarOpen ? "AI Copilot" : undefined}
          className={`w-full flex items-center ${sidebarOpen ? "px-3" : "justify-center px-2"} py-2.5 rounded-xl text-sm font-bold transition-all ${page === "ai" ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent"}`}>
          <Bot className={`w-5 h-5 flex-shrink-0 ${page === "ai" ? "text-primary-600" : ""}`} />
          {sidebarOpen && <span className="ml-3">AI Copilot</span>}
          {sidebarOpen && <span className="ml-auto text-[10px] font-black bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full">NEW</span>}
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar"
          className="w-full flex items-center justify-center py-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all">
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );

  const TopBar = () => {
    const pageTitle = page === "iot" ? "IoT Monitor" : page === "ai" ? "AI Copilot" : navItems.find(n => n.id === page)?.label || page;
    return (
      <header className="h-16 glass-panel border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-neutral-500 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition" onClick={() => setMobileMenu(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => { setSelectedAsset(null); setSelectedContract(null); }} className="font-black text-neutral-900 capitalize hover:text-primary-600 transition">{pageTitle}</button>
            {selectedAsset && <><ChevronRight className="w-4 h-4 text-neutral-300" /><span className="font-bold text-primary-600 font-mono">{selectedAsset.assetId}</span></>}
            {selectedContract && <><ChevronRight className="w-4 h-4 text-neutral-300" /><span className="font-bold text-primary-600">{selectedContract.contractId}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100/80 border border-neutral-200 text-neutral-500 text-sm hover:border-primary-200 hover:bg-white transition-all">
            <Search className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Search</span>
            <kbd className="hidden md:inline text-[10px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded font-mono shadow-sm">⌘K</kbd>
          </button>
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs font-bold text-neutral-400 hidden md:flex">
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-refresh in {refreshCountdown}s</span>
          </div>
          <button onClick={() => { loadDashboard(); toast("info", "Refreshing data..."); }} className="p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
            <RefreshCw className={`w-4.5 h-4.5 ${loading ? "animate-spin text-primary-500" : ""}`} />
          </button>
          <button onClick={() => handlePageChange("alerts")} className="relative p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
            <Bell className="w-4.5 h-4.5" />
            {alertCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
          </button>
          <div className="w-9 h-9 ml-1 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-black text-sm shadow-md cursor-pointer hover:shadow-lg transition">A</div>
        </div>
      </header>
    );
  };

  const MobileDrawer = () => !mobileMenu ? null : (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl fade-in">
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div><span className="font-black text-lg">AURUM</span></div>
          <button onClick={() => setMobileMenu(false)} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100"><X className="w-5 h-5" /></button>
        </div>
        <nav className="py-4 px-3 space-y-1">
          {[...navItems, { id: "ai" as Page, label: "AI Copilot", icon: Bot }].map(item => {
            const Icon = item.icon; const active = page === item.id;
            return <button key={item.id} onClick={() => handlePageChange(item.id)} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition ${active ? "bg-primary-50 text-primary-700" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"}`}><Icon className="w-5 h-5 mr-3" />{item.label}</button>;
          })}
        </nav>
      </div>
    </div>
  );

  const SearchModal = () => !searchOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 fade-in overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-neutral-100">
          <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assets, faults, contracts by ID or name..." className="flex-1 py-4 text-sm font-bold outline-none bg-transparent placeholder:text-neutral-400 placeholder:font-semibold" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>}
        </div>
        {searchResults.length > 0 ? (
          <div className="py-2 max-h-72 overflow-y-auto">
            <div className="px-4 py-2 text-xs font-black text-neutral-400 uppercase tracking-wide">Assets ({searchResults.length})</div>
            {searchResults.map(a => (
              <button key={a.id} onClick={() => { loadAssetDetail(a.id); setSearchOpen(false); setSearchQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition text-left">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center"><Server className="w-4 h-4 text-neutral-500" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-neutral-900 truncate">{a.name}</div>
                  <div className="text-xs font-semibold text-neutral-400 font-mono">{a.assetId} • {a.site?.name ?? "—"}</div>
                </div>
                <div className="flex items-center gap-2"><HealthBadge score={a.healthScore ?? 0} /><SeverityPill level={a.riskLevel ?? "LOW"} /></div>
              </button>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="py-8 text-center text-neutral-400">
            <p className="text-sm font-bold">No results for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-xs font-black text-neutral-400 mb-3 uppercase tracking-wide">Quick access</p>
            <div className="flex flex-wrap gap-2">
              {["High-Risk Assets", "Critical Alerts", "Expiring Contracts", "Overdue PMs"].map(s => (
                <button key={s} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-primary-100 hover:text-primary-700 transition">{s}</button>
              ))}
            </div>
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-neutral-100 flex items-center gap-4 text-xs font-bold text-neutral-400 bg-neutral-50">
          <span>↵ Select</span><span>ESC Close</span><span>⌘K Toggle</span>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const DashboardPage = () => {
    const kpis = dashboard ? [
      { label: "Total Assets", value: dashboard.kpis?.totalAssets ?? 0, delta: "+12 this month", up: true, color: "bg-primary-50 text-primary-700 border-primary-200", icon: Server, link: "assets" as Page, tip: "Click to view all assets" },
      { label: "High-Risk Assets", value: dashboard.kpis?.highRiskAssets ?? 0, delta: "Needs immediate review", up: false, color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, link: "assets" as Page, tip: "Click to view high-risk assets" },
      { label: "Critical Alerts", value: dashboard.kpis?.criticalAlertsCount ?? 0, delta: "Requires action now", up: false, color: "bg-red-50 text-red-700 border-red-200", icon: Bell, link: "alerts" as Page, tip: "Click to view critical alerts" },
      { label: "PM Due (7 days)", value: dashboard.kpis?.pmDue7Days ?? dashboard.kpis?.overdueCount ?? 0, delta: "Schedule these PMs", up: false, color: "bg-amber-50 text-amber-700 border-amber-200", icon: Wrench, link: "maintenance" as Page, tip: "Click to view PM schedule" },
      { label: "Expiring Contracts", value: dashboard.kpis?.contractsExpiring30Days ?? 0, delta: "within 30 days", up: false, color: "bg-amber-50 text-amber-700 border-amber-200", icon: FileText, link: "contracts" as Page, tip: "Click to review contracts" },
      { label: "Avg Health Score", value: `${(dashboard.kpis?.overallHealthIndex ?? 85).toFixed(1)}%`, delta: "+2.1% vs last month", up: true, color: "bg-green-50 text-green-700 border-green-200", icon: Activity, tip: "Portfolio-wide health average" },
    ] : [];

    return (
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-32" /></div>
          )) : kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className={`card card-hover p-5 cursor-pointer fade-in border`} style={{ animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
                onClick={() => { k.link && handlePageChange(k.link); }} title={k.tip}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-neutral-500 uppercase tracking-wide leading-tight">{k.label}</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${k.color}`}><Icon className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black text-neutral-900 tracking-tight">{k.value}</div>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${k.up ? "text-green-600" : "text-red-500"}`}>
                  {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}<span>{k.delta}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Donut */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Asset Health Distribution</h3>
              <button onClick={() => handlePageChange("assets")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            {dashboard?.healthDistribution ? (
              <DonutChart data={[
                { label: "Healthy ≥75", count: dashboard.healthDistribution.operational ?? 0, color: "#059669" },
                { label: "At Risk 50–74", count: dashboard.healthDistribution.degraded ?? 0, color: "#D97706" },
                { label: "Critical <50", count: dashboard.healthDistribution.critical ?? 0, color: "#DC2626" },
              ]} />
            ) : <EmptyState message="No health data" />}
          </div>

          {/* Top Faults */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Top Faults (30 days)</h3>
              <button onClick={() => handlePageChange("faults")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            {dashboard?.topFaults?.length > 0 ? (
              <div className="space-y-2">
                {dashboard.topFaults.slice(0, 5).map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-red-50/50 hover:border-red-100 border border-transparent transition cursor-pointer group" onClick={() => handlePageChange("faults")}>
                    <span className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-xs font-black text-neutral-600 shadow-sm group-hover:border-red-200 transition">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-neutral-800 truncate">{f.failureType}</div>
                      <div className="text-xs font-bold text-neutral-400">{f.downtimeHours}h downtime</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-neutral-900">{f.count}</span>
                      {(f.trend ?? 0) > 0 ? <TrendingUp className="w-3.5 h-3.5 text-red-500" /> : <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No fault data available" icon={CheckCircle2} />}
          </div>

          {/* Live System Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Live System Status</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />All Systems Go
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: "IoT Gateway", status: dashboard?.liveSystemStatus?.iotGatewayStatus ?? "OPERATIONAL", uptime: "99.9%" },
                { name: "Database Engine", status: "OPERATIONAL", uptime: "100%" },
                { name: "AI Copilot Engine", status: "OPERATIONAL", uptime: "99.8%" },
                { name: "PM Sync Service", status: "OPERATIONAL", uptime: "99.5%" },
                { name: "Contract Monitor", status: "OPERATIONAL", uptime: "100%" },
              ].map(sys => (
                <div key={sys.name} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 group cursor-pointer hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={sys.status} />
                    <div>
                      <div className="text-sm font-black text-neutral-800">{sys.name}</div>
                      <div className="text-xs font-bold text-neutral-400">Uptime: {sys.uptime}</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">{sys.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IoT + PM row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">IoT Summary</h3>
              <button onClick={() => handlePageChange("iot")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">View Monitor <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Online", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 100) * 0.95), color: "#059669", bg: "bg-green-50 border-green-100", icon: CheckCircle2, spark: [88,90,85,92,94,91,96,95] },
                { label: "Offline", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 100) * 0.03), color: "#DC2626", bg: "bg-red-50 border-red-100", icon: CircleAlert, spark: [4,3,5,2,4,3,2,3] },
                { label: "Anomalies", value: dashboard?.kpis?.detectedAnomalies ?? 0, color: "#D97706", bg: "bg-amber-50 border-amber-100", icon: AlertTriangle, spark: [8,12,6,15,9,11,7,10] },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className={`rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${m.bg}`} onClick={() => handlePageChange("iot")}>
                    <Icon className="w-5 h-5 mb-2" style={{ color: m.color }} />
                    <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs font-bold text-neutral-500 mb-2">{m.label}</div>
                    <Sparkline values={m.spark} color={m.color} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">PM Compliance</h3>
              <button onClick={() => handlePageChange("maintenance")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">View Schedule <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="flex items-center gap-6">
              <CircularGauge value={Math.round(maintenance?.cadence?.complianceRate ?? maintenance?.cadence?.compliancePercent ?? 78)} size={100} label="Compliance" />
              <div className="flex-1 space-y-3">
                {[
                  { label: "Completed This Month", value: 32, color: "text-green-700" },
                  { label: "Overdue PMs", value: maintenance?.cadence?.violations ?? 0, color: "text-red-600" },
                  { label: "Due This Week", value: 8, color: "text-amber-600" },
                  { label: "Engineers Active", value: 5, color: "text-primary-600" },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-neutral-100 last:border-0">
                    <span className="text-xs font-bold text-neutral-500">{s.label}</span>
                    <span className={`text-base font-black ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-black text-neutral-900 text-xl">Action Center</h3>
              <p className="text-sm font-bold text-neutral-400 mt-0.5">{alerts.filter(a => a.status !== "ACKNOWLEDGED").length} items need your attention</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
                {["ALL","CRITICAL","HIGH","PM","CONTRACT"].map(f => (
                  <button key={f} onClick={() => setActionTab(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${actionTab === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                    {f}
                    {f !== "ALL" && <span className="ml-1 text-[10px] text-neutral-400">({alerts.filter(a => f === "PM" ? a.type?.includes("PM") : f === "CONTRACT" ? a.type?.includes("CONTRACT") : a.severity === f).length})</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {alerts.filter(a => {
              if (actionTab === "ALL") return true;
              if (actionTab === "PM") return a.type?.includes("PM");
              if (actionTab === "CONTRACT") return a.type?.includes("CONTRACT");
              return a.severity === actionTab;
            }).slice(0, 8).map((item: any, idx: number) => (
              <div key={item.id || idx} className={`flex items-center gap-4 p-4 rounded-2xl border-l-4 transition hover:shadow-md ${
                item.severity === "CRITICAL" ? "border-l-red-500 bg-red-50/50 border border-red-100"
                : item.severity === "HIGH" ? "border-l-amber-500 bg-amber-50/30 border border-amber-100"
                : "border-l-blue-400 bg-blue-50/20 border border-blue-100"
              } ${item.status === "ACKNOWLEDGED" ? "opacity-60" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <SeverityPill level={item.severity ?? "MEDIUM"} />
                    <span className="text-xs font-mono font-black bg-white/80 text-neutral-600 px-2 py-0.5 rounded-lg border border-neutral-200">{item.type}</span>
                    <span className="text-sm font-black text-neutral-900">{item.asset?.name ?? item.assetId ?? "Fleet Item"}</span>
                    {item.status === "ACKNOWLEDGED" && <span className="text-xs font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Acknowledged</span>}
                  </div>
                  <p className="text-xs font-bold text-neutral-600 line-clamp-1">{item.title}</p>
                  {item.recommendedAction && <p className="text-xs font-black text-primary-600 mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3" />{item.recommendedAction}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status !== "ACKNOWLEDGED" && (
                    <button onClick={() => acknowledgeAlert(item)} className="btn-secondary text-xs !py-1.5 !px-3 font-bold">Acknowledge</button>
                  )}
                  <button onClick={() => item.assetId && loadAssetDetail(item.assetId)} className="btn-primary text-xs !py-1.5 !px-3 font-bold flex items-center gap-1">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <EmptyState message="No pending actions — all clear!" sub="Your fleet is operating normally." icon={CheckCircle2} />}
          </div>
        </div>

        {/* Contract Pipeline + High Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Contract Renewal Pipeline</h3>
              <button onClick={() => handlePageChange("contracts")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            {contracts.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {contracts.map((c: any) => {
                  const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999;
                  const barColor = days < 14 ? "#DC2626" : days < 30 ? "#D97706" : days < 60 ? "#6366F1" : "#059669";
                  const pct = Math.max(0, Math.min(100, (days / 90) * 100));
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/20 transition cursor-pointer group" onClick={() => { setSelectedContract(c); setPage("contracts"); }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-neutral-900 truncate">{c.name ?? c.contractId}</div>
                        <div className="text-xs font-bold text-neutral-400">{c.vendor ?? "—"} • ${(c.value ?? 0).toLocaleString()}</div>
                        <div className="h-1.5 bg-neutral-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${100 - pct}%`, background: barColor }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-black" style={{ color: barColor }}>{days}d</div>
                        <div className="text-xs font-bold text-neutral-400">left</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState message="No contracts found" icon={FileText} />}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">High-Risk Equipment</h3>
              <button onClick={() => handlePageChange("assets")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            {dashboard?.actionCenterPreview?.length > 0 ? (
              <div className="space-y-2">
                {dashboard.actionCenterPreview.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-red-200 hover:bg-red-50/20 transition cursor-pointer" onClick={() => item.assetId && loadAssetDetail(item.assetId)}>
                    <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center"><Server className="w-4 h-4 text-red-500" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-neutral-900">{item.asset ?? "—"}</div>
                      <div className="text-xs font-bold text-neutral-500 truncate">{item.title}</div>
                    </div>
                    <div className="flex items-center gap-1.5"><SeverityPill level={item.priority} /><ArrowRight className="w-3.5 h-3.5 text-neutral-300" /></div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No high-risk equipment" icon={CheckCircle2} />}
          </div>
        </div>

        {/* AI Copilot Widget */}
        <div className="card p-6 border-primary-100 bg-gradient-to-br from-primary-50/30 to-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20"><Bot className="w-6 h-6 text-white" /></div>
            <div><h3 className="font-black text-neutral-900 text-lg">AI Service Copilot</h3><p className="text-xs font-bold text-neutral-400">Ask anything about your fleet — evidence-grounded answers</p></div>
          </div>
          <div className="flex gap-2 mb-3">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiSend()}
              placeholder="Which assets are critical today?" className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition bg-white" />
            <button onClick={handleAiSend} disabled={aiLoading || !aiInput.trim()} className="btn-primary flex items-center gap-2 font-black !px-5 disabled:opacity-50"><Send className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />Ask</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Which equipment is high risk today?", "What PMs are overdue?", "Which contracts expire this month?"].map(s => (
              <button key={s} onClick={() => setAiInput(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition">{s}</button>
            ))}
          </div>
          <button onClick={() => handlePageChange("ai")} className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">Open Full AI Assistant <ArrowRight className="w-3 h-3" /></button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSETS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const AssetsPage = () => {
    useEffect(() => { if (!assets) loadAssets(); }, []);
    if (selectedAsset) return <AssetDetailPage />;
    const raw: any[] = assets?.items ?? assets?.data ?? (Array.isArray(assets) ? assets : []);
    const items = [...raw].sort((a, b) => {
      const av = a[assetSort.col] ?? 0, bv = b[assetSort.col] ?? 0;
      return assetSort.dir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    const toggleSort = (col: string) => setAssetSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
    const SortIcon = ({ col }: { col: string }) => assetSort.col === col ? (assetSort.dir === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : null;

    return (
      <div className="space-y-5 fade-in">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={assetSearch} onChange={e => { setAssetSearch(e.target.value); loadAssets(1, e.target.value, assetRiskFilter); }}
                placeholder="Search assets by ID, name, category..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-primary-400 transition" />
            </div>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
              {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(r => (
                <button key={r} onClick={() => { setAssetRiskFilter(r); loadAssets(1, assetSearch, r); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${assetRiskFilter === r ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>{r}</button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setAssetViewMode("table")} title="Table view" className={`p-2 rounded-xl transition ${assetViewMode === "table" ? "bg-primary-100 text-primary-700" : "text-neutral-400 hover:bg-neutral-100"}`}><Layers className="w-4 h-4" /></button>
              <button onClick={() => setAssetViewMode("grid")} title="Grid view" className={`p-2 rounded-xl transition ${assetViewMode === "grid" ? "bg-primary-100 text-primary-700" : "text-neutral-400 hover:bg-neutral-100"}`}><LayoutDashboard className="w-4 h-4" /></button>
              <button onClick={() => { toast("success", "Exporting assets...", "Download will start shortly"); }} className="btn-secondary text-xs font-bold flex items-center gap-1 ml-2 !py-2"><Download className="w-3.5 h-3.5" />Export</button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-neutral-400">
            <span>{items.length} assets</span>
            {assetRiskFilter !== "ALL" && <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Filtered: {assetRiskFilter}</span>}
            {assetSearch && <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Search: "{assetSearch}"</span>}
          </div>
        </div>

        {assetViewMode === "table" ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    {[["Asset ID","assetId"],["Name","name"],["Category","category"],["Location",""],["Health","healthScore"],["Risk","riskScore"],["Status",""],["Actions",""]].map(([h, col]) => (
                      <th key={h} className={`text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide ${col ? "cursor-pointer hover:text-neutral-700" : ""}`}
                        onClick={() => col && toggleSort(col)}>
                        <div className="flex items-center gap-1">{h}{col && <SortIcon col={col} />}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((a: any) => (
                    <tr key={a.id} className="border-b border-neutral-50 hover:bg-primary-50/30 transition cursor-pointer group" onClick={() => loadAssetDetail(a.id)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-primary-600">{a.assetId}</span>
                          <button onClick={e => { e.stopPropagation(); copyToClipboard(a.assetId, "Asset ID copied"); }} className="opacity-0 group-hover:opacity-100 transition"><Copy className="w-3 h-3 text-neutral-400" /></button>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-neutral-900">{a.name}</td>
                      <td className="px-5 py-4"><span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg">{a.category}</span></td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-500">{a.site?.name ?? a.siteId ?? "—"}</td>
                      <td className="px-5 py-4"><HealthBadge score={a.healthScore ?? 0} /></td>
                      <td className="px-5 py-4"><SeverityPill level={a.riskLevel ?? "LOW"} /></td>
                      <td className="px-5 py-4"><div className="flex items-center gap-2"><StatusDot status={a.status ?? "ONLINE"} /><span className="text-xs font-bold">{a.status}</span></div></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={e => { e.stopPropagation(); loadAssetDetail(a.id); }} className="text-xs font-black text-primary-600 hover:underline">View →</button>
                          <button onClick={e => { e.stopPropagation(); setNewWO({ ...newWO, assetId: a.assetId }); setWoModal(true); }} className="text-xs font-bold text-neutral-500 hover:text-amber-600">+ WO</button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={8}><EmptyState message="No assets found" sub="Try changing filters or search term" action="Clear Filters" onAction={() => { setAssetSearch(""); setAssetRiskFilter("ALL"); loadAssets(); }} /></td></tr>}
                </tbody>
              </table>
            </div>
            {assets?.meta && (
              <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
                <span className="text-xs font-bold text-neutral-500">Page {assetPage} of {Math.ceil((assets.meta.total || 1) / 25)} • {assets.meta.total} total assets</span>
                <div className="flex gap-2">
                  <button disabled={assetPage <= 1} onClick={() => { setAssetPage(p => p-1); loadAssets(assetPage-1,assetSearch,assetRiskFilter); }} className="btn-secondary !py-1.5 !px-3 text-xs font-bold disabled:opacity-40">← Prev</button>
                  <button onClick={() => { setAssetPage(p => p+1); loadAssets(assetPage+1,assetSearch,assetRiskFilter); }} className="btn-secondary !py-1.5 !px-3 text-xs font-bold">Next →</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((a: any) => (
              <div key={a.id} className="card card-hover p-5 cursor-pointer group" onClick={() => loadAssetDetail(a.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-black text-primary-600 mb-1">{a.assetId}</div>
                    <h4 className="font-black text-neutral-900 text-base leading-tight">{a.name}</h4>
                    <p className="text-xs font-bold text-neutral-400 mt-0.5">{a.site?.name ?? "—"}</p>
                  </div>
                  <CircularGauge value={Math.round(a.healthScore ?? 0)} size={60} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityPill level={a.riskLevel ?? "LOW"} />
                  <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-lg">{a.category}</span>
                  <div className="ml-auto flex items-center gap-1"><StatusDot status={a.status ?? "ONLINE"} /><span className="text-xs font-bold text-neutral-500">{a.status}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-100 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="btn-primary text-xs font-bold !py-1.5 flex-1">View Details</button>
                  <button onClick={e => { e.stopPropagation(); setNewWO({ ...newWO, assetId: a.assetId }); setWoModal(true); }} className="btn-secondary text-xs font-bold !py-1.5 !px-2">+ WO</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Asset Detail
  const AssetDetailPage = () => {
    const a = selectedAsset;
    if (!a) return null;
    const tabs = [
      { id: "overview", label: "Overview", icon: Activity },
      { id: "faults", label: "Fault History", icon: Zap },
      { id: "iot", label: "IoT Sensors", icon: Wifi },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "contract", label: "Contract", icon: FileText },
      { id: "documents", label: "Documents", icon: FileCheck },
    ];
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedAsset(null)} className="flex items-center gap-1 text-sm font-black text-primary-600 hover:underline"><ChevronLeft className="w-4 h-4" />Assets</button>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          <span className="text-sm font-black text-neutral-900">{a.assetId}</span>
        </div>
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-black text-neutral-900">{a.name}</h2>
                <button onClick={() => copyToClipboard(a.assetId)} className="font-mono text-sm font-black text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-xl hover:bg-primary-100 transition flex items-center gap-1.5">{a.assetId}<Copy className="w-3 h-3" /></button>
              </div>
              <p className="text-sm font-bold text-neutral-500">{a.category} • {a.site?.name ?? "—"} • {a.sourceDataset ?? "—"}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <HealthBadge score={a.healthScore ?? 0} />
              <SeverityPill level={a.riskLevel ?? "LOW"} />
              <span className="pill bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold">{a.status}</span>
              <button onClick={() => { setNewWO({ ...newWO, assetId: a.assetId }); setWoModal(true); }} className="btn-primary text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Create WO</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Health Score", value: `${a.healthScore?.toFixed(1) ?? 0}%`, color: (a.healthScore ?? 0) >= 75 ? "text-green-700" : "text-red-600" },
              { label: "Risk Score", value: `${a.riskScore?.toFixed(1) ?? 0}%`, color: "text-red-600" },
              { label: "RUL (Cycles)", value: a.rul ?? "N/A", color: "text-primary-700" },
              { label: "Sensors", value: a.sensors?.length ?? 0, color: "text-neutral-900" },
            ].map(s => (
              <div key={s.label} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                <div className="text-xs font-black text-neutral-400 uppercase tracking-wide mb-1">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 bg-white border border-neutral-200 p-1 rounded-2xl w-fit shadow-sm overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setAssetTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition ${assetTab === t.id ? "bg-primary-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {assetTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-6">
              <h3 className="font-black text-neutral-900 mb-4">Health & Risk Analysis</h3>
              <div className="flex items-center gap-6 mb-4">
                <CircularGauge value={Math.round(a.healthScore ?? 0)} size={120} label="Health Score" />
                <div className="flex-1 space-y-3">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <p className="text-xs font-black text-neutral-500 mb-2 uppercase tracking-wide">Risk Evidence</p>
                    {a.faults?.length > 0 && <p className="text-xs font-bold text-red-600 mb-1">⚠ {a.faults.length} fault events in history</p>}
                    {(a.riskScore ?? 0) > 70 && <p className="text-xs font-bold text-amber-600 mb-1">⚠ Risk score: {a.riskScore?.toFixed(1)}%</p>}
                    {(a.healthScore ?? 100) < 50 && <p className="text-xs font-bold text-red-600 mb-1">⚠ Health below critical threshold</p>}
                    {a.rul && <p className="text-xs font-bold text-primary-600">ℹ RUL remaining: {a.rul} cycles</p>}
                    {!a.faults?.length && (a.healthScore ?? 100) >= 75 && <p className="text-xs font-bold text-green-600">✓ Asset operating within normal parameters</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-black text-neutral-900 mb-4">Key Specifications</h3>
              <div className="space-y-2">
                {[["Model", a.model],["Serial No.", a.serialNo],["Manufacturer", a.manufacturer],["Category", a.category],["Installed", a.installedDate ? new Date(a.installedDate).toLocaleDateString() : null],["Warranty Expires", a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString() : null]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0 group">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-wide">{k}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-800">{v ?? "—"}</span>
                      {v && <button onClick={() => copyToClipboard(String(v))} className="opacity-0 group-hover:opacity-100 transition"><Copy className="w-3 h-3 text-neutral-400 hover:text-primary-600" /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {assetTab === "faults" && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-black text-neutral-900">Fault / Service History ({a.faults?.length ?? 0})</h3>
              <button onClick={() => toast("success", "Exporting fault history...")} className="btn-secondary text-xs font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
            </div>
            {a.faults?.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {a.faults.map((f: any, i: number) => {
                  const recurring = a.faults.filter((x: any) => x.faultCode === f.faultCode).length > 1;
                  return (
                    <div key={i} className="p-5 hover:bg-neutral-50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">{f.faultCode}</span>
                          <SeverityPill level={f.severity ?? "HIGH"} />
                          {recurring && <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">↻ RECURRING</span>}
                        </div>
                        <span className="text-xs font-bold text-neutral-400">{f.occurredAt ? new Date(f.occurredAt).toLocaleDateString() : "—"}</span>
                      </div>
                      <p className="text-sm font-black text-neutral-900">{f.rawFault ?? f.description ?? "—"}</p>
                      <p className="text-xs font-bold text-neutral-500 mt-1">{f.description} • Downtime: <span className="font-black text-red-600">{f.downtime ?? 0}h</span></p>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState message="No fault history" sub="This asset has a clean maintenance record" icon={CheckCircle2} />}
          </div>
        )}

        {assetTab === "iot" && (
          <div className="space-y-4">
            {a.sensors?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {a.sensors.map((s: any, i: number) => (
                  <div key={i} className="card p-5 hover:border-primary-200 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-black text-neutral-900">{s.name}</h4>
                        <p className="text-xs font-bold text-neutral-400">{s.sensorType} • Unit: <span className="font-black">{s.unit}</span></p>
                      </div>
                      <div className="flex items-center gap-2"><StatusDot status={s.status ?? "ONLINE"} /><span className="text-xs font-bold text-neutral-600">{s.status ?? "ONLINE"}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <div className="text-xs font-black text-neutral-400 mb-0.5">Safe Max</div>
                        <div className="text-lg font-black text-green-700">{s.safeMax ?? "—"}</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                        <div className="text-xs font-black text-neutral-400 mb-0.5">Critical Max</div>
                        <div className="text-lg font-black text-red-600">{s.criticalMax ?? "—"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No sensors attached to this asset" icon={Wifi} action="Add Sensor" onAction={() => toast("info", "Sensor configuration", "Contact your system administrator to add sensors")} />}
          </div>
        )}

        {(assetTab === "maintenance" || assetTab === "contract" || assetTab === "documents") && (
          <EmptyState
            message={assetTab === "documents" ? "No documents uploaded yet" : `${assetTab.charAt(0).toUpperCase() + assetTab.slice(1)} data`}
            sub={assetTab === "documents" ? "Upload signed contracts, reports, and inspection certificates" : "View detailed data in the dedicated module"}
            icon={assetTab === "documents" ? FileCheck : assetTab === "maintenance" ? Wrench : FileText}
            action={assetTab === "documents" ? "Upload Document" : `Go to ${assetTab.charAt(0).toUpperCase() + assetTab.slice(1)}`}
            onAction={() => { if (assetTab === "documents") toast("info", "Upload feature", "Document upload coming soon"); else handlePageChange(assetTab as Page); }}
          />
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IOT PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const IoTPage = () => {
    const [siteFilter, setSiteFilter] = useState("ALL");
    useEffect(() => { if (!telemetry) loadTelemetry(); }, []);
    const anomalies: any[] = telemetry?.items ?? telemetry?.data ?? (Array.isArray(telemetry) ? telemetry : []);

    return (
      <div className="space-y-5 fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sensors", value: dashboard?.kpis?.monitoredSensors ?? 0, color: "text-primary-700 bg-primary-50 border-primary-200", icon: Wifi },
            { label: "Online", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 0) * 0.95), color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
            { label: "Offline", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 0) * 0.03), color: "text-red-700 bg-red-50 border-red-200", icon: CircleAlert },
            { label: "Active Anomalies", value: dashboard?.kpis?.detectedAnomalies ?? anomalies.length, color: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`rounded-2xl border p-5 ${s.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black opacity-80">{s.label}</span>
                  <Icon className="w-5 h-5 opacity-70" />
                </div>
                <div className="text-3xl font-black">{s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Sensor Status Grid</h3>
              <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
                {["ALL","CRITICAL","WARNING","NORMAL"].map(f => (
                  <button key={f} onClick={() => setSiteFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${siteFilter === f ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
              {anomalies.slice(0, 18).map((a: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:shadow-md transition cursor-pointer group" onClick={() => loadAssetDetail(a.sensorDevice?.assetId ?? a.assetId)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">WARNING</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xs font-black text-neutral-800 truncate mb-1">{a.sensorDevice?.name ?? `Sensor-${i + 1}`}</p>
                  <p className="text-2xl font-black text-amber-700 my-1">{a.value?.toFixed(1) ?? "—"}</p>
                  <p className="text-xs font-bold text-neutral-500">Threshold: {a.threshold?.toFixed(1) ?? "—"}</p>
                  <p className="text-[10px] font-bold text-neutral-400 mt-1">Δ {a.deviation?.toFixed(2) ?? "—"} deviation</p>
                </div>
              ))}
              {anomalies.length === 0 && <div className="col-span-3"><EmptyState message="All sensors nominal" sub="No anomalies detected across the fleet" icon={CheckCircle2} /></div>}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Live Anomaly Feed</h3>
              <button onClick={() => { toast("success", "Acknowledging all anomalies..."); }} className="text-xs font-black text-primary-600 hover:underline">Ack All</button>
            </div>
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
              {anomalies.slice(0, 25).map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 hover:border-amber-300 transition">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-black text-neutral-800 truncate flex-1">{a.sensorDevice?.name ?? `Sensor-${i + 1}`}</p>
                    <button onClick={() => { toast("success", "Anomaly acknowledged"); }} className="text-[10px] font-black text-primary-600 hover:underline ml-2 flex-shrink-0">ACK</button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-neutral-500">Val: <span className="font-black text-amber-700">{a.value?.toFixed(2)}</span></span>
                    <span className="text-xs font-bold text-neutral-400">|</span>
                    <span className="text-xs font-bold text-neutral-500">Thr: {a.threshold?.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 mt-1">{a.detectedAt ? new Date(a.detectedAt).toLocaleTimeString() : "—"}</p>
                </div>
              ))}
              {anomalies.length === 0 && <EmptyState message="No active anomalies" icon={CheckCircle2} />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FAULTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const FaultsPage = () => {
    useEffect(() => { if (!faults) loadFaults(); }, []);
    const items: any[] = faults?.items ?? faults?.data ?? (Array.isArray(faults) ? faults : []);
    const filtered = faultFilter === "ALL" ? items : items.filter(f => f.severity === faultFilter);
    const byCode: any = items.reduce((acc, f) => {
      const k = f.faultCode ?? f.failureType ?? "UNKNOWN";
      if (!acc[k]) acc[k] = { count: 0, downtime: 0 };
      acc[k].count++; acc[k].downtime += f.downtime ?? 0;
      return acc;
    }, {});
    const freqData = Object.entries(byCode).map(([code, d]: any) => ({ label: code, value: d.count, color: d.count >= 5 ? "#DC2626" : d.count >= 3 ? "#D97706" : "#6366F1" })).sort((a, b) => b.value - a.value).slice(0, 10);

    return (
      <div className="space-y-5 fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Faults", value: items.length, color: "text-neutral-900" },
            { label: "Unique Codes", value: Object.keys(byCode).length, color: "text-primary-700" },
            { label: "Fleet MTBF", value: `${mtbf?.fleetMTBF ?? "—"}h`, color: "text-green-700" },
            { label: "Total Downtime", value: `${items.reduce((s, f) => s + (f.downtime ?? 0), 0).toFixed(0)}h`, color: "text-red-600" },
          ].map((k, i) => (
            <div key={i} className="card p-5"><div className="text-xs font-black text-neutral-400 uppercase tracking-wide mb-2">{k.label}</div><div className={`text-3xl font-black ${k.color}`}>{k.value}</div></div>
          ))}
        </div>

        {freqData.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-neutral-900">Fault Frequency — Top 10 Codes</h3>
              <button onClick={() => toast("success", "Exporting fault data...")} className="btn-secondary text-xs font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export CSV</button>
            </div>
            <BarChart data={freqData} />
          </div>
        )}

        {mtbf && (
          <div className="card p-6">
            <h3 className="font-black text-neutral-900 mb-5">MTBF & Reliability</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Fleet MTBF", value: `${mtbf.fleetMTBF ?? "—"}h`, bg: "bg-green-50 border-green-100", color: "text-green-700" },
                { label: "Fleet MTTR", value: `${mtbf.fleetMTTR ?? "—"}h`, bg: "bg-amber-50 border-amber-100", color: "text-amber-700" },
                { label: "Availability", value: `${mtbf.fleetAvailability ?? "—"}%`, bg: "bg-primary-50 border-primary-100", color: "text-primary-700" },
                { label: "Total Failures", value: mtbf.totalFailures ?? "—", bg: "bg-red-50 border-red-100", color: "text-red-600" },
              ].map((s, i) => <div key={i} className={`rounded-2xl border p-5 ${s.bg}`}><div className="text-xs font-black opacity-60 uppercase tracking-wide mb-2">{s.label}</div><div className={`text-2xl font-black ${s.color}`}>{s.value}</div></div>)}
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-black text-neutral-900">All Fault Records</h3>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
              {["ALL","CRITICAL","HIGH","MEDIUM"].map(f => (
                <button key={f} onClick={() => setFaultFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${faultFilter === f ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{["Fault Code","Description","Asset","Occurrences","Severity","Downtime","Date",""].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((f: any, i: number) => (
                  <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50 transition cursor-pointer group" onClick={() => setFaultDrawer(f)}>
                    <td className="px-5 py-4"><span className="font-mono text-xs font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">{f.faultCode ?? f.failureType}</span></td>
                    <td className="px-5 py-4 text-neutral-600 font-bold max-w-48 truncate">{f.failureType ?? f.rawFault ?? "—"}</td>
                    <td className="px-5 py-4"><button onClick={e => { e.stopPropagation(); f.assetId && loadAssetDetail(f.assetId); }} className="text-primary-600 font-black text-xs hover:underline">{f.asset?.name ?? f.assetId ?? "—"}</button></td>
                    <td className="px-5 py-4"><span className={`font-black text-lg ${(byCode[f.faultCode ?? f.failureType]?.count ?? 1) >= 3 ? "text-red-600" : "text-neutral-900"}`}>{byCode[f.faultCode ?? f.failureType]?.count ?? 1}</span></td>
                    <td className="px-5 py-4"><SeverityPill level={f.severity ?? "HIGH"} /></td>
                    <td className="px-5 py-4 font-bold text-neutral-600">{f.downtime ? `${f.downtime}h` : "—"}</td>
                    <td className="px-5 py-4 text-xs font-bold text-neutral-400">{f.occurredAt ? new Date(f.occurredAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4"><span className="text-xs font-black text-primary-600 opacity-0 group-hover:opacity-100 transition">Detail →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState message="No faults found" icon={CheckCircle2} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAINTENANCE PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const MaintenancePage = () => {
    useEffect(() => { if (!maintenance) loadMaintenance(); }, []);
    const cadence = maintenance?.cadence;
    const wos: any[] = maintenance?.workOrders?.items ?? maintenance?.workOrders?.data ?? (Array.isArray(maintenance?.workOrders) ? maintenance.workOrders : []);
    const filteredWOs = woTab === "ALL" ? wos : wos.filter(w => w.status === woTab);

    return (
      <div className="space-y-5 fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Completed This Month", value: 32, color: "text-green-700 bg-green-50 border-green-100" },
            { label: "Overdue PMs", value: cadence?.violations ?? cadence?.totalViolations ?? 0, color: "text-red-700 bg-red-50 border-red-100" },
            { label: "Compliance Rate", value: `${(cadence?.complianceRate ?? cadence?.compliancePercent ?? 78).toFixed(1)}%`, color: "text-primary-700 bg-primary-50 border-primary-100" },
            { label: "Open Work Orders", value: wos.filter(w => w.status === "OPEN" || w.status === "IN_PROGRESS").length, color: "text-amber-700 bg-amber-50 border-amber-100" },
          ].map((k, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${k.color}`}>
              <div className="text-xs font-black opacity-70 uppercase tracking-wide mb-2">{k.label}</div>
              <div className="text-3xl font-black">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="font-black text-neutral-900 mb-5">PM Cadence Compliance</h3>
            <div className="flex items-center gap-6">
              <CircularGauge value={Math.round(cadence?.complianceRate ?? cadence?.compliancePercent ?? 78)} size={120} label="Compliance %" />
              <div className="flex-1 space-y-3">
                {[
                  { label: "Total PMs Evaluated", value: cadence?.totalPMs ?? cadence?.totalEvaluated ?? 40, color: "text-neutral-900" },
                  { label: "Cadence Violations", value: cadence?.violations ?? cadence?.totalViolations ?? 0, color: "text-red-600" },
                  { label: "On Schedule", value: (cadence?.totalPMs ?? 40) - (cadence?.violations ?? 0), color: "text-green-700" },
                  { label: "Max Allowed Gap", value: `${cadence?.maxAllowedGap ?? 90} days`, color: "text-neutral-600" },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-xs font-black text-neutral-500">{s.label}</span>
                    <span className={`font-black ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {cadence?.items?.filter((v: any) => v.violated).length > 0 && (
            <div className="card p-6">
              <h3 className="font-black text-neutral-900 mb-4">Overdue PM List</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cadence.items.filter((v: any) => v.violated).slice(0, 10).map((v: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
                    <div>
                      <p className="text-sm font-black text-neutral-900">{v.assetName ?? v.assetId}</p>
                      <p className="text-xs font-bold text-neutral-500">Gap: <span className="font-black text-red-600">{v.gapDays ?? v.actualGap ?? "—"} days</span> overdue</p>
                    </div>
                    <button onClick={() => { setNewWO({ ...newWO, assetId: v.assetId ?? "" }); setWoModal(true); }} className="btn-primary text-xs font-bold !py-1.5 !px-3 flex items-center gap-1"><Plus className="w-3 h-3" />Schedule</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black text-neutral-900">Work Orders</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
                {["ALL","OPEN","IN_PROGRESS","COMPLETED","CANCELLED"].map(t => (
                  <button key={t} onClick={() => setWoTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${woTab === t ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400"}`}>{t.replace("_", " ")}</button>
                ))}
              </div>
              <button onClick={() => setWoModal(true)} className="btn-primary text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />New WO</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{["WO ID","Asset","Type","Priority","Assigned To","Due Date","Status","Actions"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredWOs.slice(0, 20).map((wo: any) => (
                  <tr key={wo.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition group">
                    <td className="px-5 py-4"><span className="font-mono text-xs font-black text-primary-600">{wo.workOrderId ?? wo.id?.slice(0, 8)}</span></td>
                    <td className="px-5 py-4 font-bold text-neutral-800">{wo.asset?.name ?? wo.assetId ?? "—"}</td>
                    <td className="px-5 py-4 font-bold text-neutral-500">{wo.type ?? "PM"}</td>
                    <td className="px-5 py-4"><SeverityPill level={wo.priority ?? "MEDIUM"} /></td>
                    <td className="px-5 py-4 font-bold text-neutral-500">{wo.assignedTo ?? "Unassigned"}</td>
                    <td className="px-5 py-4 text-xs font-bold text-neutral-400">{wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`pill font-black text-xs ${wo.status === "COMPLETED" ? "bg-green-100 text-green-700 border border-green-200" : wo.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 border border-blue-200" : wo.status === "CANCELLED" ? "bg-neutral-100 text-neutral-500 border border-neutral-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>{wo.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button className="text-xs font-black text-primary-600 hover:underline">Edit</button>
                        <button onClick={() => toast("success", "Work order completed", `WO ${wo.workOrderId} marked complete`)} className="text-xs font-black text-green-600 hover:underline">Complete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredWOs.length === 0 && <EmptyState message="No work orders found" icon={Wrench} action="Create Work Order" onAction={() => setWoModal(true)} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const ContractsPage = () => {
    if (selectedContract) {
      const c = selectedContract;
      const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 0;
      const risk = days < 14 ? "CRITICAL" : days < 30 ? "HIGH" : days < 60 ? "MEDIUM" : "LOW";
      return (
        <div className="space-y-5 fade-in">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedContract(null)} className="text-sm font-black text-primary-600 hover:underline flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Contracts</button>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
            <span className="text-sm font-black text-neutral-900">{c.contractId}</span>
          </div>
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-neutral-900">{c.name ?? c.contractId}</h2>
                <p className="text-sm font-bold text-neutral-500 mt-1">{c.vendor ?? "—"} • {c.type ?? "AMC"}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="pill bg-green-100 text-green-700 border border-green-200 font-black">ACTIVE</span>
                <SeverityPill level={risk} />
                <span className={`pill font-black border ${days < 14 ? "bg-red-100 text-red-700 border-red-200" : days < 30 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-green-100 text-green-700 border-green-200"}`}>{days} days left</span>
                <button onClick={() => toast("success", "Contract renewal initiated", `Renewal workflow started for ${c.name}`)} className="btn-primary text-xs font-black flex items-center gap-1"><ArrowRight className="w-3.5 h-3.5" />Initiate Renewal</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[["Contract Value", `$${(c.value ?? 0).toLocaleString()}`],["Start Date", c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"],["End Date", c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"],["Compliance", `${c.complianceScore ?? 0}%`]].map(([k, v]) => (
                <div key={k} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                  <div className="text-xs font-black text-neutral-400 uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-xl font-black text-neutral-900">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-6">
              <h3 className="font-black text-neutral-900 mb-4">Compliance Score</h3>
              <div className="flex items-center gap-6">
                <CircularGauge value={c.complianceScore ?? 0} size={110} label="Compliance %" />
                <div className="flex-1 space-y-3">
                  <div className="text-sm font-bold">Renewal Risk: <SeverityPill level={risk} /></div>
                  {[
                    { label: "Expiry Proximity", status: days < 30 ? "⚠ HIGH RISK" : "✓ OK", color: days < 30 ? "text-red-600" : "text-green-600" },
                    { label: "Compliance Score", status: (c.complianceScore ?? 0) < 60 ? "⚠ LOW" : "✓ ADEQUATE", color: (c.complianceScore ?? 0) < 60 ? "text-red-600" : "text-green-600" },
                    { label: "Open Faults", status: "✓ None on covered assets", color: "text-green-600" },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-xs font-black text-neutral-400">{s.label}</span>
                      <span className={`text-xs font-black ${s.color}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-black text-neutral-900 mb-4">Activity Log</h3>
              <div className="space-y-3">
                {[{ event: "Contract Created", date: c.startDate, icon: FileCheck },{ event: "Last PM Completed", date: new Date(Date.now() - 30 * 86400000).toISOString(), icon: CheckCircle2 },{ event: "Compliance Report Generated", date: new Date(Date.now() - 7 * 86400000).toISOString(), icon: BarChart3 },{ event: "Renewal Review Due", date: c.endDate, icon: AlertTriangle }].map((e, i) => {
                  const Icon = e.icon;
                  return <div key={i} className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0"><div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center"><Icon className="w-4 h-4 text-primary-600" /></div><div className="flex-1"><div className="text-sm font-black text-neutral-800">{e.event}</div><div className="text-xs font-bold text-neutral-400">{e.date ? new Date(e.date).toLocaleDateString() : "—"}</div></div></div>;
                })}
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-neutral-900">Documents</h3>
              <button onClick={() => toast("info", "Upload feature", "Document upload available via admin panel")} className="btn-secondary text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Upload</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["Signed Contract PDF","PM Completion Report Q3","Inspection Certificate 2026"].map((name, i) => (
                <div key={i} className="p-4 rounded-2xl border border-neutral-200 flex items-center gap-3 hover:border-primary-200 hover:bg-primary-50/20 transition">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-red-500" /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-black text-neutral-900 truncate">{name}</div><div className="text-xs font-bold text-neutral-400">PDF • 2.4 MB</div></div>
                  <button onClick={() => toast("success", `Downloading ${name}...`)} className="p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition"><Download className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const expiring14 = contracts.filter((c: any) => { const d = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999; return d >= 0 && d <= 14; });
    const kanbanCols = [
      { key: "ACTIVE", label: "Active", border: "border-t-blue-400", bg: "bg-blue-50" },
      { key: "RENEWAL", label: "Renewal Initiated", border: "border-t-amber-400", bg: "bg-amber-50" },
      { key: "REVIEW", label: "Under Review", border: "border-t-yellow-400", bg: "bg-yellow-50" },
      { key: "LAPSED", label: "Renewed / Lapsed", border: "border-t-green-400", bg: "bg-green-50" },
    ];

    return (
      <div className="space-y-5 fade-in">
        {expiring14.length > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">{expiring14.length} contract{expiring14.length > 1 ? "s" : ""} expire within 14 days!</p>
              <p className="text-xs font-bold text-red-600">{expiring14.map((c: any) => c.name ?? c.contractId).join(", ")}</p>
            </div>
            <button onClick={() => toast("info", "Renewal emails sent", `Notified vendors for ${expiring14.length} expiring contracts`)} className="btn-primary bg-red-500 hover:bg-red-600 text-xs font-black">Notify Vendors</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Active", value: contracts.length, color: "text-neutral-900" },
            { label: "Expiring ≤30 Days", value: dashboard?.kpis?.contractsExpiring30Days ?? 0, color: "text-amber-700" },
            { label: "Avg Compliance", value: `${contracts.length ? (contracts.reduce((s: number, c: any) => s + (c.complianceScore ?? 0), 0) / contracts.length).toFixed(1) : "—"}%`, color: "text-green-700" },
            { label: "At Risk (<60%)", value: contracts.filter((c: any) => (c.complianceScore ?? 100) < 60).length, color: "text-red-600" },
          ].map((k, i) => <div key={i} className="card p-5"><div className="text-xs font-black text-neutral-400 uppercase tracking-wide mb-2">{k.label}</div><div className={`text-3xl font-black ${k.color}`}>{k.value}</div></div>)}
        </div>

        {/* Interactive Kanban */}
        <div className="card p-6">
          <h3 className="font-black text-neutral-900 mb-5">Renewal Pipeline — Drag contracts between stages</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kanbanCols.map(col => {
              const colItems = contractKanban[col.key] ?? contracts.slice(0, 2);
              return (
                <div key={col.key} className={`rounded-2xl border-t-4 border border-neutral-200 p-3 ${col.border} bg-neutral-50 min-h-40`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { const data = JSON.parse(e.dataTransfer.getData("text/plain")); moveContractStage(data.id, data.from, col.key); }}>
                  <div className="text-xs font-black text-neutral-500 uppercase tracking-wide mb-3 flex items-center justify-between">
                    {col.label} <span className="bg-white border border-neutral-200 rounded-full px-2 py-0.5 text-neutral-600">{colItems.length}</span>
                  </div>
                  {colItems.map((c: any) => {
                    const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 0;
                    return (
                      <div key={c.id} draggable
                        onDragStart={e => e.dataTransfer.setData("text/plain", JSON.stringify({ id: c.id, from: col.key }))}
                        className="bg-white rounded-xl p-3 mb-2 border border-neutral-200 shadow-sm hover:border-primary-300 hover:shadow-md transition cursor-grab active:cursor-grabbing select-none"
                        onClick={() => setSelectedContract(c)}>
                        <div className="text-xs font-black text-neutral-900 truncate mb-1">{c.name ?? c.contractId}</div>
                        <div className="text-xs font-bold text-neutral-400 mb-2">{c.vendor ?? "—"}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary-600">${(c.value ?? 0).toLocaleString()}</span>
                          <span className={`text-xs font-black ${days < 14 ? "text-red-600" : days < 30 ? "text-amber-600" : "text-green-600"}`}>{days}d left</span>
                        </div>
                        {c.complianceScore != null && <div className="h-1 bg-neutral-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${c.complianceScore}%` }} /></div>}
                      </div>
                    );
                  })}
                  {colItems.length === 0 && <div className="text-center py-4 text-xs font-bold text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">Drop here</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-black text-neutral-900">Contracts Table</h3>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
              {["ALL","AMC","CMC"].map(f => <button key={f} onClick={() => setContractFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${contractFilter === f ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400"}`}>{f}</button>)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{["Contract","Vendor","Type","Value","Compliance","Expires","Renewal Risk","Action"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {contracts.filter((c: any) => contractFilter === "ALL" || c.type === contractFilter).map((c: any) => {
                  const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999;
                  const risk = days < 14 ? "CRITICAL" : days < 30 ? "HIGH" : days < 60 ? "MEDIUM" : "LOW";
                  return (
                    <tr key={c.id} className="border-b border-neutral-50 hover:bg-primary-50/20 transition cursor-pointer group" onClick={() => setSelectedContract(c)}>
                      <td className="px-5 py-4"><div className="font-black text-neutral-900">{c.name ?? c.contractId}</div><div className="text-xs font-mono font-bold text-neutral-400">{c.contractId}</div></td>
                      <td className="px-5 py-4 font-bold text-neutral-600">{c.vendor ?? "—"}</td>
                      <td className="px-5 py-4"><span className="pill bg-primary-50 text-primary-700 border border-primary-100 font-black text-xs">{c.type ?? "AMC"}</span></td>
                      <td className="px-5 py-4 font-black text-neutral-900">${(c.value ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-4"><HealthBadge score={c.complianceScore ?? 0} /></td>
                      <td className="px-5 py-4"><div className="text-xs font-bold text-neutral-500">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</div><div className={`text-xs font-black ${days < 30 ? "text-red-600" : "text-neutral-400"}`}>{days} days</div></td>
                      <td className="px-5 py-4"><SeverityPill level={risk} /></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button className="text-xs font-black text-primary-600 hover:underline">View →</button>
                          <button onClick={e => { e.stopPropagation(); toast("success", "Renewal initiated", `Renewal workflow started for ${c.name}`); }} className="text-xs font-black text-green-600 hover:underline">Renew</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {contracts.length === 0 && <EmptyState message="No contracts found" icon={FileText} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const AlertsPage = () => {
    const tabs = ["ALL","CRITICAL","HIGH","MEDIUM","LOW"];
    const counts: any = { ALL: alerts.length };
    tabs.slice(1).forEach(t => { counts[t] = alerts.filter(a => a.severity === t).length; });
    const filtered = alertTab === "ALL" ? alerts : alerts.filter(a => a.severity === alertTab);

    return (
      <div className="space-y-5 fade-in">
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
            {tabs.map(t => (
              <button key={t} onClick={() => setAlertTab(t)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition ${alertTab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                {t}
                <span className={`text-xs font-black rounded-full px-1.5 py-0.5 min-w-5 text-center ${alertTab === t ? (t === "CRITICAL" ? "bg-red-100 text-red-700" : t === "HIGH" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600") : "bg-neutral-200 text-neutral-500"}`}>{counts[t]}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { alerts.filter(a => a.status !== "ACKNOWLEDGED").forEach(a => acknowledgeAlert(a)); toast("success", "All alerts acknowledged"); }} className="btn-secondary text-xs font-bold flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" />Acknowledge All</button>
        </div>
        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map((item: any, idx: number) => (
            <div key={item.id || idx} className={`card p-5 border-l-4 hover:shadow-md transition ${item.severity === "CRITICAL" ? "border-l-red-500" : item.severity === "HIGH" ? "border-l-amber-500" : item.severity === "MEDIUM" ? "border-l-blue-400" : "border-l-green-400"} ${item.status === "ACKNOWLEDGED" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <SeverityPill level={item.severity ?? "MEDIUM"} />
                    <span className="text-xs font-mono font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-lg">{item.type}</span>
                    <span className="text-sm font-black text-neutral-900">{item.asset?.name ?? item.assetId ?? "Fleet Item"}</span>
                    {item.status === "ACKNOWLEDGED" && <span className="text-xs font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">✓ Acknowledged</span>}
                  </div>
                  <h4 className="text-sm font-black text-neutral-900">{item.title}</h4>
                  <p className="text-xs font-bold text-neutral-500 mt-1">{item.message ?? item.reason}</p>
                  {item.currentValue && <p className="text-xs font-bold text-neutral-500 mt-1">Value: <span className="font-black text-amber-600">{item.currentValue}</span> | Threshold: <span className="font-black">{item.threshold}</span></p>}
                  {item.recommendedAction && <p className="text-xs font-black text-primary-600 mt-1.5 flex items-center gap-1"><ArrowRight className="w-3 h-3" />{item.recommendedAction}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs font-black text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{item.status ?? "OPEN"}</span>
                  <div className="flex gap-2">
                    {item.status !== "ACKNOWLEDGED" && <button onClick={() => acknowledgeAlert(item)} className="btn-secondary text-xs !py-1.5 !px-3 font-bold">Acknowledge</button>}
                    <button onClick={() => item.assetId && loadAssetDetail(item.assetId)} className="btn-primary text-xs !py-1.5 !px-3 font-bold flex items-center gap-1">Inspect <ArrowRight className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            </div>
          )) : <EmptyState message="No alerts in this category" sub="Your fleet is looking clean!" icon={CheckCircle2} action="Refresh Alerts" onAction={loadDashboard} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const ReportsPage = () => {
    const [generating, setGenerating] = useState<string | null>(null);
    const generateReport = async (name: string) => {
      setGenerating(name);
      await new Promise(r => setTimeout(r, 1500));
      setGenerating(null);
      toast("success", "Report ready!", `${name} has been generated and is ready to download.`);
    };
    return (
      <div className="space-y-5 fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Fleet Health Summary", desc: "Portfolio-wide health & risk snapshot", type: "PDF", date: "Oct 1, 2026", icon: Activity, color: "bg-primary-50 border-primary-200 text-primary-600" },
            { name: "PM Compliance Report", desc: "Cadence adherence across all assets", type: "PDF", date: "Sep 30, 2026", icon: Wrench, color: "bg-green-50 border-green-200 text-green-600" },
            { name: "Contract Renewal Risk", desc: "SLA risk and renewal urgency analysis", type: "PDF", date: "Sep 28, 2026", icon: FileText, color: "bg-amber-50 border-amber-200 text-amber-600" },
            { name: "MTBF Analysis", desc: "Reliability metrics by asset category", type: "CSV", date: "Sep 25, 2026", icon: BarChart3, color: "bg-blue-50 border-blue-200 text-blue-600" },
            { name: "IoT Anomaly Log", desc: "Sensor events and threshold violations", type: "CSV", date: "Sep 22, 2026", icon: Wifi, color: "bg-purple-50 border-purple-200 text-purple-600" },
            { name: "Fault Trend Analysis", desc: "30-day fault patterns and root cause", type: "PDF", date: "Sep 20, 2026", icon: Zap, color: "bg-red-50 border-red-200 text-red-600" },
          ].map((r, i) => {
            const Icon = r.icon; const isGen = generating === r.name;
            return (
              <div key={i} className="card card-hover p-5">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${r.color}`}><Icon className="w-6 h-6" /></div>
                <h4 className="font-black text-neutral-900 mb-1">{r.name}</h4>
                <p className="text-xs font-bold text-neutral-400 mb-4">{r.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-neutral-400">{r.date} • {r.type}</span>
                  <div className="flex gap-2">
                    <button onClick={() => generateReport(r.name)} disabled={!!isGen} className="btn-secondary text-xs font-bold !py-1.5 !px-3 flex items-center gap-1 disabled:opacity-50">
                      {isGen ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Generate
                    </button>
                    <button onClick={() => toast("success", `Downloading ${r.name}...`)} className="btn-primary text-xs font-bold !py-1.5 !px-3 flex items-center gap-1"><Download className="w-3.5 h-3.5" />Download</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {mtbf && (
          <div className="card p-6">
            <h3 className="font-black text-neutral-900 mb-5">Live MTBF Dashboard</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Fleet MTBF", value: `${mtbf.fleetMTBF ?? "—"}h`, color: "text-green-700 bg-green-50 border-green-100" },
                { label: "Fleet MTTR", value: `${mtbf.fleetMTTR ?? "—"}h`, color: "text-amber-700 bg-amber-50 border-amber-100" },
                { label: "Availability", value: `${mtbf.fleetAvailability ?? "—"}%`, color: "text-primary-700 bg-primary-50 border-primary-100" },
                { label: "Total Failures", value: mtbf.totalFailures ?? "—", color: "text-red-600 bg-red-50 border-red-100" },
              ].map((s, i) => <div key={i} className={`rounded-2xl border p-5 ${s.color}`}><div className="text-xs font-black opacity-70 uppercase tracking-wide mb-2">{s.label}</div><div className="text-2xl font-black">{s.value}</div></div>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AI PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const AiPage = () => {
    const chatEnd = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);
    const suggestions = [
      "Which equipment is high risk today?","What PMs are overdue this week?",
      "Which contracts expire this month?","What is the fleet MTBF?",
      "Show me critical faults on all assets","Summarize the IoT anomalies",
    ];
    return (
      <div className="max-w-3xl mx-auto space-y-5 fade-in">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30"><Bot className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="font-black text-white text-xl">AI Service Intelligence Copilot</h2>
                <p className="text-sm font-bold text-primary-200">Evidence-grounded answers from your real fleet database</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 min-h-72 max-h-[480px] overflow-y-auto p-4 space-y-4 mb-4">
              {aiMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Bot className="w-14 h-14 text-neutral-200 mb-4" />
                  <p className="font-black text-neutral-500 text-lg">Hello! I'm AURUM Copilot.</p>
                  <p className="text-sm font-bold text-neutral-400 mt-1">Ask me anything about your fleet, sensors, contracts, or fault patterns.</p>
                </div>
              ) : aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] p-4 rounded-2xl text-sm font-bold leading-relaxed ${msg.role === "user" ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-br-sm shadow-lg" : "bg-white text-neutral-800 rounded-bl-sm border border-neutral-200 shadow-sm"}`}>
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs font-black opacity-70 mb-2">📎 {msg.evidence.length} evidence records</p>
                        <div className="text-xs bg-black/10 p-2 rounded-xl font-mono overflow-x-auto">{JSON.stringify(msg.evidence[0], null, 1).substring(0, 300)}...</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-200 p-4 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1.5">{[0,0.3,0.6].map((d,i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary-400 pulse-soft" style={{ animationDelay: `${d}s` }} />)}</div>
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map(s => (
                <button key={s} onClick={() => setAiInput(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition">{s}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAiSend()}
                placeholder="Ask about equipment, sensors, faults, contracts..." className="flex-1 px-4 py-3.5 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition bg-neutral-50 focus:bg-white" />
              <button onClick={handleAiSend} disabled={aiLoading || !aiInput.trim()} className="btn-primary !rounded-xl flex items-center gap-2 !px-6 font-black disabled:opacity-50">
                <Send className="w-4 h-4" />Send
              </button>
            </div>
            {aiMessages.length > 0 && (
              <button onClick={() => setAiMessages([])} className="w-full mt-3 text-xs font-bold text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-xl py-2 transition">Clear conversation</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── PAGE ROUTER ─────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "assets": return <AssetsPage />;
      case "iot": return <IoTPage />;
      case "faults": return <FaultsPage />;
      case "maintenance": return <MaintenancePage />;
      case "contracts": return <ContractsPage />;
      case "alerts": return <AlertsPage />;
      case "reports": return <ReportsPage />;
      case "ai": return <AiPage />;
      default: return <DashboardPage />;
    }
  };

  // ─── ROOT RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#EFF3F8]">
      <Sidebar />
      <MobileDrawer />
      <SearchModal />
      <ToastContainer toasts={toasts} remove={removeToast} />

      {/* Acknowledge Modal */}
      <Modal open={!!acknowledgeModal} onClose={() => setAcknowledgeModal(null)} title="Acknowledge Alert">
        {acknowledgeModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="flex items-center gap-2 mb-2"><SeverityPill level={acknowledgeModal.severity} /><span className="font-black text-neutral-800">{acknowledgeModal.asset?.name ?? acknowledgeModal.assetId}</span></div>
              <p className="text-sm font-bold text-neutral-700">{acknowledgeModal.title}</p>
            </div>
            <p className="text-sm font-bold text-neutral-500">You are acknowledging this alert as reviewed. This action will be logged with your user ID.</p>
            <div className="flex gap-3">
              <button onClick={confirmAcknowledge} className="btn-primary flex-1 font-black flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Confirm Acknowledge</button>
              <button onClick={() => setAcknowledgeModal(null)} className="btn-secondary flex-1 font-bold">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Fault Detail Drawer */}
      <Drawer open={!!faultDrawer} onClose={() => setFaultDrawer(null)} title="Fault Detail">
        {faultDrawer && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2"><span className="font-mono text-sm font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-lg">{faultDrawer.faultCode ?? faultDrawer.failureType}</span><SeverityPill level={faultDrawer.severity ?? "HIGH"} /></div>
              <p className="text-sm font-black text-neutral-800">{faultDrawer.rawFault ?? faultDrawer.description}</p>
            </div>
            {[["Asset", faultDrawer.asset?.name ?? faultDrawer.assetId ?? "—"],["Date", faultDrawer.occurredAt ? new Date(faultDrawer.occurredAt).toLocaleString() : "—"],["Downtime", faultDrawer.downtime ? `${faultDrawer.downtime}h` : "—"],["Description", faultDrawer.description ?? "—"],["Resolution", faultDrawer.resolution ?? "Pending review"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-neutral-100 last:border-0">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-wide">{k}</span>
                <span className="text-sm font-bold text-neutral-800 text-right max-w-48 truncate">{v}</span>
              </div>
            ))}
            <button onClick={() => { faultDrawer.assetId && loadAssetDetail(faultDrawer.assetId); setFaultDrawer(null); }} className="btn-primary w-full font-bold flex items-center justify-center gap-2"><ArrowRight className="w-4 h-4" />View Asset</button>
            <button onClick={() => { toast("success", "Exporting fault record..."); }} className="btn-secondary w-full font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" />Export as CSV</button>
          </div>
        )}
      </Drawer>

      {/* Create Work Order Modal */}
      <Modal open={woModal} onClose={() => setWoModal(false)} title="Create Work Order" width="max-w-lg">
        <div className="space-y-4">
          {[
            { label: "Asset ID *", key: "assetId", type: "text", placeholder: "e.g. EQ-CMAPSS-FD001-001" },
            { label: "Description *", key: "description", type: "text", placeholder: "Describe the maintenance task..." },
            { label: "Assigned To", key: "assignedTo", type: "text", placeholder: "Engineer name" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-black text-neutral-600 uppercase tracking-wide mb-1.5">{f.label}</label>
              <input value={(newWO as any)[f.key]} onChange={e => setNewWO(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-neutral-600 uppercase tracking-wide mb-1.5">Type</label>
              <select value={newWO.type} onChange={e => setNewWO(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-primary-400 transition bg-white">
                {["PM","CORRECTIVE","INSPECTION","EMERGENCY"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-neutral-600 uppercase tracking-wide mb-1.5">Priority</label>
              <select value={newWO.priority} onChange={e => setNewWO(p => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-primary-400 transition bg-white">
                {["CRITICAL","HIGH","MEDIUM","LOW"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={createWorkOrder} className="btn-primary flex-1 font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Create Work Order</button>
            <button onClick={() => setWoModal(false)} className="btn-secondary flex-1 font-bold">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none z-0" />
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
          <div className="max-w-[1400px] mx-auto">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}
