export type Verdict = 'pass' | 'fail' | 'inconclusive'

export interface Judge {
  id: string
  name: string
  system_prompt: string
  target_model: string
  active: boolean
  created_at: string
}

export interface Submission {
  id: string
  queue_id: string
  task_id: string
  created_at: number
  raw: Record<string, unknown>
}

export interface Question {
  id: string
  submission_id: string
  template_id: string
  rev: number
  question_type: string
  question_text: string
}

export interface Answer {
  question_id: string
  data: Record<string, unknown>
}

export interface JudgeAssignment {
  queue_id: string
  question_id: string
  judge_id: string
}

export interface Evaluation {
  id: string
  submission_id: string
  question_id: string
  judge_id: string
  verdict: Verdict
  reasoning: string
  created_at: string
}

export interface EvaluationFilters {
  judgeIds?: string[]
  questionIds?: string[]
  verdicts?: Verdict[]
}
