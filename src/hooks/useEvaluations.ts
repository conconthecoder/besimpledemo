import { useQuery } from '@tanstack/react-query'
import { getEvaluations } from '../lib/evaluations'
import type { EvaluationFilters } from '../types'

export function useEvaluations(filters: EvaluationFilters = {}) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: () => getEvaluations(filters),
  })
}
