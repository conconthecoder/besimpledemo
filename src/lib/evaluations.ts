import { supabase } from './supabase'
import type { EvaluationFilters, EvaluationWithJoins } from '../types'

export async function getEvaluations(filters: EvaluationFilters = {}): Promise<EvaluationWithJoins[]> {
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
  return data as unknown as EvaluationWithJoins[]
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
