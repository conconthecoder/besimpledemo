import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ingestSubmissions, getSubmissionsByQueue } from '../lib/submissions'

export function useSubmissionsByQueue() {
  return useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissionsByQueue,
  })
}

export function useIngestSubmissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (raw: unknown) => ingestSubmissions(raw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}
