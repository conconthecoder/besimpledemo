import { useQuery } from '@tanstack/react-query'
import { getQuestionsBySubmission } from '../lib/submissions'
import { QuestionAssignmentRow } from './QuestionAssignmentRow'
import type { Judge, Submission, JudgeAssignment } from '../types'

interface Props {
  submission: Submission
  activeJudges: Judge[]
  assignments: JudgeAssignment[]
  isExpanded: boolean
  onToggle: () => void
}

export function SubmissionRow({ submission, activeJudges, assignments, isExpanded, onToggle }: Props) {
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
