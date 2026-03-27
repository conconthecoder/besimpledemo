import { supabase } from './supabase'
import type { JudgeAssignment } from '../types'

export async function getAssignmentsForQueue(queueId: string): Promise<JudgeAssignment[]> {
  const { data, error } = await supabase
    .from('judge_assignments')
    .select('*')
    .eq('queue_id', queueId)
  if (error) throw error
  return data as JudgeAssignment[]
}

export async function setAssignments(
  queueId: string,
  questionId: string,
  judgeIds: string[]
): Promise<void> {
  // Delete existing assignments for this queue+question
  const { error: delError } = await supabase
    .from('judge_assignments')
    .delete()
    .eq('queue_id', queueId)
    .eq('question_id', questionId)
  if (delError) throw delError

  // Insert new assignments (skip if empty)
  if (judgeIds.length === 0) return

  const rows = judgeIds.map((judge_id) => ({ queue_id: queueId, question_id: questionId, judge_id }))
  const { error: insError } = await supabase.from('judge_assignments').insert(rows)
  if (insError) throw insError
}
