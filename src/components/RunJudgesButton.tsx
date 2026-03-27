import { useRunEvaluations } from '../hooks/useRunEvaluations'
import type { Submission } from '../types'

interface Props {
  queueId: string
  submissions: Submission[]
}

export function RunJudgesButton({ queueId, submissions }: Props) {
  const { runForQueue, progress, isRunning } = useRunEvaluations()

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => runForQueue(queueId, submissions)}
        disabled={isRunning || submissions.length === 0}
        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running…' : 'Run AI Judges'}
      </button>

      {progress && (
        <div className="text-sm text-gray-600">
          {progress.done ? (
            <span className="text-green-700 font-medium">
              Done — {progress.completed} completed
              {progress.failed > 0 && `, ${progress.failed} failed`}
              {' '}of {progress.planned} planned
            </span>
          ) : (
            <span>
              {progress.completed + progress.failed} / {progress.planned}
              {progress.failed > 0 && (
                <span className="text-red-500 ml-1">({progress.failed} failed)</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
