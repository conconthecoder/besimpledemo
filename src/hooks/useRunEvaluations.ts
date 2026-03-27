import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { runJudgeEvaluation } from '../lib/evaluations'
import { getAssignmentsForQueue } from '../lib/judgeAssignments'
import { getQuestionsBySubmission } from '../lib/submissions'
import type { Submission } from '../types'

export interface RunProgress {
  planned: number
  completed: number
  failed: number
}

export interface RunResult extends RunProgress {
  done: boolean
}

export function useRunEvaluations() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  async function runForQueue(queueId: string, submissions: Submission[]) {
    setIsRunning(true)
    setProgress(null)

    // Build the full list of (submission, question, judge) triples
    type Triple = { submissionId: string; questionId: string; judgeId: string }
    const triples: Triple[] = []

    const assignments = await getAssignmentsForQueue(queueId)

    for (const sub of submissions) {
      const questions = await getQuestionsBySubmission(sub.id)
      for (const q of questions) {
        const assigned = assignments.filter((a) => a.question_id === q.id)
        for (const a of assigned) {
          triples.push({ submissionId: sub.id, questionId: q.id, judgeId: a.judge_id })
        }
      }
    }

    const planned = triples.length
    let completed = 0
    let failed = 0

    setProgress({ planned, completed, failed, done: false })

    // Run all triples concurrently (capped at 5 in-flight at once)
    const CONCURRENCY = 5
    const queue = [...triples]

    async function runNext(): Promise<void> {
      const triple = queue.shift()
      if (!triple) return
      try {
        await runJudgeEvaluation(triple.submissionId, triple.questionId, triple.judgeId)
        completed++
      } catch {
        failed++
      }
      setProgress({ planned, completed, failed, done: false })
      return runNext()
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, planned) }, () => runNext())
    await Promise.all(workers)

    setProgress({ planned, completed, failed, done: true })
    setIsRunning(false)
    queryClient.invalidateQueries({ queryKey: ['evaluations'] })
  }

  return { runForQueue, progress, isRunning }
}
