# CarFix – Car Repairing & Service Management System

CarFix is an end-to-end, full-stack automotive service booking, vehicle management, and service center management platform built with React, Node.js, Express, and MongoDB.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features by Role](#features-by-role)
  - [Customer Portal](#customer-portal)
  - [Service Manager Portal](#service-manager-portal)
  - [Admin Portal](#admin-portal)
  - [Mechanic Portal](#mechanic-portal)
- [Tech Stack](#tech-stack)
- [Architecture & Design](#architecture--design)
- [Repository Structure](#repository-structure)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Authentication & Role-Based Access Control](#authentication--role-based-access-control)
- [API Overview](#api-overview)
- [Automated Testing & Regression Suite](#automated-testing--regression-suite)
- [Test Credentials](#test-credentials)
- [Deployment Guidelines](#deployment-guidelines)
- [Future Development Roadmap](#future-development-roadmap)

---

## Project Overview

CarFix streamlines vehicle repair scheduling, service catalog browsing, mechanic dispatching, service progress tracking, and automated PDF invoice generation. The system provides role-tailored dashboards and secure endpoints for Customers, Service Managers, Mechanics, and Administrators.

---

## Features by Role

### Customer Portal
- **Authentication**: Registration, Login, JWT authorization, Password Reset via email/token, Password Change.
- **Vehicle Management**: Complete CRUD for customer vehicles (Make, Model, Year, Registration Number, Fuel Type, Color, Mileage) with customer ownership protection.
- **Service Booking**: Interactive service selection, workshop center compatibility checks, date/time slot conflict protection, and database price tampering prevention.
- **Booking Cancellation**: Cancel eligible pending/confirmed bookings.
- **Service History**: Historical archive of completed services with vehicle mileage, invoice linkage, and PDF downloads.
- **Invoices**: PDF invoice viewing & downloading with ownership protection.
- **Reviews & Ratings**: Post, update, and delete reviews for service centers with automated rating aggregation.
- **Service & Workshop Catalog**: Live search, category filtering, city filtering, and pricing details.
- **Customer Dashboard**: Real-time metrics (Total Vehicles, Active Bookings, Completed Services, Pending Invoices) and recent activity feed.

### Service Manager Portal
- **Dashboard**: Real-time metrics for pending bookings, active queue (Confirmed + In Progress), completed services, and invoice stats.
- **Bookings Queue**: Workshop-scoped queue displaying appointments strictly belonging to the manager's assigned service center.
- **Mechanic Assignment**: Dispatch active technicians (`isActive !== false`) to bookings. Assigning a mechanic to a `PENDING` booking automatically confirms the appointment (`PENDING` $\rightarrow$ `CONFIRMED`).
- **Status Lifecycle Progression**: Strict transition controls (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`). Prevents invalid status skipping and locks completed/cancelled bookings.
- **Auto Invoice Generation**: Transitioning a booking to `COMPLETED` automatically creates a customer invoice using database service prices with `paymentStatus: 'PENDING'`.
- **Invoice PDF Download**: Instant invoice PDF download directly from the queue with loading states.

### Admin Portal
- **Dashboard**: System-wide statistics across users, vehicles, service centers, bookings, invoices, and reviews.
- **User Management**: Filter, search, inspect, activate/deactivate, and edit user profiles across all roles (`CUSTOMER`, `SERVICE_MANAGER`, `MECHANIC`, `ADMIN`) with self-protection rules.
- **Service & Center Management**: Full catalog and workshop center visibility.

### Mechanic Portal
- *Under Active Development* (Documented status: Job assignment listing and job status tracking endpoints prepared).

---

## Tech Stack

- **Frontend**: React 18, Vite 6, React Router DOM 6, Lucide React Icons, Vanilla CSS (Design Tokens & Responsive Layouts).
- **Backend**: Node.js, Express.js, MongoDB Atlas / Mongoose ODM, JSON Web Tokens (JWT), BcryptJS, PDFKit (PDF generation).
- **Tooling**: Dotenvx, Nodemon, Native ES Modules (`type: "module"`).

---

## Architecture & Design

```text
┌─────────────────────────┐       HTTP / REST (JSON)       ┌─────────────────────────┐
│     React 18 / Vite     │  ◄──────────────────────────►  │     Express.js API      │
│   (Frontend Port 5173)  │  Authorization: Bearer <token> │   (Backend Port 5000)   │
└─────────────────────────┘                                └────────────┬────────────┘
                                                                        │
                                                                 Mongoose ODM
                                                                        │
                                                                        ▼
                                                           ┌─────────────────────────┐
                                                           │      MongoDB Atlas      │
                                                           └─────────────────────────┘
```

---

## Repository Structure

```text
CarFix/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection & DNS resolution
│   │   ├── controllers/    # Route handler logic & business rules
│   │   ├── middleware/     # JWT protect & role authorize guards
│   │   ├── models/         # Mongoose schemas (User, Booking, Invoice, etc.)
│   │   ├── routes/         # Express REST API routes
│   │   ├── services/       # Email & PDF generation services
│   │   └── utils/          # Helper utilities
│   ├── test_*.js           # Automated regression test suites (12 suites)
│   ├── setup_test_*.js     # Database seeding & test setup scripts
│   ├── .env.example        # Backend environment template
│   ├── package.json
│   └── server.js           # Server entry point
├── frontend/
│   ├── src/
│   │   ├── api/            # Centralized API client wrappers
│   │   ├── components/     # UI components & ProtectedRoute layout guards
│   │   ├── layouts/        # Main, Customer, Admin, Manager, Mechanic layouts
│   │   ├── pages/          # Public and role-based portal pages
│   │   └── utils/          # Currency & date formatters
│   ├── .env.example        # Frontend environment template
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── TEST_CREDENTIALS.md # Local development test credentials
└── README.md
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- MongoDB Atlas database instance or local MongoDB instance

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file from template
cp .env.example .env

# 4. Configure .env variables (MONGODB_URI, JWT_SECRET, PORT)

# 5. Seed test accounts & initial database records
node setup_test_service_manager.js

# 6. Start development server
npm run dev
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Install dependencies
npm install

# 3. Create .env file from template
cp .env.example .env

# 4. Start Vite development server
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend origin URL for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | `carfix_jwt_super_secret_key_2026_dev` |
| `JWT_EXPIRES_IN` | JWT token validity duration | `7d` |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL | `http://localhost:5000/api` |

---

## Authentication & Role-Based Access Control

CarFix uses HTTP Bearer JWT Authentication (`Authorization: Bearer <token>`).

Supported User Roles (`User.role`):
1. **`CUSTOMER`**: Access to vehicle management, booking creation, service history, and personal invoices.
2. **`SERVICE_MANAGER`**: Access to workshop-scoped booking queue, technician dispatching, status lifecycle updates, and auto invoices.
3. **`MECHANIC`**: Access to assigned repair jobs and status updates.
4. **`ADMIN`**: Full administrative access across all system collections and user accounts.

---

## Automated Testing & Regression Suite

CarFix maintains a 100% passing automated regression suite across 13 dedicated test suites:

```text
==================================================
   CARFIX REGRESSION TEST SUITE RESULTS
==================================================

 1. test_password_reset.js              ==>  17 / 17  PASSED
 2. test_change_password.js             ==>   5 /  5  PASSED
 3. test_profile_update.js              ==>  12 / 12  PASSED
 4. test_invoice_download.js            ==>  11 / 11  PASSED
 5. test_service_booking.js             ==>  15 / 15  PASSED
 6. test_vehicle_management.js          ==>  20 / 20  PASSED
 7. test_booking_cancellation.js       ==>  16 / 16  PASSED
 8. test_service_history.js             ==>  19 / 19  PASSED
 9. test_customer_dashboard.js          ==>  20 / 20  PASSED
10. test_service_centers_and_reviews.js ==>  27 / 27  PASSED
11. test_services_catalog.js            ==>  28 / 28  PASSED
12. test_service_manager_portal.js      ==>  19 / 19  PASSED
13. test_mechanic_portal.js             ==>  15 / 15  PASSED
--------------------------------------------------
TOTAL REGRESSION TESTS                  : 224 / 224 PASSED (100%)
```

To run any test suite:

```bash
cd backend
node test_service_manager_portal.js
```

---

## Test Credentials

Refer to [`docs/TEST_CREDENTIALS.md`](docs/TEST_CREDENTIALS.md) for local test accounts:

- **Service Manager**: `servicemanager.test@carfix.com` / `Manager123!`
- **Customer**: `customer.test@carfix.com` / `Customer123!`
- **Mechanic**: `mechanic.test@carfix.com` / `Mechanic123!`

---

## Deployment Guidelines

1. **Frontend Deployment** (Vercel / Netlify):
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Configure environment variable: `VITE_API_URL=https://api.yourdomain.com/api`
2. **Backend Deployment** (Render / Railway / AWS):
   - Set start command: `node server.js`
   - Configure environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`)
   - Ensure MongoDB Atlas IP Whitelist includes deployment server IPs or `0.0.0.0/0`.

---

## Future Development Roadmap

1. **Mechanic Portal Frontend & Backend Integration**:
   - Mechanic job queue, diagnosis notes logging, parts usage tracking, and completion sign-off.
2. **Real-time Notifications**:
   - Socket.io or Web Push notifications for booking status changes.
