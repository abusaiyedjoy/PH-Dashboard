# Project Review Hub (Associate Web Instructor Hiring Assessment)

A production-minded, full-stack web application designed for developer education platforms. Enables students to submit web development project repositories for review and provides instructors with a paginated, filterable evaluation dashboard with actionable review workflows.

---

## 1. Assessment Requirements Implemented

| Category | Assessment Requirement | Implementation Details |
| :--- | :--- | :--- |
| **Student Portal** | Project submission form | Project Name, GitHub/GitLab Repository URL, Live Demo URL, and Description (with live character counter). |
| | Robust validation | Zod schemas on Express backend + React Hook Form / client-side validation. |
| | Duplicate prevention | Documented URL normalization + service-layer check + Prisma composite unique constraint `@@unique([studentId, repoUrl])`. |
| | Rate limiting | `express-rate-limit` enforces 5 project submissions per minute per student. |
| | Persistence | Full PostgreSQL relational database via Prisma ORM with proper foreign keys and cascade rules. |
| | Student Submissions | Authenticated student portal listing own projects, review status badges, and instructor comments modal. |
| **Mentor Dashboard** | Paginated project table | Server-side pagination with `skip` and `take`, deterministic sort (`createdAt DESC, id ASC`). |
| | Review Actions | Approve and Reject review actions with optional constructive feedback comments and confirmation dialogs. |
| | Server-side filtering | Real-time database query filtering for `APPROVED`, `REJECTED`, and `PENDING` projects (plus server-side search). |
| | Aggregated statistics | Database-level count queries for Total, Pending, Approved, and Rejected projects across full dataset. |
| | Data attributes | Student profile details, repository link, live demo link, timestamps, review history, and reviewer attribution. |
| **Authentication & RBAC** | Student Signup | Public signup assigns strictly the `STUDENT` role (never allows elevated roles). |
| | Login & JWT | Secure password hashing (`bcryptjs` 10 rounds), JWT authentication via HttpOnly cookies and `Bearer` headers. |
| | Role-Based Access Control | Strict RBAC middleware: `STUDENT` cannot review or view others' projects; `MENTOR` & `ADMIN` have evaluation access. |
| | Privileged Seed | Database seed script (`prisma/seed.ts`) idempotently seeds initial Admin, Mentor, and Student test accounts. |
| **Technical Stack** | Language & Tools | TypeScript (strict mode), Next.js App Router (Tailwind CSS, shadcn/ui pattern, Lucide), Express.js REST API, PostgreSQL, Prisma ORM, Vitest, Supertest. |

---

## 2. Technology Stack

- **Monorepo**: npm workspaces (`apps/web`, `apps/api`, `packages/database`)
- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS, Lucide React, Sonner (toast notifications)
- **Backend API Server**: Express.js with TypeScript, Helmet, CORS, Cookie-Parser, Morgan, Express-Rate-Limit
- **Database & ORM**: PostgreSQL 16, Prisma ORM v5
- **Authentication**: JSON Web Tokens (JWT) via `jsonwebtoken`, password hashing via `bcryptjs`
- **Validation**: Zod (backend request validation and schema inference)
- **Testing**: Vitest + Supertest (34 automated integration tests running against PostgreSQL test database)

---

## 3. Architecture & Monorepo Structure

