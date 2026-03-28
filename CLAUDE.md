# AI Judge — Claude Code Project Guide

## What This Project Is

An annotation quality-control tool. Human labelers answer questions about submissions. AI judges evaluate those answers and return a verdict (pass / fail / inconclusive) plus reasoning. Results are stored in Supabase and surfaced in a filterable Results page.

## Dev Commands

```bash
npm run dev          # start Vite dev server at localhost:5173
npm run build        # tsc -b && vite build
npm run test         # vitest run (all tests)
npm run test:watch   # vitest watch mode
npm run lint         # eslint .
```

## Project Structure

```
src/
  pages/       — route-level components (orchestrators only, no logic)
  components/  — focused UI components, one responsibility each
  hooks/       — all TanStack Query hooks (useQuery / useMutation wrappers)
  lib/         — thin Supabase data layer, one file per resource
  types/       — shared TypeScript interfaces, no logic
supabase/
  functions/run-judge/  — Deno Edge Function, LLM calls happen here only
  migrations/           — SQL schema, run once in Supabase SQL Editor
```

## Code Rules (always follow)

- **Functions < 50 lines** — split if longer
- **Files 200–400 lines** — 800 absolute max
- **No deep nesting** — max 4 levels; extract early-return helpers
- **Immutability** — always create new objects, never mutate existing
- **No `any`** — use `unknown` at boundaries and narrow with Zod or type guards
- **Validate at boundaries** — Zod on all external JSON (uploads, LLM responses)
- **Error messages must not leak internals** — sanitize before returning to client
- **No hardcoded secrets** — all keys in `.env.local` or Supabase Secrets

## Architecture Rules

- LLM calls happen **only** in `supabase/functions/run-judge/` — never in the browser
- DB access goes through `src/lib/*.ts` — no raw Supabase calls in components or pages
- Hooks own all async state — components only render what hooks provide
- `VITE_` env vars are public — never put secrets there

## Agent Orchestration (when using Claude Code agents)

- Complex new features → use `planner` agent first
- After writing code → use `code-reviewer` agent
- Build fails → use `build-error-resolver` agent
- Schema changes → use `database-reviewer` agent
- Security-sensitive code → use `security-reviewer` agent

## Testing

- Framework: Vitest + React Testing Library + jsdom
- Minimum 80% coverage on `src/lib/` and `src/components/`
- Test file convention: `src/__tests__/lib/foo.test.ts`, `src/__tests__/components/Foo.test.tsx`
- Run before every commit: `npm run test`
- Mock Supabase client via `vi.mock('../lib/supabase')`

## Git Conventions (conventional commits)

```
feat: add X
fix: correct Y
refactor: extract Z into own component
test: add coverage for FileUpload
docs: update OBJECTIVES.md
chore: remove unused dependency
```

## Key Files

| File | Purpose |
|---|---|
| `supabase/migrations/001_initial_schema.sql` | Full DB schema — run in Supabase SQL Editor |
| `sample_input.json` | Test data matching the spec's sample_input.json shape |
| `.env.local` | Local env vars (not committed) |
| `OBJECTIVES.md` | Full product description, technical spec, trade-offs, rubric mapping |
| `HISTORY.md` | Session-by-session log of decisions and changes |

## Environment Variables

```
VITE_SUPABASE_URL       — Supabase project URL (public, safe to expose)
VITE_SUPABASE_ANON_KEY  — Supabase anon key (public, safe to expose)
```

Edge Function secrets (set via `supabase secrets set`):
```
ANTHROPIC_API_KEY
OPENAI_API_KEY          — optional, only for GPT models
```
