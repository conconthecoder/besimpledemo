import { useState } from 'react'
import { useEvaluations, useEvaluationStats } from '../hooks/useEvaluations'
import { useJudges } from '../hooks/useJudges'
import { MultiSelect } from '../components/MultiSelect'
import { Spinner } from '../components/Spinner'
import type { EvaluationFilters, Verdict } from '../types'

const VERDICT_OPTIONS = [
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'inconclusive', label: 'Inconclusive' },
]

const VERDICT_STYLES: Record<Verdict, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  inconclusive: 'bg-yellow-100 text-yellow-700',
}

export function ResultsPage() {
  const [selectedJudgeIds, setSelectedJudgeIds] = useState<string[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [selectedVerdicts, setSelectedVerdicts] = useState<string[]>([])

  const filters: EvaluationFilters = {
    judgeIds: selectedJudgeIds.length > 0 ? selectedJudgeIds : undefined,
    questionIds: selectedQuestionIds.length > 0 ? selectedQuestionIds : undefined,
    verdicts: selectedVerdicts.length > 0 ? (selectedVerdicts as Verdict[]) : undefined,
  }

  const { data: evaluations = [], isPending, isError, error } = useEvaluations(filters)
  const { data: stats } = useEvaluationStats(filters)
  const { data: judges = [] } = useJudges()

  const judgeOptions = judges.map((j) => ({ value: j.id, label: j.name }))

  // Derive unique questions from loaded evaluations for question filter
  const questionOptions = Array.from(
    new Map(
      evaluations.map((e) => {
        const q = (e as unknown as Record<string, unknown>).questions as { question_text: string } | null
        return [e.question_id, { value: e.question_id, label: q?.question_text ?? e.question_id }]
      })
    ).values()
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Results</h1>

      {/* Aggregate stat */}
      {stats && stats.total > 0 && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-2xl font-bold text-gray-900">
            {stats.passRate}%{' '}
            <span className="text-base font-normal text-gray-500">
              pass of {stats.total} evaluation{stats.total !== 1 ? 's' : ''}
            </span>
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-700">{stats.pass} pass</span>
            <span className="text-red-600">{stats.fail} fail</span>
            <span className="text-yellow-600">{stats.inconclusive} inconclusive</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <MultiSelect
          label="Judge"
          options={judgeOptions}
          selected={selectedJudgeIds}
          onChange={setSelectedJudgeIds}
        />
        <MultiSelect
          label="Question"
          options={questionOptions}
          selected={selectedQuestionIds}
          onChange={setSelectedQuestionIds}
        />
        <MultiSelect
          label="Verdict"
          options={VERDICT_OPTIONS}
          selected={selectedVerdicts}
          onChange={setSelectedVerdicts}
        />
      </div>

      {isPending && <Spinner label="Loading evaluations…" />}

      {isError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error instanceof Error ? error.message : 'Failed to load evaluations'}
        </p>
      )}

      {!isPending && !isError && evaluations.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No evaluations yet.</p>
          <p className="text-xs mt-1">Run AI Judges from the Queues page to generate results.</p>
        </div>
      )}

      {evaluations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submission</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Question</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verdict</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reasoning</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {evaluations.map((evaluation) => {
                const raw = evaluation as unknown as Record<string, unknown>
                const judgeName = (raw.judges as { name: string } | null)?.name ?? evaluation.judge_id
                const questionText = (raw.questions as { question_text: string } | null)?.question_text ?? evaluation.question_id
                return (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">
                      {evaluation.submission_id}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                      <span className="line-clamp-2">{questionText}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{judgeName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VERDICT_STYLES[evaluation.verdict]}`}>
                        {evaluation.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[300px]">
                      <span className="line-clamp-2">{evaluation.reasoning}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(evaluation.created_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