```
PH-Dashboard/
├── apps/
│   ├── api/                           # Express.js REST API Server
│   │   ├── src/
│   │   │   ├── config/env.ts          # Environment variables & constants
│   │   │   ├── controllers/           # AuthController, ProjectController
│   │   │   ├── middlewares/           # auth (JWT), RBAC, rate-limit, error handler
│   │   │   ├── routes/                # auth.routes, project.routes, health.routes
│   │   │   ├── services/              # AuthService, ProjectService (business logic)
│   │   │   ├── utils/                 # urlNormalizer, apiResponse helpers
│   │   │   ├── validators/            # Zod validation schemas
│   │   │   ├── app.ts                 # Express application setup
│   │   │   └── server.ts              # HTTP server entrypoint
│   │   ├── tests/                     # 34 Vitest + Supertest integration tests
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── web/                           # Next.js 14 App Router Client
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx         # Root layout with AuthProvider & Toaster
│       │   │   ├── page.tsx           # Public landing page with workflow explanation
│       │   │   ├── login/page.tsx     # Sign in with password toggle & quick fill
│       │   │   ├── signup/page.tsx    # Student signup (no elevated roles)
│       │   │   ├── student/           # Student portal (dashboard, submit, submissions)
│       │   │   └── mentor/            # Mentor portal (dashboard, projects table, review)
│       │   ├── components/
│       │   │   ├── ui/                # button, input, textarea, card, badge, dialog, table
│       │   │   └── shared/            # app-sidebar, header, status-badge, statistics-card
│       │   ├── lib/                   # api client, auth-context, utils
│       │   └── types/                 # TypeScript interfaces
│       ├── package.json
│       ├── next.config.js
│       └── tailwind.config.js
│
├── packages/
│   └── database/                      # Prisma ORM Database Package
│       ├── prisma/
│       │   ├── schema.prisma          # Database models, enums, indexes, constraints
│       │   ├── migrations/            # SQL migration history
│       │   └── seed.ts                # Idempotent seed script for Admin/Mentor/Student
│       ├── src/index.ts               # Prisma client singleton export
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                       # Root workspace package.json
├── tsconfig.base.json                 # Shared TypeScript configuration
├── .env.example                       # Documented environment template
├── .env                               # Local environment configuration
└── README.md                          # Full system documentation
```

---

## 4. Prerequisites

- **Node.js**: `v20.x` or `v24.x` (tested on Node v24.18.0)
- **npm**: `v10.x` or `v12.x`
- **PostgreSQL**: `v14+` or `v16+` running on localhost (or cloud URL like Supabase/Neon/Railway)

---

## 5. Installation & Setup Instructions

### Step 1: Clone and install dependencies
```bash
git clone <repository-url>
cd PH-Dashboard
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` and `TEST_DATABASE_URL` match your local PostgreSQL setup:
```env
# Server & Client Ports
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5001

# PostgreSQL Databases
DATABASE_URL="postgresql://abusaidjoy@localhost:5432/project_review_hub?schema=public"
TEST_DATABASE_URL="postgresql://abusaidjoy@localhost:5432/project_review_hub_test?schema=public"

# JWT Authentication
JWT_SECRET="project_review_hub_dev_secret_key_with_at_least_32_characters_for_hmac"
JWT_EXPIRES_IN="7d"

# Seed Credentials
SEED_ADMIN_NAME="Platform Administrator"
SEED_ADMIN_EMAIL="admin@projecthub.local"
SEED_ADMIN_PASSWORD="AdminPassword123!"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_SUBMISSIONS=5
RATE_LIMIT_MAX_LOGIN=5
```

### Step 3: Run Database Migrations
Create the tables in PostgreSQL:
```bash
npm run db:migrate
```

### Step 4: Seed Initial Accounts
Seed the Admin, Mentor, and Student test accounts:
```bash
npm run db:seed
```

---

## 6. Seeded Accounts for Evaluation

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@projecthub.local` | `AdminPassword123!` | Global project listing, full dataset stats, approve/reject reviews. |
| **MENTOR** | `mentor@projecthub.local` | `MentorPassword123!` | Global project listing, server-side filtering, project triage, review dialog. |
| **STUDENT** | `student@projecthub.local` | `StudentPassword123!` | Submit projects, view personal dashboard & submissions. Cannot review. |

*Tip: The `/login` page includes assessment quick-fill buttons to populate mentor and student credentials in one click.*

---

## 7. Running the Application

### Run frontend and backend concurrently:
```bash
npm run dev
```
- **Express API**: running at [http://localhost:5001](http://localhost:5001)
- **Next.js Web**: running at [http://localhost:3000](http://localhost:3000)

### Or run individually:
```bash
# Terminal 1: Start Express API
npm run dev:api

