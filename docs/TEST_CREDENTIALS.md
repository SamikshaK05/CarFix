# CarFix - Local Test Account Credentials

> [!IMPORTANT]  
> **LOCAL DEVELOPMENT / TESTING ONLY**  
> These credentials are provided solely for local testing and demonstration. Never use these credentials or simple passwords in production environments.

---

## Service Manager Test Account

| Role | Email | Password | Assigned Service Center | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`SERVICE_MANAGER`** | `servicemanager.test@carfix.com` | `Manager123!` | CarFix Pune – Baner Hub | Service Manager booking dispatch, mechanic assignment, status progression, and invoice management testing. |

---

## Customer Test Account

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **`CUSTOMER`** | `customer.test@carfix.com` | `Customer123!` | Customer service booking, vehicle CRUD, booking cancellation, invoice downloading, and profile updates. |

---

## Mechanic Test Account

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **`MECHANIC`** | `mechanic.test@carfix.com` | `Mechanic123!` | Assigned job tracking and service status updates. |

---

## Test Seeding Script

To reset or seed test accounts and sample booking data in your local environment, run:

```bash
cd backend
node setup_test_service_manager.js
```
