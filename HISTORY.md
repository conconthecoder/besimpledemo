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

## Session 2 — (next session)

_To be filled in._

---

> **Convention:** Each session entry lists the branch state, files touched, decisions made, and any objective shifts.
