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

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Security | JWT authentication, bcryptjs password hashing, role checks |
| File Handling | Multer-based server-side evidence upload |

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

Default demo account:

```txt
Email: admin@gmail.com
Password: 123456
```
