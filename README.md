# KisanQueue
Smart, real-time procurement queue and scheduling platform for farmers.

## Stack
- Frontend: React + Vite
- Backend: Python FastAPI REST API
- Database: SQLite
- AI + WhatsApp Bot: Python

## Core flow
Registration → Centre selection → Slot booking → QR token → Check-in → Live queue → Backlog-aware ETA → Procurement → Payment status → Notifications.

## Backlog-aware ETA
ETA = ((Farmers Ahead × Average Processing Time) / Active Counters) × Delay Multiplier
