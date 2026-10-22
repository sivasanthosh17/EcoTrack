# EcoTrack

**Greenhouse gas and sustainability tracking for organizations and municipalities.**

EcoTrack brings emissions accounting, carbon reduction projects, sustainability KPIs and climate action plans into one web application, with separate access for an organization's administrator and each department's officers. The demo data models the **Greater Chennai Corporation** and its departments.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chartdotjs&logoColor=white)

![Admin dashboard](docs/screenshots/dashboard-admin.png)

## Contents

- [Problem statement](#problem-statement)
- [Features](#features)
- [Screenshots](#screenshots)
- [Roles and permissions](#roles-and-permissions)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Deploying to Vercel](#deploying-to-vercel)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Problem statement

> Organizations and municipalities require tracking of greenhouse gas emissions, carbon reduction projects, sustainability KPIs, and climate action plans.

| Requirement | Where EcoTrack covers it |
|---|---|
| Organizations and municipalities | Organization profile (type: Municipality, Government Agency, Corporate Enterprise and more), departments and role-based users |
| Greenhouse gas emissions | **Emissions** module: Scope 1, 2 and 3 activity data converted to tCO₂e |
| Carbon reduction projects | **Projects** module: budget, target and realized savings, progress |
| Sustainability KPIs | **KPIs** module: targets, periodic measurements, automatic status |
| Climate action plans | **Action Plans** module: plans built from individual actions |

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Total emissions, realized reduction, projects, KPI health and action plan progress, with charts for emission trend, emissions by source, project delivery and KPI health, plus a recent-activity feed. Filter by month, quarter, year or all time. |
| **Emissions** | Record electricity, diesel, petrol, natural gas, transport, waste and water activity by scope. CO₂e is calculated automatically and the source of each default emission factor is shown. |
| **Projects** | Carbon reduction projects with budget (₹), target and realized savings, progress and status. |
| **KPIs** | Targets by category with periodic measurements, history and automatic status: Achieved, On Track, At Risk or Off Track. |
| **Action Plans** | Climate action plans made of actions assigned to departments; plan progress is calculated from its actions. |
| **Reports** | Filter by date, department and source, then print or export to Excel (CSV). |
| **Organization** | Organization profile, departments, officer accounts, department assignment, and account deactivation. |
| **Account** | Every user can change their own password. Expired or deactivated sessions return to the login page with an explanation. |

## Screenshots

| | |
|---|---|
| **Sign in**<br>![Sign in](docs/screenshots/login.png) | **Officer dashboard** (own department only)<br>![Officer dashboard](docs/screenshots/dashboard-officer.png) |
| **Emissions by scope**<br>![Emissions](docs/screenshots/emissions.png) | **Recording an emission** (factor source shown)<br>![Emission form](docs/screenshots/emission-form.png) |
| **KPIs with automatic status**<br>![KPIs](docs/screenshots/kpis.png) | **Printable report with CSV export**<br>![Reports](docs/screenshots/reports.png) |
| **User account management**<br>![User accounts](docs/screenshots/user-accounts.png) | |

## Roles and permissions

| | Organization Admin | Department Officer |
|---|---|---|
| Data visible | Every department | Own department only |
| Emissions, projects, action plans | Create, edit and delete for any department | Create, edit and delete for own department |
| KPIs | Define, edit and delete; record measurements | Record measurements |
| Reports and CSV export | Whole organization or any department | Own department |
| Departments, organization profile | Manage | View only |
| User accounts | Create officers, assign departments, deactivate and reactivate | — |
| Own password | Change | Change |

Permissions are enforced by the API, not only hidden in the interface: an officer requesting another department's records receives `403 Access denied`.

## How it works

### Architecture

```mermaid
flowchart LR
    U[Browser<br>React + Vite<br>localhost:5173] -- "REST API + JWT" --> A[Express API<br>localhost:5000]
    A --> M[(MongoDB)]
    A -. "if MongoDB is not reachable" .-> I[(In-memory MongoDB)]
```

- Users sign in with email and password; the API returns a JSON Web Token valid for 30 days.
- Every API request carries the token. Middleware checks it, rejects deactivated accounts, and applies role and department rules.
- Passwords are stored as bcrypt hashes.

### Emission calculation

```
CO₂e (tonnes) = activity value × emission factor (tCO₂e per unit)
```

Example: 125,000 kWh of grid electricity × 0.000727 tCO₂e/kWh = **90.88 tCO₂e**.

| Source | Default factor | Basis |
|---|---|---|
| Grid electricity | 0.727 kg CO₂/kWh | CEA CO₂ Baseline Database v20.0 (FY 2023-24). Check [cea.nic.in](https://cea.nic.in) for the latest version. |
| Diesel | 2.68 kg CO₂/litre | IPCC 2006 Guidelines default |
| Petrol | 2.31 kg CO₂/litre | IPCC 2006 Guidelines default |
| Natural gas | 1.90 kg CO₂/m³ | IPCC 2006 Guidelines default |
| Transport, waste, water | 0.17 /km, 0.50 /kg, 0.30 /m³ (kg CO₂e) | Indicative estimates; replace with verified local factors |

Any factor can be overridden when recording an emission. The form shows the source of the default and flags custom values.

### KPI status rules

| KPI type | Achieved | On Track | At Risk | Off Track |
|---|---|---|---|---|
| Lower is better (e.g. energy use, emissions, waste to landfill) | At or below target | — | Up to 10% above target | More than 10% above target |
| Higher is better (e.g. renewable energy share, waste segregation rate) | At or above target | At least 85% of target | At least 70% of target | Below 70% of target |

Each KPI chooses its own goal direction when it is defined. The default is "higher is better" for Renewable Energy and "lower is better" for every other category.

### Realized reduction

Realized carbon reduction on the dashboard and in reports is the sum of realized savings from **projects**. Action-plan actions track the same work at plan level, so they are reported as plan progress rather than added again.

## Getting started

### Requirements

- Node.js 20.19+ or 22.12+ (required by Vite)
- MongoDB (optional). Without it, the server starts an in-memory database, which is empty again after every restart.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Open `server/.env` and set `JWT_SECRET` to a long random string. The server refuses to start without it.

```bash
npm run dev                 # API on http://localhost:5000
```

### 2. Frontend (second terminal)

```bash
cd client
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # App on http://localhost:5173
```

### 3. Sample data (optional)

```bash
cd server
npm run seed:gcc            # Greater Chennai Corporation departments
npm run seed:gcc-demo       # demo emissions, projects, KPIs and an action plan
```

Demo records are prefixed `[GCC DEMO]`. They are illustrative and are not official Greater Chennai Corporation figures.

### Demo accounts

Created automatically when the server starts. The login page also has buttons that fill them in.

| Role | Email | Password |
|---|---|---|
| Organization Admin | admin@ecotrack.org | admin123 |
| Department Officer (Electrical) | officer@ecotrack.org | officer123 |

These accounts and the autofill buttons are for demonstration. They also work on a deployed copy, so anyone with the link can sign in as the admin.

### Tests

```bash
cd server
npm test
```

## Deploying to Vercel

The repository deploys as a single Vercel project. The React build is served as static files, and the Express API runs as a serverless function under `/api`, so the site and its API share one address. `vercel.json` and `api/index.js` hold this setup.

Vercel cannot run a database, so the deployed site uses MongoDB Atlas.

1. **Create the database.** Create a free MongoDB Atlas cluster in AWS N. Virginia (us-east-1), the region closest to Vercel's default. Add a database user, and under Network Access allow `0.0.0.0/0`, because Vercel has no fixed IP address.
2. **Get the connection string.** In Atlas, choose Connect, then Drivers. Put your password in, and add the database name `ecotrack_db` after `.net/`:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/ecotrack_db?retryWrites=true&w=majority
   ```

3. **Copy your local data to Atlas.** With local MongoDB running:

   ```bash
   cd server
   node copy-to-atlas.js "<connection string>"
   ```

   This copies every account, department and record, so the deployed site matches localhost. Run it again any time to reset the online data.

4. **Create the Vercel project.** Import the GitHub repository and keep the root directory as the repository root. Add two environment variables, then deploy:

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | the connection string from step 2 |
   | `JWT_SECRET` | a long random string |

Pushing to `main` redeploys the site automatically.

## API reference

All routes are under `/api`. Except for login and the health check, every route requires an `Authorization: Bearer <token>` header. Officers are limited to their own department on every data route.

| Area | Method and path | Access |
|---|---|---|
| Health | `GET /health` | Public |
| Auth | `POST /auth/login` | Public |
| | `GET /auth/me` | Signed in |
| | `PUT /auth/change-password` | Signed in |
| | `POST /auth/officers` | Admin |
| Organization | `GET /organization` | Signed in |
| | `PUT /organization` | Admin |
| Departments | `GET /departments` | Signed in |
| | `POST /departments`, `PUT /departments/:id`, `DELETE /departments/:id` | Admin |
| | `GET /departments/users` | Admin |
| | `PUT /departments/assign-user` | Admin |
| | `PUT /departments/users/:id/status` | Admin |
| Emissions | `GET /emissions`, `GET /emissions/factors` | Signed in |
| | `POST /emissions`, `PUT /emissions/:id`, `DELETE /emissions/:id` | Signed in |
| Projects | `GET /projects`, `GET /projects/:id` | Signed in |
| | `POST /projects`, `PUT /projects/:id`, `PUT /projects/:id/progress`, `DELETE /projects/:id` | Signed in |
| KPIs | `GET /kpis`, `GET /kpis/:id` | Signed in |
| | `POST /kpis`, `PUT /kpis/:id`, `DELETE /kpis/:id` | Admin |
| | `GET /kpis/:id/measurements`, `POST /kpis/:id/measurements` | Signed in |
| Action plans | `GET /action-plans`, `GET /action-plans/:id` | Signed in |
| | `POST /action-plans`, `PUT /action-plans/:id`, `DELETE /action-plans/:id` | Signed in |
| | `POST /action-plans/:id/actions`, `PUT /action-plans/actions/:actionId`, `DELETE /action-plans/actions/:actionId` | Signed in |
| Dashboard | `GET /dashboard/stats?period=all\|month\|quarter\|year` | Signed in |

## Project structure

```
api/index.js              Vercel entry point for the Express API
vercel.json               Vercel build and routing settings
client/                   React frontend
  src/pages/              one file per screen
  src/components/         sidebar and route protection
  src/context/            sign-in state and session handling
server/                   Express API
  controllers/            request handlers
  models/                 Mongoose schemas
  routes/                 API routes
  middleware/             token, role and department checks
  data/                   Greater Chennai Corporation department data
  tests/                  authorization and KPI status tests
  copy-to-atlas.js        copies local data to MongoDB Atlas for deployment
docs/screenshots/         images used in this README
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Server stops with `JWT_SECRET is not set` | Add `JWT_SECRET` to `server/.env`. |
| API replies `Database is initializing or offline` | Start MongoDB, or wait a few seconds for the in-memory database to start. |
| Data disappears after restarting the server | The in-memory database is in use. Install and run MongoDB, or set `MONGODB_URI` to a MongoDB Atlas connection string. |
| Login page says your session has expired | Your token expired or `JWT_SECRET` changed. Sign in again. |
| Frontend cannot reach the API | Check that the backend is running and that `VITE_API_BASE_URL` in `client/.env` matches its address. |
| Deployed site says `Database is initializing or offline` | Check `MONGODB_URI` in the Vercel project settings, and that Atlas Network Access allows `0.0.0.0/0`. Redeploy after changing a variable. |
| Deployed site has no data | Run `copy-to-atlas.js` with the same connection string that Vercel uses. |

## Author

Siva Santhosh
