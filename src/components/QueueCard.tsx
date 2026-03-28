import { useState } from 'react'
import { useAssignmentsForQueue } from '../hooks/useJudgeAssignments'
import { SubmissionRow } from './SubmissionRow'
import { RunJudgesButton } from './RunJudgesButton'
import type { Judge, Submission } from '../types'

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
            activeJudges={activeJudges}
            assignments={assignments}
            isExpanded={expandedSubId === sub.id}
            onToggle={() => setExpandedSubId((prev) => (prev === sub.id ? null : sub.id))}
          />
        ))}
      </ul>
    </div>
  )
}
