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

> **Convention:** Each session entry lists the branch state, files touched, decisions made, and any objective shifts.