# Terminal 2: Start Next.js Frontend
npm run dev:web
```

---

## 8. Automated Testing Suite

The project includes **34 automated integration tests** using **Vitest** and **Supertest** running directly against the real PostgreSQL test database.

```bash
npm run test
```

### Test Coverage Highlights:
1. **Authentication Tests (`tests/auth.test.ts`)**:
   - Student signup succeeds and automatically sets role to `STUDENT`.
   - Passwords are encrypted with `bcrypt` (never stored plaintext).
   - Privilege escalation prevention: public signup rejects or ignores attempts to set `role: "ADMIN"`.
   - Duplicate email registrations are rejected with `409 Conflict`.
   - Valid login returns JWT token and sets secure HttpOnly cookie.
   - Invalid credentials and non-existent accounts fail with generic `401 Unauthorized`.
   - Protected routes reject missing or forged tokens.

2. **Authorization & RBAC Tests (`tests/rbac.test.ts`)**:
   - Students receive `403 Forbidden` when attempting to access `/api/projects` or `/api/projects/stats`.
   - Students receive `403 Forbidden` when attempting to call `/api/projects/:id/review`.
   - Students cannot view another student's private submission records.
   - Students can view their own submission records.
   - Mentors and Admins can access project listings, view any project, and submit review verdicts.

3. **Project Submission & Duplicate Prevention Tests (`tests/projects.test.ts`)**:
   - Valid project submission creates a record with server-controlled `status: PENDING`.
   - Client-supplied privileged fields (`status: 'APPROVED'`, `studentId`, `reviewedById`) cannot override server values.
   - Malformed URLs (invalid protocol, missing domains) fail Zod validation.
   - Duplicate repository URLs for the same student are blocked with `409 Conflict`.
   - Different students are allowed to submit the same repository URL.

4. **Submission Rate Limiting Tests (`tests/ratelimit.test.ts`)**:
   - Verifies that after 5 rapid project submissions, the 6th submission returns `429 Too Many Requests`.

5. **Pagination, Filtering, Statistics & Reviews (`tests/review.test.ts`)**:
   - Server-side pagination returns the requested `page` and `limit`.
   - Filter `status=APPROVED` returns only approved records.
   - Filter `status=REJECTED` returns only rejected records.
   - Filter `status=PENDING` returns only pending records.
   - Server-side search by project name or student email.
   - Approving a project persists `status: APPROVED`, records `reviewedById`, and sets `reviewedAt`.
   - Rejecting a project records constructive `reviewComment`.
   - Statistics endpoint (`/api/projects/stats`) returns accurate counts across the full PostgreSQL database.

---

## 9. API Reference & Documentation

### Base URL: `http://localhost:5001/api`

### Health Check
- `GET /health`: Returns service health status and timestamp.

### Authentication Endpoints
- `POST /auth/signup`
  - Body: `{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password123!" }`
  - Response: `201 Created` with safe user profile and JWT token (sets `auth_token` cookie).
- `POST /auth/login`
  - Body: `{ "email": "jane@example.com", "password": "Password123!" }`
  - Response: `200 OK` with user profile and JWT token.
- `POST /auth/logout`
  - Response: `200 OK` (clears authentication cookie).
- `GET /auth/me`
  - Headers: `Authorization: Bearer <token>` or cookie
  - Response: `200 OK` with user profile.

### Student Endpoints
- `POST /projects`
  - Role: `STUDENT` only
  - Body: `{ "name": "...", "repoUrl": "...", "liveUrl": "...", "description": "..." }`
  - Rate limit: 5 requests / min per student
  - Response: `201 Created`
- `GET /projects/my?page=1&limit=10`
  - Role: `STUDENT` only
  - Response: Paginated list of student's own projects.
- `GET /projects/my/stats`
  - Role: `STUDENT` only
  - Response: `{ total: 3, pending: 1, approved: 2, rejected: 0 }`

