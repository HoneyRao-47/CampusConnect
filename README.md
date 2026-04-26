# CampusConnect - Automated Campus Ambassador Management Platform

CampusConnect is a full-stack platform to run Campus Ambassador (CA) programs with one centralized workflow.
It replaces spreadsheets, chat groups, and manual forms with structured tasks, proof submission, auto-scoring, and real-time performance tracking.

---

## Table of Contents

1. [Problem and Solution](#problem-and-solution)
2. [How the System Works (End-to-End)](#how-the-system-works-end-to-end)
3. [Project Structure](#project-structure)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Design](#database-design)
7. [API Contracts (Input -> Output)](#api-contracts-input---output)
8. [Points, Streak, and Badge Logic](#points-streak-and-badge-logic)
9. [How to Run the Project](#how-to-run-the-project)
10. [How to Operate the Product](#how-to-operate-the-product)
11. [Demo/Presentation Script](#demopresentation-script)
12. [Current Scope vs Future Scope](#current-scope-vs-future-scope)

---

## Problem and Solution

### Problem
Organizations struggle to scale CA programs because operations are fragmented:

- Activity tracking is manual
- Task assignment is unclear
- Recognition is inconsistent
- ROI is hard to measure

### Solution
CampusConnect provides one source of truth where:

- Managers assign and monitor challenges
- Ambassadors submit proof for completed work
- Backend auto-scores submissions into points
- Leaderboard and dashboards identify top performers
- Gamification (badges, streaks, rewards) improves retention

---

## How the System Works (End-to-End)

1. Manager creates or enables challenges (already seeded in this version).
2. Ambassador selects challenge and submits:
   - notes
   - proof link
   - optional file
3. Backend validates payload, verifies task and ambassador, then computes points.
4. Submission is stored in database.
5. Ambassador totals are updated:
   - points
   - streak
   - category counters (referrals/content/events)
6. Frontend fetches latest data and updates dashboard + leaderboard instantly.

---

## Project Structure

```text
CampusConnect/
  prisma/
    schema.prisma             # Database schema (Ambassador, Task, Submission)
  server/
    index.js                  # Express app, routes, business logic
    db.js                     # Prisma client + seed bootstrap
  src/
    App.jsx                   # Main React dashboard and interaction logic
    App.css                   # Dashboard styles and responsive UI
    index.css                 # Global styles and typography
    api.js                    # Frontend API client wrapper
    main.jsx                  # React app bootstrap
  public/                     # Static assets
  package.json                # Scripts and dependencies
```

---

## Frontend Architecture

### Stack

- React (component-based UI)
- Vite (fast dev/build tooling)
- Framer Motion (animations/transitions)
- Recharts (analytics visualization)
- Lucide React (icons)

### Frontend Responsibilities

- Render dashboard modules:
  - Sidebar navigation
  - Topbar (notifications, streak, profile)
  - Metrics cards
  - Analytics chart + timeline
  - Leaderboard podium + badges
  - Rewards vault
  - GitHub analysis panel
  - Task submission form
- Capture user input
- Call backend APIs through `src/api.js`
- Display backend results and errors

### Key Frontend Inputs

- Task submission form:
  - `taskId`
  - `ambassadorId`
  - `notes`
  - optional `proofUrl`
  - optional `proofFile`
- GitHub analysis input (UI scoring demo module)

### Key Frontend Outputs (UI)

- Live metrics and charts
- Success/error alerts after submission
- Updated leaderboard and progress indicators
- Points-by-work breakdown from task data

---

## Backend Architecture

### Stack

- Node.js + Express
- Prisma ORM
- Zod validation
- Multer (file upload parsing)
- CORS + JSON middleware

### Backend Responsibilities

- Expose APIs for:
  - overview
  - tasks
  - ambassadors
  - leaderboard
  - proof submission
- Validate incoming payloads
- Execute scoring and update logic
- Persist transactional updates in database

### Core Business Flow (`POST /api/tasks/:taskId/submit`)

1. Find task by `taskId`
2. Validate request body using Zod:
   - `ambassadorId` required
   - `notes` required
   - `proofUrl` optional but must be valid URL if provided
3. Find ambassador by `ambassadorId`
4. Compute awarded points:
   - `task.points`
   - plus `40` if file is uploaded
5. Create `Submission` record
6. Update `Ambassador` totals:
   - increment `points`
   - increment `streak`
   - increment type-based activity counters
7. Return submission payload with awarded points

---

## Database Design

Database: **SQLite**  
ORM: **Prisma**

### `Ambassador`

- `id` (PK)
- `name`
- `college`
- `referrals`
- `contentPosts`
- `events`
- `points`
- `streak`
- relation: one ambassador -> many submissions

### `Task`

- `id` (PK)
- `title`
- `type` (`referrals` / `content` / `event`)
- `description`
- `points`
- `status`
- `dueDate`
- relation: one task -> many submissions

### `Submission`

- `id` (PK)
- `taskId` (FK)
- `ambassadorId` (FK)
- `notes`
- `proofUrl` (optional)
- `hasFileProof` (boolean)
- `awardedPoints`
- `submittedAt`

### Why this schema works

- Separates static challenge definitions from dynamic activity logs
- Preserves full historical audit trail of contributions
- Makes leaderboard and analytics reproducible and query-friendly

---

## API Contracts (Input -> Output)

### `GET /health`

- Input: none
- Output: service status

### `POST /api/auth/login`

- Input:
  - `email`
  - `role` (`manager` or `ambassador`)
- Output:
  - demo token
  - user object

### `GET /api/overview`

- Input: none
- Output:
  - aggregate stats
  - top performer
  - recent submissions

### `GET /api/ambassadors`

- Input: none
- Output:
  - ambassador list
  - computed badges

### `GET /api/tasks`

- Input: none
- Output:
  - challenge list with points and due dates

### `GET /api/leaderboard`

- Input: none
- Output:
  - ambassadors sorted by points with rank

### `POST /api/tasks/:taskId/submit`

- Input:
  - URL param: `taskId`
  - body/form-data:
    - `ambassadorId`
    - `notes`
    - optional `proofUrl`
    - optional `proofFile`
- Output:
  - success message
  - created submission payload
  - awarded points

---

## Points, Streak, and Badge Logic

### Points

- Base points come from selected task (`task.points`)
- Bonus points: `+40` when file proof is uploaded

### Streak

- Every successful submission increments ambassador streak by `1`

### Activity Counters

- If task type is `referrals`, increment referrals
- If task type is `content`, increment content posts
- If task type is `event`, increment events

### Badges (computed)

- `Growth Driver`: points >= 1000
- `Impact Pro`: points >= 1500
- `Week Warrior`: streak >= 7
- fallback: `Rising Star`

---

## How to Run the Project

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Setup database

```bash
npm run db:migrate
npm run db:generate
```

### Run app (frontend + backend)

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

### Useful commands

```bash
npm run lint
npm run build
npm run start
npm run db:studio
```

---

## How to Operate the Product

### Manager/Reviewer flow

1. Open dashboard and review metrics + leaderboard.
2. Monitor activity timeline and points distribution.
3. Track top performers through podium/rank modules.
4. Use exported leaderboard for reporting (CSV from UI).

### Ambassador submission flow

1. Open **Task Submission** section.
2. Select challenge and ambassador.
3. Add notes.
4. Add proof link (optional).
5. Upload file proof (optional but gives bonus points).
6. Click **Submit Task**.
7. Confirm success alert and updated points.

### What updates immediately after submission

- Success message with awarded points
- Ambassador points and streak totals
- Leaderboard and rank positioning
- Overview stats

---

## Demo/Presentation Script

1. Introduce problem in CA programs (manual, scattered, low retention).
2. Show architecture quickly: React UI + Express APIs + Prisma/SQLite.
3. Show dashboard metrics and leaderboard.
4. Submit a proof using the form (notes/link/file).
5. Explain scoring logic and show updated points/rank.
6. Show rewards/gamification and engagement features.
7. Conclude with measurable outcomes: top performer visibility and ROI tracking.

---

## Current Scope vs Future Scope

### Current scope

- End-to-end challenge submission and scoring flow
- Real-time dashboard rendering with API data
- Gamification-ready leaderboard and recognition modules
- Detailed modern UI for presentation-quality UX

### Future scope

- JWT auth and organization workspaces
- Real GitHub API-based scoring (instead of demo heuristics)
- Role-level permissions and admin workflows
- Reward payouts and partner integrations
- AI recommendation engine for ambassador growth coaching
