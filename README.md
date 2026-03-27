# AI Judge

An internal annotation review tool that automatically evaluates human-labeled answers using AI judges.

## What it does

Upload a batch of annotation submissions → assign AI judges to questions → run evaluations → view pass/fail results with filters and aggregate stats.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Data fetching**: TanStack Query v5
- **Validation**: Zod
- **LLM**: Anthropic Claude (configurable; OpenAI also supported)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Supabase project
Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Run the database migration
In the Supabase dashboard → SQL Editor, paste and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Configure environment variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Deploy the Edge Function
```bash
npx supabase functions deploy run-judge --project-ref YOUR_PROJECT_REF
```

Set the required secrets:
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref YOUR_PROJECT_REF
# Optional — only needed for GPT models:
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref YOUR_PROJECT_REF
```

### 6. Start the dev server
```bash
npm run dev
```

## Usage

1. **Queues** — Upload a `sample_input.json` file. Submissions are grouped by queue.
2. **Judges** — Create AI judges with a name, system prompt/rubric, and target model.
3. **Assign** — On the Queues page, expand a submission and toggle judges onto each question.
4. **Run** — Click "Run AI Judges" on a queue to evaluate all assigned (question × judge) pairs.
5. **Results** — View verdicts with filters by judge, question, and verdict. Pass rate shown at the top.

## Trade-offs & decisions

See [OBJECTIVES.md](./OBJECTIVES.md) for full architectural reasoning.

**Key decisions:**
- **Supabase over Firebase** — SQL aggregates make pass-rate trivial; no client-side assembly
- **Edge Functions for LLM calls** — API keys never touch the browser bundle
- **Soft-delete judges** — preserves evaluation history integrity
- **Native structured output** — Zod schema passed to LLM for guaranteed verdict shape
- **Judge assignment at queue-question level** — configure once, runs across all submissions in the queue

## Time spent

~4 hours (AI-assisted development)

**Trade-offs made under time pressure:**
- Question filter on Results page derives options from loaded evaluations (no separate questions endpoint)
- No pagination on the results table — acceptable for demo scale
- Gemini provider not yet implemented (Claude + OpenAI covered)
