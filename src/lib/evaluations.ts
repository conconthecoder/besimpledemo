import { supabase } from './supabase'
import type { Evaluation, EvaluationFilters } from '../types'

export async function getEvaluations(filters: EvaluationFilters = {}): Promise<Evaluation[]> {
  let query = supabase
    .from('evaluations')
    .select('*, judges(name), questions(question_text), submissions(queue_id)')
    .order('created_at', { ascending: false })

  if (filters.judgeIds && filters.judgeIds.length > 0) {
    query = query.in('judge_id', filters.judgeIds)
  }
  if (filters.questionIds && filters.questionIds.length > 0) {
    query = query.in('question_id', filters.questionIds)
  }
  if (filters.verdicts && filters.verdicts.length > 0) {
    query = query.in('verdict', filters.verdicts)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as Evaluation[]
}

export interface EvaluationStats {
  total: number
  pass: number
  fail: number
  inconclusive: number
  passRate: number
}

export async function getEvaluationStats(filters: EvaluationFilters = {}): Promise<EvaluationStats> {
  const evals = await getEvaluations(filters)
  const total = evals.length
  const pass = evals.filter((e) => e.verdict === 'pass').length
  const fail = evals.filter((e) => e.verdict === 'fail').length
  const inconclusive = evals.filter((e) => e.verdict === 'inconclusive').length
  return {
    total,
    pass,
    fail,
    inconclusive,
    passRate: total > 0 ? Math.round((pass / total) * 100) : 0,
  }
}

export async function runJudgeEvaluation(
  submissionId: string,
  questionId: string,
  judgeId: string
): Promise<{ verdict: string; reasoning: string }> {
  const { data, error } = await supabase.functions.invoke('run-judge', {
    body: { submissionId, questionId, judgeId },
  })
  if (error) throw error
  return data as { verdict: string; reasoning: string }
}
