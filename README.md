# 🕶️ LUMINA OPTICS — Eyewear E-Commerce & AI Virtual Try-On Platform

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-CSS%204-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-v2-764ABC?logo=redux)](https://redux-toolkit.js.org/)
[![Vitest](https://img.shields.io/badge/Vitest-100%25%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![Pytest](https://img.shields.io/badge/Pytest-100%25%20Passed-brightgreen?logo=pytest)](https://docs.pytest.org/)

Modern, high-performance, mobile-first eyewear e-commerce platform featuring an interactive **AI Virtual Try-On** experience, 6-dimensional face shape fitting filters, dynamic urban road shipping calculation, anti-abuse voucher engine, and VietQR payment flow.

---

## 🚀 Key Modules & Capabilities

- **6-Dimensional Eyewear Filter:** Real-time dual-direction URL query syncing across Face Shape (Round, Square, Oval, Long), Frame Style (7 styles), Material (Titanium, Acetate, Metal PVD, TR90), Target Gender, Color Tone, and Price Range with 300ms search debouncing.
- **Mobile-First Add-to-Cart UX:** Preserves browsing flow without unprompted drawer intrusion; delivers instant visual feedback via keyframe animations (`cartBump`, `badgePop`, floating `+1 👓`) and auto-reverting button feedback (1400ms).
- **AI Virtual Try-On & Token Shield:** Real-time face mesh landmark detection and face-shape suggestion powered by Gemini AI with strict authentication guards and a hard limit of 20 daily analyses per user (HTTP 429 throttling).
- **Urban Shipping Distance Matrix:** Flagship store origin (`294 Pham Van Bach, P. Tan Son, Tan Binh, HCMC`) with Haversine distance adjusted by the urban circuity coefficient ($1.35$) and tiered pricing ($0₫$, $25.000₫$, $45.000₫$, $70.000₫$).
- **Anti-Abuse Promotion Engine:** Multi-layer identity audit (`userId`, `email`, `phone`) preventing lifetime re-use of welcome vouchers (`EYEWEAR10` / `ROSE10`), calendar year auto-unlocking for holiday promotions, and automatic bulk/VIP discounts.
- **VietQR Payment & Staff Kanban:** Dynamic Napas 24/7 QR generation with structured order references (`KINH [OrderCode]`), two-step Admin balance approval, and staff optical lab workshop management.
- **Strict RBAC & UI Isolation:** Admin accounts automatically isolate away customer-facing widgets (Cart Drawer, Floating Social Hub) to maintain a focused operations dashboard.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript (Strict), Vite 8, Tailwind CSS 4, Redux Toolkit, React Router v6 |
| **Localization** | `react-i18next` with complete Vietnamese (`vi`) and English (`en`) dictionaries |
| **Backend & API** | Python / Django Rest Framework (DRF) & Express + Vite Middleware |
| **Database** | TiDB (MySQL 8.0 Distributed SQL Compatible) |
| **Storage & Auth** | Cloudinary (Media/Rx Presigned URLs), Firebase Authentication & FCM Push |
| **Testing** | Vitest & React Testing Library (Frontend), Pytest (Backend) |

---

## 📂 Project Architecture

```text
eyewear-ecommerce/
├── PROJECT_RULES.md                 # Mandatory technical directives for AI & Devs
├── SRS_EYEWEAR_ECOMMERCE.md         # Full 10-chapter Business & Technical Specification
├── .cursorrules                     # IDE AI auto-loaded system prompt
├── docker-compose.yml               # Local development coordination
│
├── backend/                         # Django Rest Framework Services & Schema
│   ├── apps/core/services.py        # Promotion, Shipping, Quota & Review Services
│   ├── schema_tidb.sql              # Relational TiDB schema with composite indices
│   └── tests/                       # Pytest unit test suite
│
└── src/                             # React 19 Client Application
    ├── components/                  # UI Components (Storefront, Cart, TryOn, Layout)
    ├── store/slices/                # Redux Toolkit Slices (auth, cart, filter, notification)
    ├── services/                    # API & Firebase service clients
    ├── utils/                       # Pure business functions (shipping, voucher, formatters)
    ├── i18n/locales/                # Bilingual dictionaries (vi.json, en.json)
    └── __tests__/                   # Vitest unit test suite
```

---

## 🧪 Testing & Quality Assurance

### Run Frontend Unit Tests (Vitest)
```bash
npm test
```
*Executes all test suites covering cart actions, 6D filter combinations, Haversine shipping tiers, and voucher anti-abuse rules.*

### Run Backend Unit Tests (Pytest)
```bash
PYTHONPATH=backend python3 -m pytest backend/tests
```
*Validates rate-limiting, lifetime/holiday voucher validation, verified purchase reviews, and admin QR approval.*

### TypeScript Strict Validation
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## 📖 Specifications & Guidelines

- [PROJECT_RULES.md](PROJECT_RULES.md): Cardinal architectural invariants, coding rules, and pre-commit checklist.
- [SRS_EYEWEAR_ECOMMERCE.md](SRS_EYEWEAR_ECOMMERCE.md): Official Software Requirements Specification (v1.0.0).
