# Next Session Prompt

## Current Progress
Node.js environment has been fully restored and packages installed. Docker Compose is running successfully with PostgreSQL. The Backend Authentication API (Login, Refresh Token, GetMe) is completely built and tested. The entire project is now 100% TypeScript (Backend + Frontend). Zod validation is implemented on both layers. The Frontend Login module is fully built using Tailwind CSS, Zustand, and React-Hook-Form.

## Current Working Files
- `d:\VLTT\VLTT\frontend\src\pages\Login.tsx`
- `d:\VLTT\VLTT\frontend\src\stores\authStore.ts`

## Next Tasks
1. Implement the Registration API (Backend Controller & Zod Schema).
2. Build the Registration Page UI (`/register`) matching wireframes.
3. Test complete Auth flow (Register -> Login -> Dashboard).

## Unresolved Bugs
- None.

## Architecture Constraints
- Backend uses TypeScript, Express, and Raw SQL (`pg`).
- Frontend MUST use Zustand for state management (No Redux).
- Authentication logic MUST use the V2 Database schema structure.
- Always use high-quality modern design principles for the React UI.

## Agent Workflow Rules
- Every time a task or module is completed, check `git status`, auto run `git add .`, and `git commit` using Conventional Commits (e.g., `feat(auth): ...`, `chore(docker): ...`).
- Before ending any session, the Agent MUST explicitly ask the user: "Sếp có muốn tôi push toàn bộ code mới nhất lên GitHub không?".

## Recommended Next Action
Read this file, review the `walkthrough.md` artifact from the backend TypeScript migration, and begin building the Frontend Login UI and Zustand Auth Store.
