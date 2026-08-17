# Kryven - Autonomous Incident Intelligence & Causal Observability Platform

> "From alert noise to causality."

Kryven is an AI-native incident intelligence layer designed to sit between your applications and alerting platforms. It converts thousands of low-level telemetry events into a small number of explainable incidents by reconstructing how failures propagate through a distributed system.

## Problem
Modern microservice architectures generate massive alert storms during cascading failures. Engineers suffer from alert fatigue, spending critical minutes trying to figure out which alert is the actual root cause versus merely a downstream symptom.

## Solution
Kryven implements a real-time event pipeline that groups similar error traces, deduplicates alerts, and consolidates them into **Incident Graphs**. It uses deterministic heuristics combined with temporal correlation and topology mapping to estimate root causes and blast radiuses instantly.

## Architecture
- **Frontend**: Next.js 14, Tailwind CSS, React Flow (Topology), Recharts.
- **Backend**: FastAPI, WebSockets, NetworkX (Graph Engine), Scikit-Learn (TF-IDF Fingerprinting).

## Core Innovation
Instead of answering "Which alerts are duplicates?", Kryven answers:
**"What is happening to my system, why is it happening, how far has it propagated, which alerts actually matter, and what should I do next?"**

## Getting Started (Local Demo)

1. **Start Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\activate on Windows
   pip install -r requirements.txt # (Dependencies are fastAPI, etc.)
   uvicorn main:app --reload
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Run the Simulation**
   - Open `http://localhost:3000`
   - Navigate to the **Chaos Lab** tab.
   - Click **TRIGGER SCENARIO** under "PostgreSQL Pool Exhaustion".
   - Switch back to **Live Topology** and watch the cascading failure propagate, the noise reduction ratio skyrocket, and the incident root cause get identified automatically.

## API Documentation
- `POST /api/events` - Ingest telemetry
- `GET /api/incidents` - List active incidents
- `GET /api/topology` - Live dependency graph
- `WS /api/ws/events` - Real-time firehose
