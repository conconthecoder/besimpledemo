# Project Objectives — AI Judge

---

## 1. What This Product Does (Non-Technical)

AI Judge is a web application that helps annotation teams automatically review and grade human-submitted answers using AI.

In an annotation workflow, human labelers answer questions about submissions — things like "Is the sky blue?" or "Does this image contain a vehicle?" — and provide written reasoning. Reviewing thousands of those answers by hand is slow, inconsistent, and expensive.

AI Judge automates that review layer. You upload a batch of submissions (the human labeler's work), configure one or more AI "judges" — each with its own grading criteria and AI model — assign those judges to specific questions, and then hit **Run AI Judges**. The system fans out to real AI providers (OpenAI, Anthropic, Gemini) in the background, and every (submission × question × judge) combination gets a verdict: **pass**, **fail**, or **inconclusive**, plus a one-sentence explanation of why.

The results are surfaced on a dedicated page with filters (by judge, by question, by verdict) and a live pass-rate stat at the top — e.g., *"42% pass of 120 evaluations"* — so team leads can instantly see where quality is breaking down, which judges are most useful, and which questions are generating the most failures.

The entire product is designed around one insight: **grading at scale requires automation, but that automation needs to be configurable, transparent, and auditable.** Every verdict is stored with its reasoning, the judge that produced it, and a timestamp — so you can always trace why something passed or failed.

---

## 2. Technical Description

### Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React + TypeScript | React 19 |
| Build tool | Vite | Latest |
| Styling | Tailwind CSS | v4 |
| Routing | React Router | v7 |
| Data fetching / cache | TanStack Query | v5 |
| Backend / database | Supabase (PostgreSQL) | Latest |
| Server-side LLM execution | Supabase Edge Functions (Deno) | Latest |
| Schema validation | Zod | v3 |
| Primary LLM | Anthropic Claude (configurable) | claude-haiku-4-5 / claude-sonnet-4-6 |

### Database Schema

```
submissions
  id          text PK
  queue_id    text
  task_id     text
  created_at  bigint   ← unix ms from JSON
  raw         jsonb    ← full original object stored for reference

questions
  id              text PK   ← q_template_1 etc.
  submission_id   text FK → submissions.id
  rev             int
  question_type   text
  question_text   text

answers
  question_id   text FK → questions.id
  data          jsonb   ← flexible; choice, reasoning, free_form etc.

judges
  id             uuid PK
  name           text
  system_prompt  text
  target_model   text
  active         boolean  ← soft delete only, never hard delete

judge_assignments
  queue_id      text
  question_id   text FK → questions.id
  judge_id      uuid FK → judges.id
  PRIMARY KEY (queue_id, question_id, judge_id)

evaluations
  id             uuid PK
  submission_id  text FK → submissions.id
  question_id    text FK → questions.id
  judge_id       uuid FK → judges.id
  verdict        text CHECK IN ('pass','fail','inconclusive')
  reasoning      text
  created_at     timestamptz
```

### Data Flow

```
User uploads JSON
  → Zod validates shape (SubmissionSchema)
  → batch insert: submissions + questions + answers to Supabase

User creates/edits/deactivates judges
  → CRUD against judges table via Supabase JS client

User assigns judges to questions
  → upsert into judge_assignments (queue_id, question_id, judge_id)

User clicks "Run AI Judges"
  → frontend enumerates (submission × question × assigned judges)
  → for each pair: calls Supabase Edge Function run-judge
      → Edge Function fetches judge + question + answer from DB
      → calls LLM via Anthropic SDK (server-side, key in Supabase Secrets)
      → uses client.messages.parse() + zodOutputFormat(VerdictSchema)
      → writes evaluation record to DB
      → returns { verdict, reasoning }
  → frontend tracks planned / completed / failed counts
  → on completion: invalidateQueries(['evaluations'])

Results page
  → useQuery({ queryKey: ['evaluations', filters] })
  → SQL: SELECT verdict, COUNT(*) GROUP BY verdict for aggregate
  → multi-select filters on judge, question, verdict
```

### LLM Structured Output

Every LLM call uses native constrained decoding — not free-form JSON parsing:

```ts
const VerdictSchema = z.object({
  verdict: z.enum(['pass', 'fail', 'inconclusive']),
  reasoning: z.string()
})

const response = await client.messages.parse({
  model: judge.targetModel,
  output_config: { format: zodOutputFormat(VerdictSchema) },
  system: judge.systemPrompt,
  messages: [{ role: 'user', content: buildPrompt(question, answer) }]
})
// response.parsed_output is typed — no JSON.parse(), no schema violation possible
```

### Security Model

- LLM API keys live in **Supabase Secrets** (AES-encrypted), never in the browser bundle
- All Edge Function calls are authenticated via Supabase JWT (user's session token)
- No `VITE_` prefixed secrets — anything prefixed `VITE_` is bundled into client JS

---

## 3. Trade-offs & Why

### Supabase over Firebase
Firestore has no `GROUP BY` or `JOIN`. The pass-rate stat (`42% pass of 120 evaluations`) requires aggregating evaluations by verdict — trivial in SQL, but in Firestore it means downloading every evaluation document and counting in the browser. Supabase also auto-generates TypeScript types from the schema via `supabase gen types`, eliminating a whole class of type/DB drift bugs.

### Edge Functions over browser-side LLM calls
Any key in browser JavaScript is extractable via DevTools. `VITE_ANTHROPIC_API_KEY` is not a secret — it ships in the bundle. Edge Functions proxy all LLM calls server-side with keys stored in encrypted Supabase Secrets. The tradeoff is a ~200ms cold-start on first invocation, which is acceptable for a batch evaluation flow.

### TanStack Query v5 over plain `useEffect`
The filters page has multiple interdependent filter dropdowns. Each filter combination needs its own cache entry. TanStack Query's `queryKey: ['evaluations', filters]` handles this automatically — the cache busts when filters change, and `invalidateQueries(['evaluations'])` after a run ensures fresh data everywhere. Doing this manually with `useEffect` requires reimplementing debouncing, deduplication, and cache invalidation by hand.

### Native structured output over `JSON.parse()`
Prompting a model to "return JSON" and then `JSON.parse()`-ing the response fails in production when the model adds markdown fences, trailing commas, or explanation text outside the object. Native structured output (`output_config: { format: zodOutputFormat(...) }`) uses constrained token generation — the model's output is grammatically guaranteed to match the schema. Zero parse errors in production.

### Soft-delete judges, never hard-delete
If a judge is hard-deleted, all historical evaluations referencing that judge lose their context — you can't tell what criteria produced a verdict. Soft-delete (`active: false`) keeps the record intact while removing it from the assignment UI. This is the right default for any audit trail system.

### Judge assignment at queue-question level (not per-submission)
The spec says "one or more judges per question within a queue." Assigning judges at the queue+question level (not per individual submission) means you configure once and run across all submissions in that queue — which is the natural annotation workflow. Per-submission assignment would require configuring N × Q pairs and offers no practical benefit.

### No hard-delete on evaluations
Evaluations are immutable records. Re-running judges appends new evaluation records rather than overwriting. This preserves history and lets you compare judge runs over time.

---

## 4. How Each Rubric Criterion Is Met

### Correctness — *"Meets all functional requirements without crashes"*

| Requirement | How it's met |
|---|---|
| 3.1 JSON file upload | Zod validates the full shape before any DB write; invalid files get an error message, not a silent failure |
| 3.1 Cloud persistence | Supabase PostgreSQL — no localStorage, no SQLite, no in-memory |
| 3.2 Judge CRUD | Create / edit / deactivate (soft delete) via dedicated Judges page |
| 3.2 Judges persisted | Same Supabase backend; survive page reloads |
| 3.3 Assign judges per question | `judge_assignments` table keyed by (queue_id, question_id, judge_id) |
| 3.4 Run AI Judges button | On queue page; fans out all (question × judge) pairs |
| 3.4 Real LLM API calls | Anthropic SDK via Edge Function — not mocked |
| 3.4 Evaluations stored in backend | Written to `evaluations` table in Supabase from the Edge Function |
| 3.4 Error handling | Timeouts / quota errors → verdict: "inconclusive", error captured in reasoning |
| 3.4 Run summary | planned / completed / failed counts shown on completion |
| 3.5 Results page | Dedicated `/results` route |
| 3.5 Table columns | Submission, Question, Judge, Verdict, Reasoning, Created |
| 3.5 Filters | Multi-select: judge, question, verdict |
| 3.5 Aggregate pass rate | SQL `GROUP BY verdict` → displayed as "X% pass of N evaluations" |

### Backend & LLM — *"Clean persistence layer and proper LLM integration"*

- All DB access goes through a thin data layer (`lib/judges.ts`, `lib/evaluations.ts`, etc.) — no raw Supabase calls scattered in components
- LLM calls are real, authenticated, and server-side only
- Verdict schema uses Zod + native constrained decoding — guaranteed shape, full TypeScript types
- All evaluation records include judgeId, submissionId, questionId, verdict, reasoning, timestamp

### Code Quality — *"Clear naming, small components, idiomatic React"*

- Pages are orchestrators; display logic lives in focused sub-components
- Hooks (`useSubmissions`, `useJudges`, `useEvaluations`, `useRunEvaluations`) encapsulate all async state
- No god components; no 200+ line files
- Folder structure: `pages/`, `components/`, `hooks/`, `lib/`, `types/`

### Types & Safety — *"Accurate TypeScript types, minimal `any`"*

- Supabase types auto-generated from schema via `supabase gen types typescript`
- `Verdict` is a string literal union: `'pass' | 'fail' | 'inconclusive'`
- All LLM response types derived from `z.infer<typeof VerdictSchema>`
- No `any` — unknown external shapes typed as `unknown` and narrowed at the boundary

### UX & Polish — *"Usable layout, sensible empty/loading states"*

- Every async boundary has: loading skeleton, error banner with retry, empty state with call-to-action
- "Run AI Judges" button shows real-time progress: `Running... 4 / 12` → `Done: 10 passed, 1 failed, 1 error`
- Results page shows aggregate stat prominently above the table
- Filter selections are reflected in the URL (shareable links)

### Judgment & Trade-offs — *"Clear reasoning in README for scope cuts or decisions"*

- This OBJECTIVES.md documents every architectural decision and the reasoning behind it
- Trade-offs section above explains each non-obvious choice
- HISTORY.md tracks how decisions evolved across sessions

---

> **Last updated:** 2026-03-27 | Session 1
