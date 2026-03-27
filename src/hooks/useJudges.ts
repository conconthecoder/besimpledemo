import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getJudges,
  createJudge,
  updateJudge,
  deactivateJudge,
  activateJudge,
  type CreateJudgeInput,
} from '../lib/judges'

export function useJudges() {
  return useQuery({
    queryKey: ['judges'],
    queryFn: getJudges,
  })
}

export function useCreateJudge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateJudgeInput) => createJudge(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['judges'] }),
  })
}

export function useUpdateJudge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateJudgeInput> }) =>
      updateJudge(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['judges'] }),
  })
}

export function useDeactivateJudge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateJudge(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['judges'] }),
  })
}

export function useActivateJudge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateJudge(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['judges'] }),
  })
}
