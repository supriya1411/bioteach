# AURUM Intelligence Dashboard

A premium, enterprise-grade predictive maintenance and fleet management dashboard. AURUM integrates real-time IoT telemetry, AI-driven anomaly detection, fault analytics, and proactive maintenance workflows into a single unified platform.

## 🚀 Features

- **Centralized Dashboard**: Real-time KPI strip, asset health distributions, live system status, and a prioritized action center.
- **Fleet & Asset Management**: Comprehensive equipment list with dynamic risk scoring (High, Medium, Low, Critical) and health indices.
- **IoT Telemetry Monitor**: Tracks live sensor feeds (e.g., C-MAPSS and AI4I datasets), detecting anomalies dynamically against safe/critical thresholds.
- **Fault Analytics & MTBF**: Calculates Mean Time Between Failures (MTBF), total downtime, and visualizes fault frequencies.
- **Maintenance & Cadence**: Flags overdue PMs and evaluates maintenance execution against contract SLAs.
- **Contract Pipeline**: Tracks contract lifecycle, compliance scores, and highlights upcoming renewals.
- **AI Service Copilot**: An integrated AI assistant grounded in actual database evidence, enabling you to query your fleet's status using natural language.
- **Premium Design System**: "Light, clean, premium SaaS" UI built with Tailwind CSS, leveraging Lucide icons, responsive sidebars, and micro-animations.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Zustand (State)
- **Backend**: NestJS, Node.js (via `server.ts` integration)
- **Database ORM**: Prisma ORM, SQLite
- **Language**: TypeScript

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/supriya1411/bioteach.git
   cd bioteach
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *This command spins up both the NestJS backend API and the Vite frontend simultaneously.*

4. **View the application:**
   Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── src/                # React Frontend source code
│   ├── components/     # Reusable UI components
│   ├── store/          # Zustand state management
│   ├── index.css       # Tailwind & AURUM design tokens
│   └── App.tsx         # Main application and routing logic
├── backend/            # NestJS API source code & Prisma schema
├── server.ts           # Unified entry point (serves API & SPA frontend)
├── package.json        # Dependencies & scripts
└── README.md
```

## 🎨 Design Philosophy

AURUM strictly avoids dark/cyberpunk themes in favor of a modern, enterprise SaaS aesthetic:
- **Primary Colors**: Indigo shades (`#EEF2FF`, `#4F46E5`, `#312E81`)
- **Neutral Colors**: Clean slate tones (`#F8FAFC`, `#1E293B`)
- **Typography**: Inter font with legible spacing and soft shadows.

---
*Developed for optimal predictive maintenance and AI-driven fleet intelligence.*
