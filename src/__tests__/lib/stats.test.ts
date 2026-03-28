import { describe, it, expect } from 'vitest'
import type { EvaluationWithJoins } from '../../types'

// Pure stats computation extracted from ResultsPage for testability
function computeStats(evaluations: Pick<EvaluationWithJoins, 'verdict'>[]) {
  const total = evaluations.length
  if (total === 0) return null
  const pass = evaluations.filter((e) => e.verdict === 'pass').length
  const fail = evaluations.filter((e) => e.verdict === 'fail').length
  const inconclusive = evaluations.filter((e) => e.verdict === 'inconclusive').length
  return {
    total,
    pass,
    fail,
    inconclusive,
    passRate: Math.round((pass / total) * 100),
  }
}

describe('computeStats', () => {
  it('returns null for empty evaluations', () => {
    expect(computeStats([])).toBeNull()
  })

  it('computes 100% pass rate when all pass', () => {
    const stats = computeStats([
      { verdict: 'pass' },
      { verdict: 'pass' },
      { verdict: 'pass' },
    ])
    expect(stats?.passRate).toBe(100)
    expect(stats?.total).toBe(3)
    expect(stats?.pass).toBe(3)
    expect(stats?.fail).toBe(0)
  })

  it('computes 0% pass rate when all fail', () => {
    const stats = computeStats([{ verdict: 'fail' }, { verdict: 'fail' }])
    expect(stats?.passRate).toBe(0)
    expect(stats?.fail).toBe(2)
  })

  it('rounds pass rate correctly', () => {
    // 1 pass out of 3 = 33.33... → rounds to 33
    const stats = computeStats([
      { verdict: 'pass' },
      { verdict: 'fail' },
      { verdict: 'inconclusive' },
    ])
    expect(stats?.passRate).toBe(33)
    expect(stats?.inconclusive).toBe(1)
  })

  it('matches the spec example: 42% of 120', () => {
    const evals = [
      ...Array(50).fill({ verdict: 'pass' }),
      ...Array(70).fill({ verdict: 'fail' }),
    ]
    const stats = computeStats(evals)
    expect(stats?.total).toBe(120)
    expect(stats?.passRate).toBe(42)
  })
})
