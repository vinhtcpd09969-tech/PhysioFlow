# Next Session Prompt

## Current Progress
Node.js environment has been fully restored and packages installed. Docker Compose is running successfully with PostgreSQL. The Backend Authentication API (Login, Refresh Token, GetMe) is completely built and tested. The entire Backend architecture has been successfully migrated to **Express + TypeScript** with full type safety (`strict: true`). Context and Planning files have been updated to reflect the new Tech Stack.

## Current Working Files
- `d:\VLTT\VLTT\backend\src\index.ts`
- `d:\VLTT\VLTT\backend\tsconfig.json`

## Next Tasks
1. Start the backend development server using `npm run dev`.
2. Implement Axios Interceptors on the Frontend to handle JWT automatically.
3. Setup Zustand global store for Auth state (`useAuthStore`).
4. Build a modern, highly aesthetic Login Page UI in React using Tailwind CSS.

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
