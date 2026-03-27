import { useQuery } from '@tanstack/react-query'
import { getEvaluations } from '../lib/evaluations'
import type { EvaluationFilters, EvaluationWithJoins } from '../types'

export function useEvaluations(filters: EvaluationFilters = {}) {
  return useQuery<EvaluationWithJoins[]>({
    queryKey: ['evaluations', filters],
    queryFn: () => getEvaluations(filters),
  })
}
