# Doctor Appointment Booking System

A full-stack web application (NestJS + Next.js + PostgreSQL) for scheduling and managing doctor appointments.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Assumptions](#assumptions)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Run & Verify](#run--verify)
- [Features & Limitations](#features--limitations)
- [Architecture Notes](#architecture-notes)
- [Accessibility & UI](#accessibility--ui)
- [Environment Templates](#environment-templates)
- [API Quick Reference](#api-quick-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 1. Overview

### Modules

- **Public Booking (Next.js SSR):** Search doctors, view real-time slot grid (7–14 days), and book appointments.
- **Doctor Portal (CSR):** Login, manage working hours & unavailability, view daily/weekly appointments.
- **Backend (NestJS):** Handles authentication, scheduling, rate-limiting, CAPTCHA, and mock notifications.
- **Database (PostgreSQL):** Stores doctors, specialties, rules, appointments with UTC timestamps.

---

## 🔧 2. Assumptions

- All datetimes stored in **UTC**
- Appointment slot size = **20 minutes**
- Only **Mon–Fri** are valid working days
- **reCAPTCHA v2 Invisible** for spam prevention
- Mock email/SMS notifications (no real sends)
- Rate limiting: 100 req/min global, 5 bookings/hour/IP

---

## 📦 3. Prerequisites

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | ≥ 18.x | tested on 22.x |
| PostgreSQL | ≥ 13.x | local or Docker |
| npm / pnpm | latest | |
| (Optional) Docker Desktop | latest | for future compose setup |

---

## 🚀 4. Setup

### 4.1 Clone Repository

```bash
git clone <your-repo-url> doctor-appointment
cd doctor-appointment
```

### 4.2 Backend Environment

```bash
cp backend/.env.example backend/.env
```

Set at minimum:

```ini
PORT=4000
CORS_ORIGIN=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=doctorapp
DB_USER=doctorapp
DB_PASS=doctorapp
JWT_SECRET=dev_secret
SEND_EMAILS=false
SEND_SMS=false
```

### 4.3 Frontend Environment

```bash
cp frontend/.env.local.example frontend/.env.local
```

Use Google's test reCAPTCHA key:

```ini
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

### 4.4 Database Initialization

```bash
psql -h localhost -U postgres -d postgres -c "CREATE ROLE doctorapp LOGIN PASSWORD 'doctorapp';"
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE doctorapp OWNER doctorapp;"
```

### 4.5 Install & Run

```bash
# Backend
cd backend
npm install
npm run build
npm run mig:run
npm run seed
npm run start:dev   # → http://localhost:4000

# Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev         # → http://localhost:3000
```

---

## ✅ 5. Run & Verify

### Public Booking

1. Visit `/book`
2. Choose **Any Available Doctor**
3. Click a free slot → fill details → Confirm Booking
4. Redirects to `/confirm?id=...`

Backend logs will show:
```
(MOCK EMAIL) ... (MOCK SMS) ...
```

### Doctor Portal

| Page | URL | Notes |
|------|-----|-------|
| Login | `/doctor/login` | seeded creds below |
| Dashboard | `/doctor/dashboard` | today's appointments |
| Schedule | `/doctor/schedule` | set working hours, mark breaks |
| Appointments | `/doctor/appointments` | list + filters |

**Seeded Users** (password: `password123`):
- `sarah@example.com`
- `michael@example.com`
- `emily@example.com`

---

## 🎨 6. Features & Limitations

### ✨ Features

- 20 min slots, Mon–Fri only
- "Any Available Doctor" search
- CAPTCHA + rate limiting
- JWT Auth (HTTP-only cookie)
- Mock Email/SMS notifications
- Real-time events (Socket.IO optional)

### ⚠️ Limitations

- Single timezone (UTC)
- No patient accounts
- Basic search + calendar UI
- Real email/SMS disabled by default

---

## 🏗️ 7. Architecture Notes

### Project Structure

```
project/
├── backend/   # NestJS + TypeORM + PostgreSQL
│   ├── modules/
│   │   ├── auth/            # bcrypt, JWT
│   │   ├── doctor/          # working rules & unavailability
│   │   ├── booking/         # scheduling & transactions
│   │   ├── notification/    # mock email/sms
│   │   └── realtime/        # socket.io (optional)
│   └── seed.ts
├── frontend/  # Next.js App Router
│   ├── app/   # SSR + CSR pages
│   └── components/
└── README.md
```

### Database Tables

- `doctor` (id, name, email unique, password_hash, specialty_id)
- `specialty` (id, name unique)
- `working_rule` (id, doctor_id, weekday, start_time, end_time)
- `unavailability` (id, doctor_id, start_at, end_at, reason)
- `appointment` (id uuid, doctor_id, start_at, end_at, patient_fields, created_ip inet, UNIQUE(doctor_id, start_at))

### Frontend Flow

- **Public SSR pages** → `/`, `/book`, `/confirm`
- **Doctor CSR pages** → `/doctor/login`, `/doctor/dashboard`, `/doctor/schedule`, `/doctor/appointments`
- Tailwind styling (custom components layer)

---

## ♿ 7. Accessibility & UI

- Labeled form inputs with `aria-*` attributes
- Keyboard navigation + visible focus rings
- High contrast color palette (emerald/red/slate)
- Responsive grid; mobile-friendly calendar
- Toast feedback for success/error states

---

## 📄 8. Environment Templates

### `backend/.env.example`

```ini
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
JWT_SECRET=dev_secret

DB_HOST=localhost
DB_PORT=5432
DB_NAME=doctorapp
DB_USER=doctorapp
DB_PASS=doctorapp

BCRYPT_ROUNDS=10
RECAPTCHA_SECRET=
GLOBAL_TTL=60
GLOBAL_LIMIT=100

```

### `frontend/.env.local.example`

```ini
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

---

## 📡 9. API Quick Reference

### Public Endpoints

```http
GET  /public/doctors?search=&specialty_id=
GET  /public/availability?doctor_id=&from=&days=
GET  /public/availability/any?from=&days=
POST /public/book
```

### Auth Endpoints

```http
POST /auth/register
POST /auth/login
POST /auth/logout
```

### Doctor Endpoints

```http
GET    /doctor/me
GET    /doctor/appointments/today
GET    /doctor/appointments?from=&to=
GET    /doctor/availability?from=&days=
POST   /doctor/working-rules
POST   /doctor/unavailability
DELETE /doctor/unavailability/:id
```

---

## 🔍 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| Tailwind "unknown utility" | Ensure custom classes under `@layer components` |
| reCAPTCHA localhost error | Use Google test key or add localhost domain |
| 429 on booking | Rate limit hit → wait or reduce frequency |
| "Function not implemented" in DTO | Remove placeholder stub functions |
| Postgres auth errors | Recreate role & DB with correct owner permissions |

---

## 🎉 Ready to Go!

✅ **System ready:** Run both servers, open `/book`, book a slot, watch console for `(MOCK EMAIL)` and `(MOCK SMS)` → confirmation success!
