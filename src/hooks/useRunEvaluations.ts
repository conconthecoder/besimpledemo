import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { runJudgeEvaluation } from '../lib/evaluations'
import { getAssignmentsForQueue } from '../lib/judgeAssignments'
import { getQuestionsBySubmission } from '../lib/submissions'
import type { JudgeAssignment, Submission } from '../types'

export interface RunProgress {
  planned: number
  completed: number
  failed: number
}

export interface RunResult extends RunProgress {
  done: boolean
}

type Triple = { submissionId: string; questionId: string; judgeId: string }

async function buildTriples(queueId: string, submissions: Submission[]): Promise<Triple[]> {
  const assignments = await getAssignmentsForQueue(queueId)
  const triples: Triple[] = []

  for (const sub of submissions) {
    const questions = await getQuestionsBySubmission(sub.id)
    for (const q of questions) {
      const assigned: JudgeAssignment[] = assignments.filter((a) => a.question_id === q.id)
      for (const a of assigned) {
        triples.push({ submissionId: sub.id, questionId: q.id, judgeId: a.judge_id })
      }
    }
  }

  return triples
}

async function executeConcurrently(
  triples: Triple[],
  onProgress: (completed: number, failed: number) => void,
  concurrency = 5
): Promise<{ completed: number; failed: number }> {
  const queue = [...triples]
  let completed = 0
  let failed = 0

  async function runNext(): Promise<void> {
    const triple = queue.shift()
    if (!triple) return
    try {
      await runJudgeEvaluation(triple.submissionId, triple.questionId, triple.judgeId)
      completed++
    } catch {
      failed++
    }
    onProgress(completed, failed)
    return runNext()
  }

  const workers = Array.from(
    { length: Math.min(concurrency, triples.length) },
    () => runNext()
  )
  await Promise.all(workers)

  return { completed, failed }
}

export function useRunEvaluations() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  async function runForQueue(queueId: string, submissions: Submission[]) {
    setIsRunning(true)
    setProgress(null)

    const triples = await buildTriples(queueId, submissions)
    const planned = triples.length

    setProgress({ planned, completed: 0, failed: 0, done: false })

    const { completed, failed } = await executeConcurrently(triples, (c, f) => {
      setProgress({ planned, completed: c, failed: f, done: false })
    })

    setProgress({ planned, completed, failed, done: true })
    setIsRunning(false)
    queryClient.invalidateQueries({ queryKey: ['evaluations'] })
  }

  return { runForQueue, progress, isRunning }
}
