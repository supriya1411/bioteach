# AURUM Service Intelligence — Frontend PRD
**Version:** 1.0 | **Status:** Implementation-Ready Draft | **Audience:** Frontend Engineering, Design, QA

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Users & Personas](#4-users--personas)
5. [Core Flow](#5-core-flow)
6. [Information Architecture](#6-information-architecture)
7. [Navigation](#7-navigation)
8. [Page-by-Page Requirements](#8-page-by-page-requirements)
9. [User Flows](#9-user-flows)
10. [Component Library](#10-component-library)
11. [Data Visualization](#11-data-visualization)
12. [Mock Data Structure](#12-mock-data-structure)
13. [Responsive Behavior](#13-responsive-behavior)
14. [States: Loading / Empty / Error / Offline](#14-states-loading--empty--error--offline)
15. [Accessibility](#15-accessibility)
16. [Frontend Architecture](#16-frontend-architecture)
17. [API Contract](#17-api-contract)
18. [Acceptance Criteria](#18-acceptance-criteria)
19. [Edge Cases](#19-edge-cases)
20. [Design Tokens](#20-design-tokens)

---

## 1. Product Overview

**AURUM Service Intelligence** is a premium enterprise Service Operations Command Center that consolidates asset health, IoT telemetry, fault analytics, preventive maintenance, and contract management into a single, real-time intelligence platform.

The product serves organizations operating large physical asset estates — hospitals, data centers, manufacturing facilities, commercial campuses — where unplanned equipment failure carries operational, financial, or safety consequences.

AURUM surfaces the right information at the right time so operators can move from reactive firefighting to proactive, evidence-based service management.

---

## 2. Problem Statement

Enterprise service operations teams today work across disconnected systems: a CMMS for maintenance, a spreadsheet for contracts, a separate IoT platform for telemetry, and email for fault reports. This fragmentation causes:

- **Missed signals** — fault patterns and IoT anomalies are not correlated with PM history or contract status.
- **Reactive posture** — teams learn about failures after they happen, not before.
- **Audit gaps** — contract compliance and PM completion cannot be demonstrated from a single source.
- **Cognitive overload** — engineers must context-switch across six tools to diagnose a single asset.

AURUM collapses this into one command center where every important issue follows a structured, actionable path: **Problem → Risk → Reason → Recommended Action → CTA**.

---

## 3. Goals & Non-Goals

### Goals
- Provide a real-time, unified view of all asset health, IoT status, faults, PM, and contracts.
- Surface high-risk and high-priority items proactively — without the user having to hunt.
- Enable any user to understand *why* an asset is at risk, not just *that* it is.
- Support evidence-based decision-making; never display a prediction without surfacing the underlying signals.
- Be accessible, responsive, and production-ready from day one.

### Non-Goals
- This PRD does not cover the backend API or data pipeline implementation.
- This PRD does not claim specific ML model accuracy; all risk scores are derived from configurable rule-based or model-backed thresholds supplied by the API.
- This PRD does not cover mobile-native apps (iOS/Android); the web app is responsive to tablet and mobile browsers.
- AURUM is not a ticketing system or ITSM replacement — it links to work orders but does not own their lifecycle.

---

## 4. Users & Personas

| Persona | Role | Primary Concern | Typical Entry Point |
|---|---|---|---|
| **Operations Manager** | Oversees the full estate | Asset risk, SLA compliance, contract renewals | Dashboard |
| **Field Service Engineer** | Executes maintenance and repairs | Which assets need attention today, work orders | Maintenance, Alerts |
| **Facilities Director** | Strategic and budget decisions | High-risk assets, contract spend, renewal risk | Contracts, Reports |
| **IoT / Data Analyst** | Monitors sensor health | Telemetry anomalies, threshold violations | IoT Monitoring |
| **Compliance Officer** | Ensures PM and contract adherence | PM cadence, compliance scores, signed reports | Maintenance, Contracts |

---

## 5. Core Flow

Every interaction in AURUM maps to one or more stages of this operational flow:

```
Monitor → Detect → Explain → Predict → Recommend → Act
```

| Stage | What AURUM Does | Where |
|---|---|---|
| **Monitor** | Ingests live IoT telemetry, fault streams, PM schedules | IoT Monitoring, Dashboard |
| **Detect** | Identifies threshold violations, anomalies, overdue PMs | Alerts, Fault Analytics |
| **Explain** | Surfaces root cause signals, fault history, contributing factors | Asset Detail, AI Copilot |
| **Predict** | Shows risk scores, MTBF trends, contract renewal timeline | Dashboard, Fault Analytics, Contracts |
| **Recommend** | Issues structured actions: Inspect / Schedule / Renew | Action Center, Alerts |
| **Act** | Provides one-click CTAs: Assign, Acknowledge, View Asset | Action Center, Alerts, Asset Detail |

---

## 6. Information Architecture

```
AURUM Service Intelligence
│
├── Dashboard                    (Home — Monitor + Act)
├── Assets                       (Browse + Drill down)
│   └── [Asset ID]               (Asset Detail)
├── IoT Monitoring               (Live telemetry)
│   └── [Device ID]              (Sensor Detail)
├── Fault Analytics              (Patterns + Root cause)
├── Maintenance                  (PM + Work Orders)
│   └── [Work Order ID]
├── Contracts                    (AMC/CMC lifecycle)
│   └── [Contract ID]
├── Alerts                       (All active alerts)
├── Reports                      (Generated reports)
│   └── [Report ID]              (Report Viewer)
└── AI Assistant                 (Natural language Q&A)
```

---

## 7. Navigation

### Primary Navigation (Left Sidebar — always visible on desktop)
```
┌────────────────────┐
│  AURUM             │  ← Logo / product name
│  ─────────────     │
│  ⊞  Dashboard      │
│  ◈  Assets         │
│  ⌁  IoT Monitor    │
│  ⚡  Fault Analytics│
│  🔧 Maintenance    │
│  📄 Contracts      │
│  🔔 Alerts    [5]  │  ← Badge = active critical alerts
│  📊 Reports        │
│  ─────────────     │
│  ✦  AI Assistant   │  ← Pinned bottom, always accessible
│  ─────────────     │
│  ⚙  Settings       │
│  👤 [User Avatar]  │
└────────────────────┘
```

**Sidebar behavior:**
- Desktop (≥1280px): always expanded with labels.
- Tablet (768–1279px): icon-only, labels on hover.
- Mobile (<768px): hidden; accessible via hamburger → slide-in drawer.
- Active item: filled background `bg-primary-800`, text white.
- Alert badge: red pill, count capped at display "99+".

### Secondary Navigation (Top Bar — per page)
- Breadcrumb trail for depth ≥2.
- Page title (H1).
- Contextual actions (e.g., "Export", "Add Work Order").
- Global search (Cmd/Ctrl + K) → searches assets, faults, contracts by ID or name.

---

## 8. Page-by-Page Requirements

---

### 8.1 Dashboard

**Purpose:** Immediate situational awareness + prioritized action. This is the command center home screen.

#### 8.1.1 KPI Strip (top row, 6 cards)

| Card | Metric | Accent Color | Action |
|---|---|---|---|
| Total Assets | Count of all tracked assets | Neutral | → Assets |
| High-Risk Assets | Assets with risk score ≥ 80 | Red | → Assets (filtered: high-risk) |
| Critical Alerts | Active severity=Critical alerts | Red | → Alerts (filtered: critical) |
| PM Due (7 days) | PMs due within 7 days | Orange | → Maintenance |
| Expiring Contracts | Contracts expiring within 30 days | Orange | → Contracts |
| Avg Health Score | Portfolio-wide average (0–100) | Green/Orange/Red based on value | — |

Each KPI card: value (large type), label, delta vs. prior period (↑↓), and a click-through link.

#### 8.1.2 Asset Health Overview

- Donut chart: asset count segmented by health band (Healthy ≥75, At Risk 50–74, Critical <50).
- Below chart: three rows with count, percentage, and a "View" link per band.

#### 8.1.3 Assets by Location

- Horizontal bar chart: top 8 locations, bars colored by dominant health band.
- Tooltip on hover: count per health band for that location.

#### 8.1.4 Top Faults (last 30 days)

- Ranked list (1–5) of most frequent fault codes.
- Each row: fault code, normalized description, occurrence count, trend indicator (↑↓ vs prior 30d).
- "View All" → Fault Analytics.

#### 8.1.5 Live System Status

- Grid of system-level health indicators: IoT Gateway, PM Sync, Contract Ingestion, AI Engine.
- Status pill: Operational (green) / Degraded (orange) / Down (red).
- Last updated timestamp.
- Clicking a degraded/down item shows a modal with detail and estimated resolution.

#### 8.1.6 Action Center *(most important module)*

Full-width panel, positioned prominently below KPI strip. Tabs: **All | Critical | High | PM | Contract**.

Each action item row:
```
[Severity Pill]  [Asset ID / Name]  [Issue Summary]  [Risk Level]  [Reason]  [CTA Button]
CRITICAL         EQ-204 Chiller A   High Temperature  RISK: HIGH   Cooling anomaly  [Inspect Now →]
```

- Color-coded left border per severity (red / orange / yellow / blue).
- Sortable: by severity, asset, risk.
- Paginated: 10 per page, load more.
- CTA actions: **Inspect Now**, **Schedule PM**, **Acknowledge**, **Assign**, **Renew Contract**.
- Clicking asset ID → Asset Detail.
- Empty state: "No pending actions — all clear." with a green checkmark illustration.

#### 8.1.7 High-Risk Equipment

- Table: top 10 assets by risk score.
- Columns: Asset ID, Name, Location, Health Score (badge), Risk Score (bar), Last Fault, Action.
- Action column: quick "View" and "Inspect" buttons.

#### 8.1.8 IoT Summary

- 3 metric cards: Sensors Online, Sensors Offline, Active Anomalies.
- Sparkline per metric (last 24h trend).
- "View IoT Monitor" link.

#### 8.1.9 PM Summary

- 3 metric cards: PMs Completed (month), PMs Overdue, Compliance Rate %.
- Compliance rate: circular progress indicator.
- "View Schedule" link.

#### 8.1.10 Contract Renewal Pipeline

- Horizontal timeline view: contracts plotted by days-to-expiry (0–90 days window).
- Each contract: colored pill (red <14d, orange 14–30d, yellow 31–60d, green >60d).
- Hover: contract name, value, expiry date, renewal status.
- "View All Contracts" link.

#### 8.1.11 AI Service Copilot (Dashboard Widget)

- Collapsed by default: "Ask AURUM a question…" input placeholder.
- Expands inline to show a chat-like Q&A panel.
- Suggested prompts:
  - "Which equipment is high risk today?"
  - "What PMs are overdue?"
  - "Which contracts expire this month?"
- Answers are evidence-linked: each claim cites the source (asset record, fault log, IoT reading).
- "Open Full Assistant" → AI Assistant page.

---

### 8.2 Assets

**Purpose:** Browse, search, filter, and inspect all assets. Entry point for any asset-centric investigation.

#### 8.2.1 Asset List View

**Toolbar:**
- Search: text input, searches ID, name, location, category. Debounced 300ms.
- Filters (collapsible panel): Location, Category, Health Band, Risk Level, Contract Status, PM Status.
- Sort: Health Score, Risk Score, Last Fault Date, Name, Location.
- View toggle: Table | Card grid.

**Table columns:**
| Column | Notes |
|---|---|
| Asset ID | Monospace, clickable → Asset Detail |
| Name | Full name |
| Category | Equipment type tag |
| Location | Site / Floor |
| Health Score | 0–100 badge (color-coded) |
| Risk | HIGH / MEDIUM / LOW pill |
| IoT | Live / No Sensor / Offline icon |
| Last Fault | Date + fault code |
| PM Status | OK / Due / Overdue pill |
| Contract | AMC / CMC / None / Expired pill |
| Actions | View, Quick Alert |

Pagination: 25 / 50 / 100 per page. Total count shown.

**Card grid view:** 3-up on desktop, 2-up on tablet, 1-up on mobile. Each card shows: name, ID, location, health score ring, risk pill, quick status icons.

#### 8.2.2 Asset Detail Page

URL: `/assets/[assetId]`

**Header band:** Asset name, ID, category, location, last updated timestamp. Status pills: Health, Risk, IoT, PM, Contract.

**Tabs:**

**Overview tab:**
- Health Score: large circular gauge (0–100), color-coded, with last 30-day trend sparkline.
- Risk breakdown: contributing factors listed as evidence cards (e.g., "3 faults in 30 days — contributes to HIGH risk").
- Key specs: installed date, model, serial, manufacturer, warranty expiry.
- Location map thumbnail (if coordinates available).

**Fault / Service History tab:**
- Timeline of all faults (chronological, newest first).
- Each entry: date, fault code, normalized description, severity, resolution, engineer.
- Filter by date range and severity.
- Recurrence indicator: faults that appear more than once are flagged.

**IoT tab:**
- Live reading panel: current temperature, humidity, vibration (per sensor type fitted).
- Status: Online / Offline / No Sensor.
- Time-series chart: last 24h, 7d, 30d selector.
- Threshold bands overlaid on chart (safe / warning / critical zones).
- Anomaly events listed below chart with timestamp and deviation.

**Maintenance tab:**
- Upcoming PMs: date, type, assigned engineer, status.
- PM history: completed/missed PMs in a table.
- Compliance rate: % PMs completed on schedule (rolling 12 months).
- "Schedule PM" action button.

**Contract tab:**
- Active contract: type (AMC/CMC), vendor, start, end, value, scope.
- PM cadence per contract.
- Compliance score: % of contracted PMs completed.
- Signed documents: list of uploaded evidence files with download links.
- Days to expiry countdown.

**Documents tab:**
- Uploaded files: manual, warranty certificate, inspection reports.
- Upload button (if permissions allow).
- Each file: name, type, upload date, size, download/preview action.

---

### 8.3 IoT Monitoring

**Purpose:** Real-time sensor telemetry, anomaly detection, and environmental risk.

#### 8.3.1 IoT Overview

**Status bar (top):** Total Sensors | Online | Offline | Anomaly Active — count cards with delta.

**Site/Floor selector:** Dropdown or tab strip. Defaults to "All Sites".

**Sensor Grid:**
- Card per sensor grouping (by asset).
- Card shows: asset name, sensor type, current reading, unit, status pill (Normal / Warning / Critical / Offline).
- Cards sorted: Critical first, then Warning, then Normal, then Offline.
- Clicking a card → Sensor Detail.

**Anomaly Feed (right panel):**
- Live scrolling list of recent anomaly events.
- Each: timestamp, asset, sensor, reading, threshold, deviation.
- "Acknowledge" button per event.

#### 8.3.2 Sensor Detail

URL: `/iot/[deviceId]`

- Current reading (large): value, unit, timestamp.
- Status: Online / Offline / Last seen.
- Threshold configuration: safe range, warning range, critical range (read-only display; editing is a settings concern).
- Time-series chart: interactive. Range selector: 1h / 6h / 24h / 7d / 30d.
  - Threshold lines overlaid.
  - Anomaly events marked as vertical markers on chart.
- Anomaly history table: timestamp, reading, threshold, duration, acknowledged by.
- Parent asset link.

---

### 8.4 Fault Analytics

**Purpose:** Understand fault patterns, recurrence, severity distribution, MTBF, and root-cause relationships across the asset estate.

#### 8.4.1 Fault Analytics Overview

**Filters:** Date range, Location, Category, Severity, Fault Code.

**Summary KPIs (top):**
- Total Faults (period)
- Unique Fault Codes
- Avg MTBF (days)
- Most Affected Asset

**Fault Frequency Chart:**
- Bar chart: top 10 fault codes by occurrence, colored by severity band.
- Toggle: by count / by affected assets.

**Fault Trends:**
- Line chart: faults per day over selected period. Overlays: PM events (vertical markers), IoT anomalies (optional).
- Highlight: periods where faults spiked.

**Recurring Faults Table:**
- Columns: Fault Code, Description (normalized), Occurrences, Affected Assets, Avg Resolution Time, First Seen, Last Seen, Trend (↑↓=).
- Highlight rows where recurrence > configurable threshold (default: ≥3 in 30 days).

**MTBF Panel:**
- Bar chart: MTBF per asset category.
- Tooltip: which assets drive the category's MTBF.
- Low MTBF band highlighted red.

**Correlation / Root-Cause Panel:**
- Matrix or clustered list: fault codes that frequently co-occur with the same assets or within the same time window.
- Displayed as evidence, not causal claim: "Fault A and Fault B appear together in 70% of EQ-204 incidents."
- No causal language used unless operator has manually confirmed it.

**Fault Detail Drawer:**
- Clicking any fault code → right-side drawer.
- Drill-down: list of all instances (date, asset, location, severity, resolution).
- Export as CSV.

---

### 8.5 Maintenance

**Purpose:** Manage preventive maintenance schedules, track due/overdue PMs, work orders, and engineer assignments.

#### 8.5.1 Maintenance Overview

**Top KPIs:** PMs This Month (Planned / Completed / Missed) | Compliance Rate | Overdue Count | Engineers Assigned.

**PM Schedule Calendar:**
- Monthly calendar view (default) / List view toggle.
- Each PM event: asset name, type, engineer initials, status color.
- Click event → PM Detail drawer.
- Color coding: Completed (green), Upcoming (blue), Due Today (orange), Overdue (red).

**Overdue PM List:**
- Table: Asset, PM Type, Due Date, Days Overdue, Assigned Engineer, Contract Requirement (Y/N), Action.
- "Schedule Now" CTA per row.
- Sorted by days overdue descending.

**Work Orders:**
- Tab: Open | In Progress | Completed | Cancelled.
- Table: WO ID, Asset, Type, Priority, Assigned Engineer, Created, Due, Status.
- Click row → Work Order Detail.
- Create Work Order button → form modal.

**PM Cadence Compliance:**
- Per-asset-category stacked bar: Compliant / Late / Missed per month, last 6 months.

**Engineer Assignment:**
- Simple view: engineer name, active work orders count, next available slot.
- Not a full scheduling tool; links to work order assignment.

---

### 8.6 Contracts

**Purpose:** Track AMC/CMC contract health, PM cadence compliance, renewal risk, and document evidence.

#### 8.6.1 Contracts Overview

**KPIs:** Total Active Contracts | Expiring <30 Days | Avg Compliance Score | Contracts at Risk.

**Renewal Pipeline:**
- Kanban-style columns: Active → Renewal Initiated → Under Review → Renewed / Lapsed.
- Each card: contract name, vendor, expiry date, value, compliance score badge.
- Drag-to-update status (if permissions allow).

**Contracts Table:**
- Columns: Contract ID, Name, Vendor, Type (AMC/CMC), Assets Covered, Start, End, Value, Compliance %, PM Cadence, Status, Action.
- Filter: by type, status, expiry window, compliance band.
- Sort: expiry date, compliance score.

**Expiring Contracts Alert Strip:**
- Pinned above table if any contracts expire <14 days.
- Red banner: "X contracts expire within 14 days. Review now."

#### 8.6.2 Contract Detail

URL: `/contracts/[contractId]`

- Header: contract name, ID, vendor, type, status pill, days-to-expiry countdown.
- Coverage: list of assets covered with health score per asset.
- PM Cadence: contracted schedule vs actual delivery.
- Compliance Score: gauge + monthly breakdown table.
- Renewal Risk: LOW / MEDIUM / HIGH — based on compliance score, expiry proximity, and open faults on covered assets. (Score explained, not asserted.)
- Documents: signed contract PDF, PM completion reports, inspection certificates. Each file: name, date, download.
- Activity log: timeline of contract events (created, amended, renewed, documents uploaded).

---

### 8.7 Alerts

**Purpose:** Unified alert center — all active alerts across IoT, faults, PM, and contracts, with context and actions.

#### 8.7.1 Alert List

**Severity tabs:** All | Critical | High | Medium | Low. Count badge per tab.

**Alert card (each row):**
```
[CRITICAL]  EQ-204 — Chiller A        Temp: 38.4°C (Threshold: 32°C)
            Duration: 47 min           Reason: Cooling anomaly detected
            Rec