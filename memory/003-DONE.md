# Upgrade Complete

## What Changed

### Cleaned Up
- Removed: chumma, shit, wow, tableshit, empchumma
- Removed: AI tracker docs (BARCODE_FIX_COMPLETE, SEXY_UI_PREVIEW, UI_PREVIEW)
- Removed: Electron (electron.js, preload.js, employeelocal/)
- Removed: 3 separate frontends (customer/, worker/, employee/, employeeserver/)
- Removed: FabZClean-T1 reference, server Python cruft, drizzle/, old images
- Removed: 50+ unused npm deps (better-sqlite3, pg, passport, drizzle-orm, etc.)

### Backend (Flask) — 70 routes
- Split 1228-line app.py into organized files:
  - `models.py` — all SQLAlchemy models (incl. new Booking)
  - `routes/auth.py` — admin, employee, customer auth
  - `routes/orders.py` — order CRUD + status + barcodes
  - `routes/workers.py` — worker CRUD
  - `routes/customers.py` — customer CRUD + CSV import
  - `routes/services.py` — service CRUD
  - `routes/transit.py` — transit batch management (admin + employee)
  - `routes/bookings.py` — NEW: booking CRUD + convert to order
  - `routes/public_routes.py` — NEW: public tracking, public invoice
  - `routes/analytics.py` — NEW: KPI, revenue trend, order status, service popularity
  - `routes/reports.py` — NEW: summary report + orders report
  - `routes/settings.py` — NEW: admin settings
  - `routes/whatsapp.py` — NEW: send invoice/bill via WhatsApp
  - `routes/misc.py` — dashboard summary, QR serving, admin SPA fallback
- Utils: `gst_utils.py`, `validation_utils.py`, `business_config.py`, `barcode_utils.py`

### Frontend — 30+ pages, consolidated
- **AuthContext** — unified auth (admin/employee/customer)
- **SettingsContext** — user preferences
- **New hooks**: use-debounce, use-pagination, use-api
- **api-client** — unified fetch wrapper with token handling
- **New pages**:
  - order-detail — single order view with status progression
  - public-order-tracking — public tracking by order number
  - bill-view — printable invoice view
  - settings — business info, GST, invoice defaults
  - print-queue — thermal tag printing
  - booking — booking inbox + convert to order
  - analytics — KPI dashboard
  - reports — summary report with order status breakdown
  - customer-portal — email-based order lookup
  - login — REWRITTEN: tab-based (admin/employee/customer) with AuthContext
  - terms, privacy, refund, cookies — legal pages
  - unauthorized (403), account-inactive
- **Updated**: App.tsx (lazy loading, role-based routing), sidebar (new nav items)
- **Configs**: vite.config.ts (proxy to Flask), tailwind.config.ts, postcss.config.js, tsconfig.json

## To Start
```bash
# Terminal 1: Flask backend
cd server && python3 app.py

# Terminal 2: Vite dev server
npm run dev
```
