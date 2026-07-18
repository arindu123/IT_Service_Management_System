# IT Helpdesk & Hardware Procurement Module

Government IT Management System extension for hardware issue reporting, upgrade requests, approval routing, procurement tracking, inventory visibility, installation scheduling and request closure.

## Document Control

| Field | Description |
| --- | --- |
| Project Name | IT Helpdesk & Hardware Procurement Module |
| Module Objective | Digitize employee hardware faults and upgrade requests with role-based processing and traceable status updates. |
| Primary Users | Employees, Head of IT, IT Technicians, Store Keepers, Procurement/Finance Officers, Administrators |
| Status | Working application prototype aligned to the professional SRS workflow |

## Core Workflow

1. Employee signs in and submits a hardware fault, replacement, upgrade or procurement request.
2. System auto-captures requester profile data from the logged-in account.
3. Employee records issue details, business impact, priority, asset information and optional evidence files.
4. Head of IT acknowledges, rejects, requests more information or sends the request for review.
5. IT team checks inventory, assigns technicians, records diagnosis and updates expected fulfillment dates.
6. Procurement or store staff update item availability, purchase status and delivery progress.
7. Technician schedules and records installation.
8. Request is closed after completion or cancelled/rejected with a recorded reason.

## Implemented Features

- JWT authentication and role-based API protection
- Official user profile fields: Employee ID, designation, department, phone and office location
- Hardware request form with request type, category, priority, business impact and requested specification
- Auto-captured requester snapshot on every request
- SRS-style lifecycle statuses from Submitted to Closed
- Status history timeline data stored with actor and timestamp
- Evidence upload support for JPG, PNG, PDF, MP4, MOV and WebM files
- Per-file upload limit of 20 MB and per-request evidence limit of 50 MB
- Procurement, item availability, expected fulfillment and installation scheduling fields
- Role-aware request visibility for employees, technicians, store, procurement and IT leadership
- Dashboard counts for request lifecycle, assets and low-stock inventory
- Network Monitoring module for LAN device availability, backend-only checks, incidents and uptime history

## User Roles

| Role | Main Access |
| --- | --- |
| Department User | Submit and view own hardware requests |
| Head of IT | Review, acknowledge, reject, assign and update requests |
| Technician | View assigned/technical requests and update fulfillment progress |
| Store Keeper | Update stock availability and item readiness |
| Procurement Officer | Update purchase and delivery progress |
| Management | View operational dashboards and reports |
| Admin/System Admin | Configure and administer system data |
| Technician | Manage Network Monitoring devices and manual checks |

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Security | JWT authentication, bcryptjs password hashing, role checks |
| File Handling | Multer-based server-side evidence upload |

## Network Monitoring Module

The Network Monitoring module adds authenticated LAN device availability checks from the backend server. Browsers never run ping or shell commands. Devices can be registered with office location data, checked manually, paused/resumed, and monitored automatically by the backend scheduler.

### Capabilities

- Device inventory for PCs, servers, printers, routers, switches, access points, CCTV/NVR, biometric devices and other IP equipment
- ICMP ping, TCP port, HTTP and HTTPS reachability checks using safe backend APIs
- Online, warning, offline, paused and unknown states with three-failure default offline logic
- Automatic open incident creation when a device reaches the failure threshold
- Automatic incident resolution when a device recovers
- Check history with uptime calculation and MongoDB TTL retention
- Bounded polling UI with dashboard cards, filters, device details and open incident list
- Development-only simulation mode for home/VM testing

### Network Monitoring Environment

Copy `backend/.env.example` values into your real `backend/.env` as needed. Do not commit real secrets.

```txt
NETWORK_MONITORING_ENABLED=true
NETWORK_MONITOR_DEFAULT_INTERVAL_SECONDS=60
NETWORK_MONITOR_TIMEOUT_MS=3000
NETWORK_MONITOR_FAILURE_THRESHOLD=3
NETWORK_MONITOR_MAX_CONCURRENCY=10
NETWORK_MONITOR_HISTORY_RETENTION_DAYS=30
NETWORK_MONITOR_ALLOWED_CIDRS=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12
NETWORK_MONITOR_SIMULATION_MODE=false
```

`NETWORK_MONITOR_ALLOWED_CIDRS` should contain only internal office ranges. Leave MongoDB and backend development ports private behind the approved Nginx reverse proxy.

### Home Testing

1. Run MongoDB, the backend and the frontend on your development PC.
2. Connect another laptop, phone, VM or test device to the same Wi-Fi/LAN.
3. Find the device's private LAN IP address, such as `192.168.x.x`.
4. Sign in as admin, system admin, Head of IT or technician and open Network Monitoring.
5. Register the device with a test department/building/floor/room.
6. Disconnect the test device and wait for warning, then offline after the configured threshold.
7. Reconnect it and confirm the incident resolves automatically after a successful check.

For development without real devices, set `NETWORK_MONITOR_SIMULATION_MODE=true` outside production. Add one of these scenario words to the device hostname or description: `always-online`, `always-offline`, `slow-response`, `intermittent`, `flapping`, `timeout`, or `recovery-after-three-failures`.

### Deployment Notes

- Back up MongoDB before deploying new models and indexes.
- Set production monitoring environment variables in the backend service manager.
- Confirm the backend service account can run ICMP ping or use TCP/HTTP checks for devices that block ICMP.
- Restart the backend service and verify only one scheduler is running.
- Keep the existing Nginx `/api/` proxy to the backend. No extra Nginx location is required because the first release uses bounded polling, not WebSockets.
- Monitor logs and MongoDB growth; raw check history is retained by TTL according to `NETWORK_MONITOR_HISTORY_RETENTION_DAYS`.

## Project Structure

```txt
IT_Service_Management_System
|-- backend
|   |-- config
|   |-- controllers
|   |-- middleware
|   |-- models
|   |-- routes
|   |-- uploads
|   `-- server.js
|-- frontend
|   |-- src
|   |   |-- components
|   |   |-- pages
|   |   |-- services
|   |   |-- App.jsx
|   |   `-- main.jsx
|   `-- index.html
`-- README.md
```

## Local Setup

```bash
cd backend
npm install
npm run seed-admin
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The default setup is one backend on `http://localhost:5000` and one frontend on `http://localhost:5173`.

Useful verification commands:

```bash
cd backend
npm test
```

```bash
cd frontend
npm run lint
npm run build
```

Default demo account:

```txt
Email: admin@gmail.com
Password: 123456
```

## Gmail password reset

Copy the SMTP placeholders from `backend/.env.example` into `backend/.env`. Enable Google 2-Step Verification and create a Google App Password; use that 16-character value for `SMTP_PASS`. Never use or commit the normal Gmail password.

For phone testing on the same Wi-Fi, replace localhost in `FRONTEND_URL` and `VITE_API_BASE_URL` with the laptop's Wi-Fi IPv4 address, run Vite with `--host 0.0.0.0`, and allow the frontend/backend ports through the firewall. The backend must be reachable on `0.0.0.0`.
