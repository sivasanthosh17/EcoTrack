# EcoTrack

A web application for organizations and municipalities to track greenhouse gas emissions, carbon reduction projects, sustainability KPIs and climate action plans.

The demo data models the **Greater Chennai Corporation** and its departments.

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Total emissions, realized reduction, project count, KPI health and action plan progress, with trend, source, project and KPI charts and a recent-activity feed. Filter by month, quarter, year or all time. |
| **Emissions** | Record activity data (electricity, diesel, petrol, natural gas, transport, waste, water) by Scope 1, 2 or 3. CO₂e is calculated from the activity value and emission factor, and each default factor shows its source. |
| **Projects** | Carbon reduction projects with budget (₹), target and realized savings, progress and status. |
| **KPIs** | Targets by category with periodic measurements, history and automatic status (Achieved, On Track, At Risk, Off Track). |
| **Action Plans** | Climate action plans made of individual actions; plan progress is calculated from its actions. |
| **Reports** | Filtered environmental report that can be printed or exported to Excel (CSV). |
| **Organization** | Organization profile, departments, officer accounts, department assignment and account deactivation. |
| **Account** | Every user can change their own password. |

## Roles

| | Organization Admin | Department Officer |
|---|---|---|
| Data visible | Every department | Own department only |
| Emissions, projects, action plans | Create, edit, delete for any department | Create, edit, delete for own department |
| KPIs | Define, edit, delete; record measurements | Record measurements |
| Departments, organization profile, user accounts | Manage | View only |

Access rules are enforced by the API, not only by the interface.

## Tech stack

- **Frontend:** React 19, Vite, React Router, Chart.js
- **Backend:** Node.js, Express, Mongoose, JWT authentication, bcrypt
- **Database:** MongoDB (falls back to an in-memory MongoDB if no server is running)

## Getting started

Requirements: Node.js 20.19+ or 22.12+ (needed by Vite). MongoDB is optional for a quick look, because the server starts an in-memory database when it cannot reach one (data is lost when it stops).

**1. Backend**

```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `server/.env` and set `JWT_SECRET` to a long random string, then start the server:

```bash
npm run dev               # http://localhost:5000
```

**2. Frontend** (in a second terminal)

```bash
cd client
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```

**3. Sample data (optional)**

```bash
cd server
npm run seed:gcc          # Greater Chennai Corporation departments
npm run seed:gcc-demo     # illustrative emissions, projects, KPIs and action plans
```

The demo records are marked `[GCC DEMO]` and are illustrative, not official figures.

## Demo accounts

Created automatically when the server starts:

| Role | Email | Password |
|---|---|---|
| Organization Admin | admin@ecotrack.org | admin123 |
| Department Officer (Electrical) | officer@ecotrack.org | officer123 |

These accounts and the login page's demo autofill buttons are for demonstration only. Remove them before deploying to a public server.

## Emission factors

| Source | Default | Basis |
|---|---|---|
| Grid electricity | 0.727 kg CO₂/kWh | CEA CO₂ Baseline Database v20.0 (FY 2023-24). Check [cea.nic.in](https://cea.nic.in) for the latest version. |
| Diesel, petrol, natural gas | 2.68 kg/L, 2.31 kg/L, 1.90 kg/m³ | IPCC 2006 Guidelines default values |
| Transport, waste, water | — | Indicative estimates; replace with verified local factors |

Any factor can be overridden when recording an emission.

## Tests

```bash
cd server
npm test
```

## Project structure

```
client/          React frontend
  src/pages/     one file per screen
  src/context/   authentication state
server/          Express API
  controllers/   request handlers
  models/        Mongoose schemas
  routes/        API routes
  middleware/    authentication and role checks
  data/          Greater Chennai Corporation department data
```

## Author

Siva Santhosh V
