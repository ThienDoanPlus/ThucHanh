# LUMINA OPTICS — Eyewear E-Commerce & AI Virtual Try-On Platform

Enterprise-grade eyewear e-commerce platform built with React 19, TypeScript, Vite, Tailwind CSS, and Python/Django services. The system features browser-based AI Virtual Try-On, 6-dimensional facial geometry filters, dynamic urban road delivery calculation, anti-abuse promotion validation, and automated VietQR payment reconciliation.

---

## Overview

The platform addresses operational and user-experience challenges specific to online optical retail:

- **6-Dimensional Frame Filtering:** Real-time bi-directional URL synchronization across face shape (Round, Square, Oval, Long), frame style (Square, Round, Cat-Eye, Aviator, Rimless, Browline), frame material (Titanium, Acetate, Metal PVD, TR90), target audience, color tone, and price tiers.
- **Mobile-First Bag UX:** Non-disruptive add-to-bag interaction with micro-animations and zero full-screen drawer takeovers during catalog browsing.
- **AI Virtual Try-On & Rate Limiting:** Facial landmark detection and shape recommendation powered by Gemini Multimodal Vision, secured behind authentication with a strict quota of 20 daily requests per user.
- **Urban Shipping Distance Matrix:** Haversine formula adjusted by an urban circuity multiplier (1.35) for Vietnam road networks, with tiered delivery fees computed strictly on the backend.
- **Anti-Abuse Promotion Engine:** Multi-factor identity auditing (User ID, Email, Phone) preventing duplicate lifetime redemptions of welcome vouchers, calendar-year rollover for seasonal promotions, and tiered bulk discounting.
- **VietQR Payment Reconciliation:** Dynamic Napas 24/7 QR generation with structured syntax (`KINH [OrderCode]`) and administrative approval workflows.
- **Role-Based Access Control (RBAC):** Strict separation of Customer, Staff, and Admin interfaces with complete UI isolation.

---

## Technology Stack

### Client Layer
- **Framework:** React 19, TypeScript (Strict Mode)
- **Tooling & Bundler:** Vite 8
- **Styling:** Tailwind CSS 4
- **State Management:** Redux Toolkit (auth, cart, filter, notification slices)
- **Routing:** React Router v6
- **Internationalization:** react-i18next (Vietnamese and English)

### Backend & Services
- **API Runtime:** Python 3.11 / Django Rest Framework (DRF) & Express middleware
- **Database:** TiDB (Distributed SQL, MySQL 8.0 compatible)
- **Media Storage:** Cloudinary
- **Authentication & Notifications:** Firebase Auth, Firebase Cloud Messaging (FCM), Gmail SMTP

### Quality Assurance
- **Frontend Testing:** Vitest, React Testing Library, jsdom
- **Backend Testing:** Pytest, pytest-django

---

## Directory Structure

```text
.
├── PROJECT_RULES.md            # Technical constraints and architectural guidelines
├── SRS_EYEWEAR_ECOMMERCE.md    # Software Requirements Specification (v1.0.0)
├── .cursorrules                # System instructions for AI assistants
├── docker-compose.yml          # Container orchestration for local development
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── backend/
│   ├── apps/core/services.py   # Shipping, voucher, quota, and review services
│   ├── schema_tidb.sql         # Relational database schema with composite indices
│   └── tests/                  # Backend unit test suites
└── src/
    ├── components/             # Reusable UI components
    ├── hooks/                  # Custom React hooks (debounce, filter sync)
    ├── i18n/                   # Localization dictionaries (vi, en)
    ├── pages/                  # Route-level views (Storefront, Admin, Staff Kanban)
    ├── services/               # API clients and Firebase connectors
    ├── store/slices/           # Redux Toolkit state slices
    ├── types/                  # Shared domain types and interfaces
    ├── utils/                  # Pure utility functions (shipping, voucher validation)
    └── __tests__/              # Frontend test suites
```

---

## Getting Started

### Prerequisites
- Node.js >= 20.20.0
- Python >= 3.11
- npm or bun

### Installation

```bash
# Clone the repository
git clone git@github.com:ThienDoanPlus/ThucHanh.git
cd "Rayban Eyewear"

# Install frontend dependencies
npm install --legacy-peer-deps

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Environment Configuration

Copy the example environment configuration and supply your keys:

```bash
cp .env.example .env.local
```

Required variables:
- `GEMINI_API_KEY`: Google Gemini API key for AI Try-On analysis
- `VITE_FIREBASE_CONFIG`: Firebase configuration object
- `CLOUDINARY_URL`: Cloudinary storage credentials

### Running the Application

```bash
# Start local development server (Vite + Express API)
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## Testing & Verification

Both frontend and backend suites are configured for continuous verification:

```bash
# Run frontend unit tests
npm test

# Run TypeScript strict type-check
npm run lint

# Run backend unit tests
PYTHONPATH=backend python3 -m pytest backend/tests

# Build production bundle
npm run build
```

---

## Documentation

- [PROJECT_RULES.md](PROJECT_RULES.md): Architectural constraints, design patterns, and pre-commit checklist.
- [SRS_EYEWEAR_ECOMMERCE.md](SRS_EYEWEAR_ECOMMERCE.md): Business requirements, database entity diagrams, and API specifications.
