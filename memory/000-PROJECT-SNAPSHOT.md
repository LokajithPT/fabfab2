# Project Snapshot — FabFab2 Upgrade

## What I Am
AI assistant helping turn fabfab2 into a well-structured app.
I have amnesia, I write everything down so I don't forget.

## The Mission
Upgrade fabfab2 to match FabZClean-T1's features.
Skip: DB schema changes, mobile, CI/CD, testing, docs, wallet/credit, accounting, loyalty.

## Constraints
- Keep Flask (Python) backend — add features in Python
- Add new SQLAlchemy models to Flask if needed (Booking model)
- Consolidate 3 frontends into 1 unified app with role-based routing
- Keep existing 8 Drizzle tables — but can add Flask SQLAlchemy models
- MUST look "human made" — no AI artifacts, consistent patterns
- Clean up: remove chumma, shit, wow, tableshit, AI tracker docs
- Remove vibe-coded filenames
- Need done today (2026-07-10)

## What We're Building
### Pages (add to client/src/pages/):
1. Order Detail — single order view, status changes, print, WhatsApp
2. Public Order Tracking — status timeline by order number
3. Customer Portal — self-service: my orders, profile, book service
4. Bill View — invoice/bill display
5. Settings — user preferences (localStorage + Flask)
6. Print Queue — barcode/label/thermal tag printing
7. Booking — appointment inbox, convert to order
8. Analytics — KPI cards, basic charts
9. Reports — basic reports
10. Legal: terms, privacy, cookies, refund (static)
11. Unauthorized (403)
12. Account Inactive

### Backend (Flask routes in Python):
- bookings.py — booking CRUD + convert to order
- public.py — public tracking, public invoice
- analytics.py — KPI endpoints from orders data
- reports.py — basic report endpoints
- settings.py — user preferences
- whatsapp.py — send invoice via WhatsApp

### Shared utilities (server/utils/):
- gst_utils.py — Indian GST compliance
- validation_utils.py — email, phone, sanitization
- business_config.py — template configs

### Frontend Infrastructure:
- AuthContext — proper auth provider
- SettingsContext — user preferences
- Hooks: use-debounce, use-pagination
- Role-based routing wrapper
- Consolidated API client

### Cleanup:
- Delete chumma, shit, wow, tableshit, empchumma
- Delete AI tracker docs (BARCODE_FIX_COMPLETE.md, SEXY_UI_PREVIEW.md, UI_PREVIEW.md)
- Split app.py into models.py + routes/*.py
- Wire all pages into router
- Consolidate customer/worker/employeelocal features

## Architecture Decisions (need user confirmation)
1. Split app.py? → YES (better human-made code)
2. Booking: new Booking SQLAlchemy model vs reuse orders → need to ask
3. WhatsApp: simple send vs full interactive flow → need to ask
