import { FileUpload } from '../components/FileUpload'
import { QueueCard } from '../components/QueueCard'
import { Spinner } from '../components/Spinner'
import { useSubmissionsByQueue } from '../hooks/useSubmissions'
import { useJudges } from '../hooks/useJudges'

export function QueuesPage() {
  const { data: queueMap, isPending, isError, error } = useSubmissionsByQueue()
  const { data: allJudges = [] } = useJudges()
  const activeJudges = allJudges.filter((j) => j.active)
  const queues = Object.entries(queueMap ?? {})

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Queues</h1>

      <FileUpload />

      {isPending && <Spinner label="Loading submissions…" />}

      {isError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error instanceof Error ? error.message : 'Failed to load submissions'}
        </p>
      )}

      {!isPending && !isError && queues.length === 0 && (
        <p className="text-sm text-gray-400">No submissions yet. Upload a JSON file above.</p>
      )}

      {queues.map(([queueId, submissions]) => (
        <QueueCard
          key={queueId}
          queueId={queueId}
          submissions={submissions}
          activeJudges={activeJudges}
        />
      ))}
    </div>
  )
}
