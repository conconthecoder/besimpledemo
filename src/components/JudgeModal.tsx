import { useEffect, useState } from 'react'
import type { Judge } from '../types'
import { useCreateJudge, useUpdateJudge } from '../hooks/useJudges'

const MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'gpt-4o-mini',
  'gpt-4o',
  'gemini-2.0-flash',
]

interface Props {
  judge?: Judge
  onClose: () => void
}

export function JudgeModal({ judge, onClose }: Props) {
  const isEdit = !!judge
  const create = useCreateJudge()
  const update = useUpdateJudge()

  const [name, setName] = useState(judge?.name ?? '')
  const [systemPrompt, setSystemPrompt] = useState(judge?.system_prompt ?? '')
  const [targetModel, setTargetModel] = useState(judge?.target_model ?? MODELS[0])

  const isPending = create.isPending || update.isPending
  const error = create.error || update.error

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input = { name, system_prompt: systemPrompt, target_model: targetModel }
    if (isEdit) {
      update.mutate({ id: judge.id, input }, { onSuccess: onClose })
    } else {
      create.mutate(input, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Judge' : 'New Judge'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Strict Accuracy Judge"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
            <select
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              System Prompt / Rubric
            </label>
            <textarea
              required
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe the evaluation criteria. The judge will use this to determine pass / fail / inconclusive."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error instanceof Error ? error.message : 'Something went wrong'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create judge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
