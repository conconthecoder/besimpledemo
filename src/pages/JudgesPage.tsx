import { useState } from 'react'
import type { Judge } from '../types'
import { useJudges, useDeactivateJudge, useActivateJudge } from '../hooks/useJudges'
import { JudgeModal } from '../components/JudgeModal'
import { Spinner } from '../components/Spinner'

export function JudgesPage() {
  const { data: judges, isPending, isError, error } = useJudges()
  const deactivate = useDeactivateJudge()
  const activate = useActivateJudge()

  const [modalJudge, setModalJudge] = useState<Judge | null | undefined>(undefined)
  // undefined = closed, null = create new, Judge = edit

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Judges</h1>
        <button
          onClick={() => setModalJudge(null)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Judge
        </button>
      </div>

      {isPending && <Spinner label="Loading judges…" />}

      {isError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error instanceof Error ? error.message : 'Failed to load judges'}
        </p>
      )}

      {!isPending && !isError && (judges ?? []).length === 0 && (
        <p className="text-sm text-gray-400">No judges yet. Create one to get started.</p>
      )}

      <div className="space-y-3">
        {(judges ?? []).map((judge) => (
          <div
            key={judge.id}
            className="bg-white rounded-lg border border-gray-200 px-4 py-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">{judge.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    judge.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {judge.active ? 'active' : 'inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mb-2">{judge.target_model}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{judge.system_prompt}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setModalJudge(judge)}
                className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
              >
                Edit
              </button>
              {judge.active ? (
                <button
                  onClick={() => deactivate.mutate(judge.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => activate.mutate(judge.id)}
                  className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalJudge !== undefined && (
        <JudgeModal
          judge={modalJudge ?? undefined}
          onClose={() => setModalJudge(undefined)}
        />
      )}
    </div>
  )
}
