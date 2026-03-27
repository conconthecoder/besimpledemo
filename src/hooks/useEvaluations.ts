import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getEvaluationStats } from '../lib/evaluations'
import type { EvaluationFilters } from '../types'

export function useEvaluations(filters: EvaluationFilters = {}) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: () => getEvaluations(filters),
  })
}

export function useEvaluationStats(filters: EvaluationFilters = {}) {
  return useQuery({
    queryKey: ['evaluations', 'stats', filters],
    queryFn: () => getEvaluationStats(filters),
  })
}
