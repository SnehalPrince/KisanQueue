# 00 — Project Overview

## Project
**KisanQueue** — Smart India Hackathon 2026, Problem Statement **PS 26032**: *"Farmers often face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status at government MSP procurement centres."*

---

## The Core Problem & The Real-World Gap

Government MSP procurement centres (mandis) already run digitized registration/slot systems (MP e-Uparjan, Haryana e-Kharid, Punjab Anaaj Kharid). Despite this, a farmer who has successfully registered and received a slot can still arrive at the centre and discover a 6-hour lifting delay, a 30-farmer backlog, or a paused centre — because **operational reality on a given day is not visible before the farmer leaves home**.

Additionally, existing government portals suffer from **severe form fatigue**: forcing farmers through repetitive, multi-page questionnaires on every single harvest visit.

---

## The Solution: Progressive Onboarding & Persistent Assistant

KisanQueue is a **farmer-first visibility, queue, and admission layer** that sits *on top of* existing procurement systems. It does not replace registration or MSP workflows. It introduces:

1. **One-Time Onboarding**: Farmer creates a verified profile once; subsequent visits recognize them automatically from their linked WhatsApp account.
2. **Persistent WhatsApp Assistant**: Farmer simply messages *"I want to sell wheat"* ➔ Bot recommends nearby mandis with live ETAs, asks only for quantity (*quintals*), and generates an instant pass (`KQ-1047`) with a signed QR code.
3. **Backlog-Aware Deterministic ETA**: Reacts in real time when mandi officers report lifting delays or capacity changes.
4. **Offline-Resilient Signed QR Pass**: HMAC-SHA256 signed gate pass that can be screenshotted and scanned at the gate even without mobile network.

> **"e-Uparjan tells you *that* you have a slot — KisanQueue tells you *whether today is actually a good day to use it*."**

---

## Craft & Architecture Standards

* **UI Craft & Design Engineering**: Built with **Emil Kowalski design engineering principles** and **Jakub Antalik `transitions.dev` motion tokens** for crisp, hardware-accelerated micro-interactions without performance drops on budget phones.
* **Backend Robustness**: High-performance **FastAPI Modular Monolith** with async SQLAlchemy 2.0, Pydantic v2 schemas, and native WebSockets (<2s sync latency).
* **Pluggable Integration**: `GovernmentProcurementAdapter` interface decouples KisanQueue from state-specific API differences.
* **WCAG 2.1 AA Accessibility**: High-contrast, bilingual (Hindi/English), colorblind-safe status badges with screen reader compatibility.

---

## One-Sentence Summaries

### One-Sentence Product Definition
KisanQueue is a persistent WhatsApp assistant and real-time visibility layer that tells farmers honestly, before they travel, what is really happening at their procurement centre.

### One-Sentence Technical Definition
A modular-monolith FastAPI + React application featuring a deterministic capacity-aware ETA model, cryptographic QR gate passes, and sub-2-second WebSocket broadcasting.

### One-Sentence Judge Pitch
"e-Uparjan tells you *that* you have a slot — KisanQueue tells you *whether today is actually a good day to use it*."