### Mentor / Admin Endpoints
- `GET /projects?page=1&limit=10&status=PENDING&search=react`
  - Role: `MENTOR` or `ADMIN`
  - Query parameters:
    - `page` (default 1)
    - `limit` (default 10, max 100)
    - `status` (`ALL`, `PENDING`, `APPROVED`, `REJECTED`)
    - `search` (optional substring matching project name or student email)
  - Response shape:
    ```json
    {
      "success": true,
      "data": {
        "items": [
          {
            "id": "uuid-...",
            "name": "Distributed Task Scheduler",
            "repoUrl": "https://github.com/alexmercer/task-scheduler",
            "liveUrl": "https://task-scheduler-demo.vercel.app",
            "description": "...",
            "status": "PENDING",
            "studentId": "uuid-...",
            "student": {
              "id": "uuid-...",
              "name": "Alex Mercer",
              "email": "alex@example.com"
            },
            "reviewedById": null,
            "reviewedAt": null,
            "createdAt": "2026-10-23T..."
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 10,
          "totalItems": 1,
          "totalPages": 1
        }
      }
    }
    ```
- `GET /projects/stats`
  - Role: `MENTOR` or `ADMIN`
  - Response: `{ total: 10, pending: 4, approved: 5, rejected: 1 }`
- `GET /projects/:id`
  - Authenticated (Student can only access own project; Mentor/Admin can access any)
- `PATCH /projects/:id/review`
  - Role: `MENTOR` or `ADMIN`
  - Body:
    ```json
    {
      "status": "APPROVED",
      "reviewComment": "Outstanding modular architecture and comprehensive test suite."
    }
    ```
  - Response: `200 OK` with updated project and reviewer attribution.

---

## 10. Duplicate Prevention & Rate Limiting Rules

### Duplicate Prevention Rule
- A student cannot submit the same repository URL more than once.
- **Normalization algorithm (`urlNormalizer.ts`)**:
  1. Trims whitespace.
  2. Enforces HTTP/HTTPS protocol.
  3. Lowercases hostname (`github.com`).
  4. Strips `.git` and trailing slashes (`/`).
  5. Lowercases repository pathname (`/user/repo`).
  6. Example: `https://github.com/AlexMercer/Task-Scheduler.git/` normalizes to `https://github.com/alexmercer/task-scheduler`.
- **Enforcement Layers**:
  1. Service-layer lookup: queries existing submission for `studentId` + normalized URL and throws `409 Conflict`.
  2. Database constraint: PostgreSQL composite unique index `@@unique([studentId, repoUrl], name: "student_repo_unique")`.

### Rate Limiting Policy
- **Project Submissions**: 5 submissions per minute per authenticated student ID (`express-rate-limit`). Returns `429 Too Many Requests`.
- **User Logins**: 5 attempts per 15 minutes per IP address to deter brute-force attacks.
- **General API**: 300 requests per 15 minutes.

---

## 11. Production Build & Deployment

### Run Production Builds:
```bash
npm run build
```
This runs:
1. `npm run build -w @project-review-hub/database` (`tsc` generates `dist/`)
2. `npm run build -w @project-review-hub/api` (`tsc` generates `dist/`)
3. `npm run build -w @project-review-hub/web` (`next build` produces optimized standalone assets)

### Production Deployment Notes:
- **Reverse Proxy**: Set `trust proxy` in Express when deployed behind Nginx, Cloudflare, or AWS ALB.
- **CORS**: Configure `FRONTEND_URL` in `.env` to your production frontend domain (e.g. `https://reviewhub.edu`).
- **Database**: Run `npm run db:migrate:deploy` in your CI/CD pipeline to apply migrations to production PostgreSQL without interactive prompts.
- **Distributed Rate Limiting**: In multi-instance deployments, configure `express-rate-limit` to use a Redis store (`rate-limit-redis`) instead of the default in-memory store.

---

## 12. Evaluation Walkthrough Recording

A complete browser recording demonstrating the landing page, mentor login, server-side filtering, student registration, and successful project submission is available in the artifacts directory:
`review_hub_e2e_walkthrough_1792721333293.webp`
