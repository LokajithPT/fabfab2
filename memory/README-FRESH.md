# FabFab2 Upgrade — Fresh Start Guide

## Who You Are
You're an AI that just woke up. Your mission: understand what's been done to upgrade `fabfab2` and what's left.

## The Project
`/home/intern/code/fabshit/fabfab2/` — a laundry/dry-cleaning POS app.

**User**: wants it upgraded to match FabZClean-T1's features.
**Constraints**: Keep Flask (Python), consolidate to 1 frontend, no new DB tables, no mobile/CI/CD/testing/docs.
**Vibe**: Must look "human made" — no chumma/shit/wow filenames, no AI tracker docs.

## Architecture

### Backend (Flask on :5001)
- `server/app.py` — app factory, registers 13 blueprints
- `server/models.py` — SQLAlchemy models: Worker, Track, Service, Customer, Order, Delivery, TransitBatch, TransitOrder, **Booking** (new)
- `server/routes/` — split into files:
  - `auth.py` — admin/employee/customer login
  - `orders.py` — CRUD + status + barcodes
  - `workers.py` — worker CRUD
  - `customers.py` — CRUD + CSV import
  - `services.py` — CRUD
  - `transit.py` — batch management (admin + employee)
  - `bookings.py` — **NEW**: booking CRUD + convert to order
  - `public_routes.py` — **NEW**: public tracking, public invoice
  - `analytics.py` — **NEW**: KPI, trends
  - `reports.py` — **NEW**: summary + orders reports
  - `settings.py` — **NEW**: admin settings
  - `whatsapp.py` — **NEW**: send invoice/bill
  - `misc.py` — dashboard summary, QR, ping, admin SPA fallback
- `server/utils/` — `gst_utils.py`, `validation_utils.py`, `business_config.py`, `barcode_utils.py`
- **70 routes total**, verified working.

### Frontend (Vite on :5173, proxies to Flask)
- `client/src/` — React 18 + wouter + shadcn/ui + Tailwind v3
- `client/src/contexts/auth-context.tsx` — AuthProvider with login/logout, stores to localStorage under `fab-token`/`fab-user`
- `client/src/contexts/settings-context.tsx` — SettingsProvider (localStorage-backed)
- `client/src/hooks/` — `use-debounce`, `use-pagination`, `use-api`
- `client/src/lib/api-client.ts` — unified fetch wrapper (auto-attaches JWT)
- 30+ pages in `client/src/pages/`

### Routing (App.tsx)
```
Outer Switch:
  /login → Login page
  /profile → Profile
  /change-password → ChangePassword
  /track/:orderNumber → PublicOrderTracking
  /bill/:orderNumber → BillView
  /portal → CustomerPortal
  /terms, /privacy, /refund, /cookies → Legal pages
  /unauthorized, /account-inactive → Static pages
  (catch-all) → ProtectedRoute → MainLayout
    Inner Switch:
      /, /dashboard → Dashboard
      /orders → Orders
      /orders/:id → OrderDetail (lazy)
      /inventory → Inventory
      /customers → Customers
      /services → Services
      /employees → Employees
      /create-order → CreateOrder
      /tracking → Tracking
      /logistics → Logistics
      /transit-orders → TransitOrders
      /booking → Booking (lazy)
      /analytics → Analytics (lazy)
      /reports → Reports (lazy)
      /settings → Settings (lazy)
      /print-queue → PrintQueue (lazy)
      * → NotFound
```

## What's Been Done
1. **Cleanup**: Deleted chumma, shit, wow, tableshit, empchumma, AI docs, Electron, separate frontends, server cruft
2. **Backend refactor**: app.py split into models + routes, verified 70 routes
3. **New routes**: bookings, public, analytics, reports, settings, whatsapp
4. **Utils**: gst, validation, business config, barcode
5. **Frontend infra**: AuthContext, SettingsContext, api-client, hooks
6. **New pages**: order-detail, public-tracking, bill-view, settings, print-queue, booking, analytics, reports, customer-portal, legal/static, rewritten login
7. **Config**: vite.config.ts (proxy → :5001), tailwind.config.ts, postcss.config.js, tsconfig.json, cleaned package.json

## What's Left
1. **npm install** — user said they'll handle it. Was failing due to better-sqlite3 native module on Node 26. Removed better-sqlite3 and other backend deps from package.json.
2. **TypeScript check** — run `npm run check` after install to catch any type errors
3. **Drizzle schema** (`shared/schema.ts`) — unused/legacy, can be deleted if needed. References pgTable which needs drizzle-orm, which was removed from deps.

## Key Files For Reference
- `server/app.py` — entry point, blueprint registration
- `server/routes/bookings.py` — example of a clean new Flask route file
- `client/src/App.tsx` — all routing
- `client/src/contexts/auth-context.tsx` — auth flow
- `client/src/lib/api-client.ts` — API client pattern
- `client/src/pages/booking.tsx` — example of a new page (CRUD + dialogs)
- `client/src/pages/login.tsx` — rewritten with AuthContext

## How to Run
```bash
# Terminal 1
cd /home/intern/code/fabshit/fabfab2/server && python3 app.py

# Terminal 2
cd /home/intern/code/fabshit/fabfab2 && npm run dev
```
