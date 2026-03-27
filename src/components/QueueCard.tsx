import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getQuestionsBySubmission } from '../lib/submissions'
import { useAssignmentsForQueue } from '../hooks/useJudgeAssignments'
import { QuestionAssignmentRow } from './QuestionAssignmentRow'
import { RunJudgesButton } from './RunJudgesButton'
import type { Judge, Submission, JudgeAssignment } from '../types'

interface Props {
  queueId: string
  submissions: Submission[]
  activeJudges: Judge[]
}

export function QueueCard({ queueId, submissions, activeJudges }: Props) {
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null)
  const { data: assignments = [] } = useAssignmentsForQueue(queueId)

  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Queue: {queueId}</h2>
        <p className="text-xs text-gray-400">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </p>
        <div className="mt-2">
          <RunJudgesButton queueId={queueId} submissions={submissions} />
        </div>
      </div>

      <ul className="divide-y divide-gray-100">
        {submissions.map((sub) => (
          <SubmissionRow
            key={sub.id}
            submission={sub}
            queueId={queueId}
            activeJudges={activeJudges}
            assignments={assignments}
            isExpanded={expandedSubId === sub.id}
            onToggle={() =>
              setExpandedSubId((prev) => (prev === sub.id ? null : sub.id))
            }
          />
        ))}
      </ul>
    </div>
  )
}

interface SubmissionRowProps {
  submission: Submission
  queueId: string
  activeJudges: Judge[]
  assignments: JudgeAssignment[]
  isExpanded: boolean
  onToggle: () => void
}

function SubmissionRow({
  submission,
  activeJudges,
  assignments,
  isExpanded,
  onToggle,
}: SubmissionRowProps) {
  const { data: questions, isPending } = useQuery({
    queryKey: ['questions', submission.id],
    queryFn: () => getQuestionsBySubmission(submission.id),
    enabled: isExpanded,
  })

  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
      >
        <div>
          <span className="font-mono text-xs text-gray-500">{submission.id}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-sm text-gray-700">Task: {submission.task_id}</span>
        </div>
        <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          {isPending ? (
            <p className="px-4 py-3 text-xs text-gray-400">Loading questions…</p>
          ) : (questions ?? []).length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400">No questions found.</p>
          ) : (
            (questions ?? []).map((q) => (
              <QuestionAssignmentRow
                key={q.id}
                queueId={submission.queue_id}
                questionId={q.id}
                questionText={q.question_text}
                activeJudges={activeJudges}
                assignments={assignments}
              />
            ))
          )}
        </div>
      )}
    </li>
  )
}
