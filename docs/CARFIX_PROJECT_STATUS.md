# CarFix — Project Status & Roadmap

> **Current Overall Regression Status**: **224 / 224 Automated Tests PASSED (100%)**

---

## 1. Completed Modules & Features

### Authentication & Authorization System
- Customer registration, login, JWT authorization.
- Email/token password reset and authenticated password change.
- Role-based protected route wrappers (`CUSTOMER`, `SERVICE_MANAGER`, `MECHANIC`, `ADMIN`).

### Customer Management & Portal
- **Profile Management**: Profile viewing, updating, persistence, and password/role mutation guards.
- **Vehicle CRUD**: Vehicle addition, editing, listing, deletion, fuel type validation, and ownership protection.
- **Service Booking Workflow**: Interactive selection, workshop compatibility validation, date/time slot conflict protection, and price tampering prevention.
- **Booking Cancellation**: Self-service booking cancellation with status guard validation.
- **Service History**: Historical archive of completed services with vehicle mileage, invoice linkage, and PDF download options.
- **Customer Dashboard**: Real-time metrics (Total Vehicles, Active Bookings, Completed Services, Pending Invoices) and recent activity feed.

### Catalog Systems & Reviews
- **Service Center Search & Reviews**: Listing, name/city/service filters, review creation, review editing, review deletion, and automated rating aggregation.
- **Services Catalog**: Search by name/description, category filtering, price/duration details, and active/inactive status handling.

### Service Manager Portal (Backend & Frontend)
- Workshop-scoped queue displaying bookings strictly belonging to the manager's assigned service center.
- Technician assignment with active status checks (`isActive !== false`) and automatic `PENDING` $\rightarrow$ `CONFIRMED` transition.
- Linear status transition lifecycle (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`).
- Automatic customer invoice generation on completion (`paymentStatus: 'PENDING'`).
- Completed booking lifecycle locking and PDF invoice download directly from queue.
- Service Manager dashboard with real-time operational metrics.

### Mechanic Portal (Backend & Frontend)
- Technician job queue displaying strictly jobs assigned to `req.user._id` (JWT).
- Strict ownership isolation blocking cross-mechanic job inspection and status updates with HTTP 403.
- Workflow action buttons (`"Start Service"`, `"Complete Service"`) following backend lifecycle (`CONFIRMED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`).
- Automatic customer invoice generation on service completion.
- Invoice PDF download directly from job details and job queue.
- Mechanic Dashboard displaying real-time assigned workload metrics, today's schedule, and recent completed jobs.
- Editable technician contact profile (`name`, `phone`) with role & security guards.

### Admin System (Backend Infrastructure & APIs)
- Full system statistics endpoints and user management APIs (filter, search, view, edit, activate/deactivate, delete with dependency checks).

---

## 2. In-Progress & Remaining Modules

* **All Core Role Portals Complete**: Customer, Service Manager, Mechanic, and Admin backend infrastructure are 100% complete and regression-tested.

---

## 3. Blockers

* **None**. All 224 automated regression tests across 13 test suites are passing with zero failures. Frontend production build compiles with zero errors.

---

## 4. Next Task

```text
==================================================
              PROJECT STATUS COMPLETE
==================================================
        READY FOR DEPLOYMENT / FINAL REVIEW
==================================================
```
