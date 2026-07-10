# Decisions Made

## User Choices
1. Keep Flask backend, add features in Python
2. Consolidate 3 frontends → 1 unified app
3. Keep existing 8 Drizzle tables (can add Flask SQLAlchemy models)
4. Full cleanup + features
5. Skip wallet/credit/accounting/loyalty
6. Skip CI/CD, testing, docs, mobile
7. Drop Electron
8. Booking → new Booking SQLAlchemy model
9. WhatsApp → simple send invoice text
10. Employee mgmt → keep simple
11. Analytics → basic KPIs only
12. Remove artifacts: chumma, shit, wow, tableshit, AI docs

## Architecture
- Flask backend, split into models.py + routes/*.py
- Express index.ts still serves frontend static files
- Frontend uses wouter (keep existing)
- Auth: Flask JWT for employee/customer, session for admin
- API base: Flask on port 5001, Express on 5173

## Build Order
1. Backend refactor (split app.py) 
2. Backend new features (bookings, public, analytics, settings, etc.)
3. Utils (gst, validation, business config)
4. Frontend consolidation (update router, add pages, contexts, hooks)
5. Wire auth, test
