import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAssignmentsForQueue, setAssignments } from '../lib/judgeAssignments'

export function useAssignmentsForQueue(queueId: string) {
  return useQuery({
    queryKey: ['assignments', queueId],
    queryFn: () => getAssignmentsForQueue(queueId),
    enabled: !!queueId,
  })
}

export function useSetAssignments(queueId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, judgeIds }: { questionId: string; judgeIds: string[] }) =>
      setAssignments(queueId, questionId, judgeIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments', queueId] }),
  })
}
