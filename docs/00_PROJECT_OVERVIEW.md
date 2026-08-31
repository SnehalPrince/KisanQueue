# 00 — Project Overview

## Project
**KisanQueue** — Smart India Hackathon 2026, Problem Statement **PS 26032**: *"Farmers often face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status."*

## Problem
Government MSP procurement centres (mandis) already run digitized registration/slot systems (MP e-Uparjan, Haryana e-Kharid, Punjab e-pass). Despite this, a farmer who has successfully registered and received a slot can still arrive at the centre and discover backlog, lifting delays, reduced processing capacity, or a paused centre — because **operational reality on a given day is not visible before the farmer leaves home**.

## Target Users
- **Farmer** — the primary user, often with limited digital literacy, a low-end smartphone, unstable network, and a preference for Hindi/regional language.
- **Procurement Officer** — runs the centre, needs a fast way to report real-world conditions (backlog, delays, pauses).
- **Administrator** — configures centres/officers and monitors the system (kept minimal for MVP).

## Solution
KisanQueue is a **farmer-first visibility, queue, and admission layer** that sits *on top of* existing procurement systems. It does not replace registration or MSP workflows. It answers one question honestly:

> **"If I leave for the mandi now, what is likely to happen?"**

It does this via a live centre status feed, a virtual queue with position tracking, and a **backlog-aware ETA** that reacts when an officer reports lifting delays, reduced capacity, or a pause — plus a WhatsApp-accessible interface so farmers are not forced into a heavy app experience.

## Differentiation (validated — see `KisanQueue_Validation_Report.md`)
KisanQueue is **not** "the first system with slots + QR + tracking" — those already exist in various state systems. The genuine gap is:
- No existing system exposes **live operational status** (backlog, delay, pause) to the farmer *before travel*.
- No existing system ties queue ETA to **operational capacity conditions** rather than a static schedule.
- No existing system offers a **WhatsApp-first, bilingual** access layer designed for low digital literacy.

## Architecture Summary
A modular monolith (FastAPI backend, React/TypeScript frontend, PostgreSQL, WebSocket realtime layer) with a **Government Procurement Adapter** interface so it can later integrate with e-Uparjan/e-Kharid/Punjab systems instead of replacing them. See `10_SYSTEM_ARCHITECTURE.md`.

## MVP Summary
A 7-hour hackathon build covering: farmer login, centre discovery + live status, queue join + token/QR, backlog-aware ETA, officer dashboard with capacity/delay controls, real-time ETA propagation to farmers, mocked procurement/payment status, Hindi/English toggle, and a simulated WhatsApp interaction. See `06_MVP_SCOPE.md`.

## Non-Goals
Not building (unless PS-justified): AI disease detection, crop recommendation, IoT sensors, blockchain, payment gateways, facial recognition, generic chatbots, marketplace, lending, insurance. See `08_DESIGN_SYSTEM` non-goals are UX; functional non-goals are in `01_PRD.md`.

## Key Assumptions
- Government procurement APIs are **not available** to us; all such integrations are mocked/simulated for the MVP (`21_INTEGRATION_STRATEGY.md`).
- Officers will manually report operational status (no IoT/sensor feed) — this is the core, honest data source for the ETA engine.
- Farmers have basic smartphone or WhatsApp access; SMS is a fallback channel, not designed in depth for MVP.

## Key Risks
- Judges may ask "doesn't e-Uparjan already do this?" — addressed head-on in `27_DEMO_SCRIPT.md` and `28_SIH_PITCH_TECHNICAL_STORY.md`.
- ETA is inherently an estimate, not a guarantee — the product must never claim false precision (`16_ETA_ENGINE.md`).
- Real government integration requires data-sharing agreements outside our control — clearly marked as a production/roadmap dependency, not an MVP claim.

## SIH Relevance
Directly targets PS 26032's stated problem (waiting times, schedule information, procurement-status uncertainty) with a scoped, explainable, non-overengineered solution that acknowledges rather than ignores existing government digitization.

---

### One-Sentence Product Definition
KisanQueue is a visibility and queue layer that tells farmers, honestly and in advance, what is really happening at their procurement centre.

### One-Sentence Technical Definition
A modular-monolith web/WhatsApp application with a real-time queue engine and a deterministic, capacity-aware ETA model, built to sit on top of (not replace) state procurement systems via a pluggable adapter interface.

### One-Sentence Judge Pitch
"e-Uparjan tells you *that* you have a slot — KisanQueue tells you *whether today is actually a good day to use it*."
