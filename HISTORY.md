# Project History

---

## Session 1 — 2026-03-27 | Planning & Architecture

### What happened
- Received assignment brief: build an **AI Judge** web app for an internal annotation platform
- Analyzed all functional requirements (3.1–3.5) from the spec
- Researched stack options: Firebase vs Supabase, TanStack Query vs SWR, browser LLM calls vs Edge Functions
- Locked in architecture (see OBJECTIVES.md)
- Created HISTORY.md and OBJECTIVES.md as living project documents

### Key decisions made
- **Supabase over Firebase** — SQL aggregates make pass-rate trivial; Firestore has no `GROUP BY`
- **Supabase Edge Functions over browser LLM calls** — API keys must never ship to the client
- **TanStack Query v5** — filter-keyed cache auto-busts on filter change; `invalidateQueries` after mutations
- **Native structured output with Zod** — `client.messages.parse()` + `zodOutputFormat` instead of `JSON.parse()` on freeform text; guarantees schema compliance at the token level
- **Soft-delete judges** — `active: boolean` flag only; hard-delete omitted to preserve evaluation history integrity
- **Judge assignment at queue-question level** — not per submission-question; spec wording supports this and keeps the data model simple

### No code written yet
- Repo is scaffolded as empty git repository on branch `claude/review-assignment-requirements-UpTVn`

---

## Session 2 — 2026-03-27 | Full Implementation

### Checkpoints completed
- **CP1** — Vite + React 19 + TS + Tailwind v4 + Supabase + TanStack Query v5 scaffold
- **CP2** — Data ingestion: Zod validation, file upload UI, Supabase insert for submissions/questions/answers
- **CP3** — Judge CRUD: create/edit modal, active/inactive toggle, soft-delete
- **CP4** — Judge assignment: per-question multi-select, persisted to judge_assignments table
- **CP5** — Evaluation runner: Supabase Edge Function (run-judge), concurrency-capped fan-out, progress tracking
- **CP6** — Results view: filterable table (judge/question/verdict), aggregate pass-rate stat
- **CP7** — Polish: Spinner component, README, HISTORY update

### Files created (key ones)
- supabase/migrations/001_initial_schema.sql
- supabase/functions/run-judge/index.ts
- src/lib/{submissions,judges,judgeAssignments,evaluations}.ts
- src/hooks/{useSubmissions,useJudges,useJudgeAssignments,useEvaluations,useRunEvaluations}.ts
- src/components/{Layout,FileUpload,JudgeModal,QueueCard,QuestionAssignmentRow,RunJudgesButton,MultiSelect,Spinner}.tsx
- src/pages/{QueuesPage,JudgesPage,ResultsPage}.tsx

### No objective shifts
All original requirements met. See OBJECTIVES.md for criterion mapping.

---

## Session 3 — 2026-03-27 | Code Review & Revisions

### What happened
- Full codebase audit against the original spec — read all 33 files
- Found 10 issues ranging from data integrity bugs to doc inaccuracies

### Issues fixed

1. **Question ID collision bug** — `questions.id` used raw template ID (`q_template_1`) which collides across submissions. Now generates composite ID `${submissionId}_${templateId}`. Added `template_id` column to preserve the original.

2. **Edge Function wasn't using native structured output** — was using prompt hack ("respond with ONLY JSON") + `JSON.parse()` with markdown fence stripping. Rewrote both `callAnthropic` and `callOpenAI` to use `output_config` / `json_schema` for guaranteed schema compliance.

3. **Supabase RLS policies missing** — tables were inaccessible via anon key without policies. Added permissive "Allow all" policies to all 6 tables (demo app, no auth).

4. **`@anthropic-ai/sdk` in frontend deps** — only used in Deno Edge Function via `npm:` import. Removed from package.json to avoid bundle bloat.

5. **Duplicate stats query** — `useEvaluationStats` fired a separate identical fetch. Removed; stats now computed inline from already-loaded evaluations array.

6. **OBJECTIVES.md inaccuracies**:
   - Claimed Zod v3, actually v4
   - Claimed `client.messages.parse()` + `zodOutputFormat()`, actually uses raw `output_config`
   - Claimed URL-reflected filters, never implemented
   - Fixed all to match actual code

7. **No sample_input.json** — added the spec's sample file to the repo root for easy testing.

### Files modified
- `supabase/migrations/001_initial_schema.sql` — template_id column + RLS policies
- `supabase/functions/run-judge/index.ts` — native structured output for both providers
- `src/lib/submissions.ts` — composite question IDs
- `src/lib/evaluations.ts` — removed unused getEvaluationStats
- `src/types/index.ts` — added template_id to Question
- `src/hooks/useEvaluations.ts` — removed useEvaluationStats
- `src/pages/ResultsPage.tsx` — inline stats computation
- `OBJECTIVES.md` — 6 factual corrections
- `package.json` — removed @anthropic-ai/sdk

### Files created
- `sample_input.json`

### Objective shift
- OBJECTIVES.md "LLM Structured Output" section now accurately describes the raw JSON schema approach rather than the Zod helper approach (which isn't available in Deno Edge Functions)

---

> **Convention:** Each session entry lists the branch state, files touched, decisions made, and any objective shifts.
