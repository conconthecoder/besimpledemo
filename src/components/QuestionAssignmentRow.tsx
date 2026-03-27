import { useSetAssignments } from '../hooks/useJudgeAssignments'
import type { Judge, JudgeAssignment } from '../types'

interface Props {
  queueId: string
  questionId: string
  questionText: string
  activeJudges: Judge[]
  assignments: JudgeAssignment[]
}

export function QuestionAssignmentRow({
  queueId,
  questionId,
  questionText,
  activeJudges,
  assignments,
}: Props) {
  const setAssignments = useSetAssignments(queueId)

  const assignedIds = new Set(
    assignments
      .filter((a) => a.question_id === questionId)
      .map((a) => a.judge_id)
  )

  function toggleJudge(judgeId: string) {
    const next = assignedIds.has(judgeId)
      ? [...assignedIds].filter((id) => id !== judgeId)
      : [...assignedIds, judgeId]
    setAssignments.mutate({ questionId, judgeIds: next })
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-800 mb-2">{questionText}</p>
      <div className="flex flex-wrap gap-2">
        {activeJudges.map((judge) => {
          const isAssigned = assignedIds.has(judge.id)
          return (
            <button
              key={judge.id}
              onClick={() => toggleJudge(judge.id)}
              disabled={setAssignments.isPending}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                isAssigned
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {judge.name}
            </button>
          )
        })}
        {activeJudges.length === 0 && (
          <span className="text-xs text-gray-400">No active judges. Create one on the Judges page.</span>
        )}
      </div>
    </div>
  )
}
