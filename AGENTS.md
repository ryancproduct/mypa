# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds all TypeScript sources: UI in `components/`, route screens in `pages/`, hooks in `hooks/`, services in `services/`, state in `stores/`, helpers in `utils/`.
- Configuration and feature flags live in `src/config/app.ts`; extend them here instead of scattering `import.meta.env` checks.
- Static icons and offline assets sit in `public/`; mirror branding changes inside the PWA manifest block in `vite.config.ts`.
- Production bundles land in `dist/`; `dev-dist/` is generated during PWA dev and should stay untracked.

## Build, Test, and Development Commands
- `npm install` bootstraps dependencies.
- `npm run dev` starts Vite at `http://localhost:5173` with hot reload.
- `npm run build` runs `tsc -b` then `vite build` to populate `dist/`.
- `npm run preview` serves the production build for service-worker checks.
- `npm run lint`, `lint:fix`, and `type-check` enforce ESLint and TS rules.
- `npm run format` / `format:check` apply Prettier to `src/**/*`.
- `npm run build:analyze` inspects bundles; run it after adding packages or large assets.
- `npm run test:build` chains type-check, lint, and build—treat it as the merge gate.

## Coding Style & Naming Conventions
- Use Prettier defaults (2-space indent, double quotes in JSX); avoid manual formatting.
- Components, stores, and providers use PascalCase (`TaskListPanel.tsx`); hooks follow `useX`; utilities stay camelCase.
- Keep modules focused; add barrel exports only when they simplify many imports.
- Environment placeholders stay in SCREAMING_SNAKE_CASE and must begin with `VITE_`.

## Testing Guidelines
- Automated tests are not yet wired; add Vitest or Testing Library coverage and colocate specs as `ComponentName.test.tsx`.
- Always run `npm run test:build` before pushing to catch typing, lint, and bundling regressions.
- Validate PWA behaviour with `npm run preview`, confirming offline caches and Anthropic calls still register.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat`, `fix`, `chore`, `refactor`) with subjects under 72 characters.
- Rebase or squash noisy WIP commits; PRs should describe scope, link issues, and list key test commands.
- Highlight environment or config changes, and attach screenshots or short demos for UI updates.

## Security & Configuration Tips
- Secrets load via `VITE_*` variables in a local `.env`; mirror the keys referenced in `DEPLOYMENT.md` and keep them out of git.
- Route sensitive keys through `src/services/aiService.ts` and related secure-storage helpers; never embed them in React components.
- When toggling feature flags, update `src/config/app.ts` so deployment defaults stay consistent.
