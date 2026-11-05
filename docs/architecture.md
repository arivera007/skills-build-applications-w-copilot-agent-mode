# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route views and user-facing loading, empty, success, and error states in React components. All requests use the shared API client and relative `/api` paths; components do not call `fetch` directly.
- Logic tier decision: Keep HTTP parsing, status codes, and response envelopes in Express routes, with validation and business rules in service functions. Return deliberate 4xx responses for invalid or unknown input rather than leaking database cast errors.
- Data tier decision: Use Mongoose schemas for required fields, references, and defaults. Seed stable demo records with upserts, preserve unrelated records, and reconcile the seeded user's old team membership when moving that user.
- Activity tracking approach: Validate `userId`, `teamId`, activity type, and positive minutes; confirm both referenced records exist; then create the activity with user/team references, computed points, and an occurrence timestamp. List persisted activities through the API.
- Team management approach: Require a non-empty name, preserve submitted name and mascot, and default members to an empty array. Create and list teams through the service and API without moving persistence logic into routes or components.
- Leaderboard approach: Sum activity points per team, sort totals descending, and return `teamName`, `totalPoints`, and sequential 1-based ranks.
- Workout suggestions approach: Find the user by email, use their fitness goal and recent activity to choose matching workouts, and include a reason for the top suggestion. Return a deliberate 4xx when no user matches.

## Test plan

Run the narrow contract suite for the tier being changed, then the builds before considering the implementation complete. A failure means the corresponding contract or compilation requirement below is unmet.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks model validation, references/defaults, and repeatable seeding that preserves unrelated data. Failures point to a schema or seed contract violation.
- Logic tier: `npm run test:api --prefix octofit-tracker/backend` checks activity and team create/list behavior, invalid-input 4xx responses, leaderboard totals/ranks, and user-specific workout suggestions. Failures point to incorrect route/service behavior or response shape.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` checks API-backed rendering, the shared client, route-specific requests, and accessible loading, empty, and error states. Failures point to an incomplete UI/API integration or missing state.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript types and module compatibility; a failure indicates backend code does not compile.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript and the Vite production build; a failure indicates a type or bundling error.

Starter baseline observed before implementation: the data suite had 4 schema failures and a passing seed test; all 4 API tests failed; all 15 frontend tests failed. The backend and frontend build commands have not been run as part of this baseline check.
