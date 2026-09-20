# TradePro — Indian Stock Trading Platform

A full-stack demo trading app: React + Vite frontend, Spring Boot + PostgreSQL
(Neon) backend, live NSE data & charts (Twelve Data), Razorpay payments, JWT
auth with password reset by email.

## Features

- JWT auth (register / login) with show/hide password + strength meter
- Forgot password via email (SMTP) with token reset flow
- Live NSE stock quotes + candlestick charts (TradingView Lightweight Charts)
- Buy / Sell with server-side holdings + wallet (persisted in PostgreSQL)
- Add funds via Razorpay (order + signature verification server-side)
- Portfolio dashboard: total value, cash, holdings value, live P&L
- Profile with picture upload
- Dark / Light theme toggle

---

## Prerequisites

- **Node.js 18+** (for the frontend)
- **JDK 21** (for the backend) — https://adoptium.net
  Maven is NOT required: the backend includes a Maven wrapper (`mvnw`).

## First-time setup (one-time, ~1 min)

Secrets are not committed to git (for security). Run the setup script to copy
the example config into place:

- **Windows:** `setup.cmd`
- **macOS/Linux:** `sh setup.sh`

This creates `.env` and `backend/src/main/resources/application-local.properties`
from their `.example` templates. Then open the backend properties file and fill
in your **Neon database** details (see `backend/README.md` for how to get them).
The demo Razorpay / Gemini / Twelve Data keys are pre-filled in the templates.

> Prefer manual? Copy `.env.example` → `.env` and
> `application-local.properties.example` → `application-local.properties`.

## Run (2 terminals)

**Terminal 1 — backend:**
```cmd
cd backend
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```
(macOS/Linux: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`)

**Terminal 2 — frontend:**
```cmd
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

---

## Notes

- The backend auto-creates database tables on first run (Hibernate).
- Without SMTP configured, the password-reset token is returned in the API
  response (dev mode) and logged, so you can still test the flow.
- Without the backend running, buy/sell/funds fall back to browser
  localStorage so the UI stays usable.
- **Kaspersky / some antivirus block `api.twelvedata.com`** (flagged as
  crypto). If charts/quotes don't load, whitelist that domain.
- Full backend/API details: see `backend/README.md`.

## Security

The provided Razorpay and DB keys are for demo/testing. Rotate them before any
real use, and never commit `application-local.properties` or `.env` (both are
gitignored).
