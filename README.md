# Medcure 🏥🐾
> **Blinkit-Style Human and Veterinary Quick-Commerce Medicine Delivery Platform**  
> *Target Pilot City: Gorakhpur, Uttar Pradesh, India*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Flutter](https://img.shields.io/badge/Flutter-Ready-02569B.svg)](https://flutter.dev/)
[![Compliance](https://img.shields.io/badge/Drugs%20%26%20Cosmetics%20Act-1940-green.svg)](docs/ARCHITECTURE_AND_SPECIFICATION.md)

---

## 🌟 Overview

Medcure is a hyper-local, quick-commerce healthcare delivery platform designed to serve both **Human Healthcare** and **Animal Healthcare (Veterinary)** in **Gorakhpur, Uttar Pradesh, India**. 

The platform operates on a **zero-warehouse partner model**—aggregating licensed retail pharmacies under the Drugs & Cosmetics Act 1940, coordinating prescription verification by registered pharmacists, batch-level inventory reservation, and last-mile delivery with recipient OTP verification.

Designed with a modern **Claymorphism** UI design system for tactile, accessible, and friendly interaction.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    Client["Client Apps<br/>(Customer / Pharmacy / Admin)"] --> Gateway["API Gateway<br/>(Express / Edge API)"]
    Gateway --> Orders["Order State Machine<br/>(ACID Reservation)"]
    Gateway --> RxVault["Prescription Vault<br/>(15m Expiring SAS)"]
    Gateway --> AI["Safe AI Assistant<br/>(Prompt Shielded)"]
    Orders --> DB[(PostgreSQL 15+<br/>PostGIS / RLS)]
```

---

## 🚀 Key Features

* **Dual Healthcare Separation:** Independent taxonomies and safety workflows for human medicines and veterinary products (including species suitability and livestock withdrawal period warnings).
* **Server-Enforced RBAC:** Role-based access control for Customers, Pharmacy Owners, Dispensing Pharmacists, Pharmacy Staff, Riders, and Platform Admins.
* **Prescription Review Workflow:** Schedule H and restricted medicines cannot bypass human pharmacist verification. Council registration numbers are recorded for every approval.
* **Claymorphic Design System:** Tactile 3D surfaces, pillowy shadows, and bouncy micro-interactions.
* **Controlled AI Assistant:** Grounded catalogue search and order tracking with safety guardrails that block unauthorized medical diagnoses or dosage calculations.
* **Batch & Handover Integrity:** Batch-level tracking and 4-digit customer delivery OTP handshakes.

---

## 📁 Repository Structure

```
Medcure/
├── backend/                  # REST API Gateway & Business Engine
│   ├── migrations/           # PostgreSQL DDL & Gorakhpur pilot seed data
│   ├── src/
│   │   ├── services/         # Order state machine & AI assistant
│   │   ├── routes/           # REST endpoints (/api/v1)
│   │   ├── store.ts          # Seeded transactional in-memory data store
│   │   └── __tests__/        # Automated integration test suite
│   └── .env.example          # Environment configuration template
├── web/                      # React 18 + Vite + TypeScript Web Application
│   ├── src/
│   │   ├── App.tsx           # Customer Store, Pharmacy Portal & Admin Station
│   │   └── index.css         # Claymorphism design system tokens
│   └── vite.config.ts
├── mobile/                   # Flutter Mobile Codebase (Android & iOS)
│   ├── lib/                  # Screens, models, and HTTP client
│   └── pubspec.yaml
└── docs/
    └── ARCHITECTURE_AND_SPECIFICATION.md   # Complete system architecture & schema
```

---

## 🛠️ Quick Start

### 1. Start the Backend API Gateway
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:4000/api/v1
```

### 2. Run Backend Tests
```bash
cd backend
npm test
```

### 3. Start the Web Portal (Claymorphic UI)
```bash
cd web
npm install
npm run dev
# Open http://localhost:3000 (or http://localhost:3001) in your browser
```

---

## 📜 Compliance & Legal Notice

*All partner pharmacies are independently verified and licensed under the Uttar Pradesh Food Safety & Drug Administration. Prescription dispensing is performed exclusively by registered pharmacists holding valid State Pharmacy Council credentials.*
