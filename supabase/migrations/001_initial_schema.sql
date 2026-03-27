-- Submissions
create table submissions (
  id          text primary key,
  queue_id    text not null,
  task_id     text not null,
  created_at  bigint not null,
  raw         jsonb not null
);

-- Questions (one per question entry inside a submission)
create table questions (
  id              text primary key,
  submission_id   text not null references submissions(id) on delete cascade,
  rev             int not null,
  question_type   text not null,
  question_text   text not null
);

-- Answers keyed by question_id (flexible jsonb for choice/reasoning/free-form)
create table answers (
  question_id   text primary key references questions(id) on delete cascade,
  data          jsonb not null
);

-- AI Judges
create table judges (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  system_prompt  text not null,
  target_model   text not null default 'claude-haiku-4-5-20251001',
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Judge assignments: which judges are assigned to which question within a queue
create table judge_assignments (
  queue_id      text not null,
  question_id   text not null references questions(id) on delete cascade,
  judge_id      uuid not null references judges(id) on delete cascade,
  primary key (queue_id, question_id, judge_id)
);

-- Evaluation results
create table evaluations (
  id             uuid primary key default gen_random_uuid(),
  submission_id  text not null references submissions(id) on delete cascade,
  question_id    text not null references questions(id) on delete cascade,
  judge_id       uuid not null references judges(id) on delete cascade,
  verdict        text not null check (verdict in ('pass', 'fail', 'inconclusive')),
  reasoning      text not null,
  created_at     timestamptz not null default now()
);

-- Indexes for common query patterns
create index on questions(submission_id);
create index on evaluations(submission_id);
create index on evaluations(question_id);
create index on evaluations(judge_id);
create index on evaluations(verdict);
create index on judge_assignments(question_id);
