import { describe, it, expect } from 'vitest'
import { SubmissionSchema } from '../../lib/submissions'

const validSubmission = {
  id: 'sub_1',
  queueId: 'queue_1',
  labelingTaskId: 'task_1',
  createdAt: 1690000000000,
  questions: [
    {
      rev: 1,
      data: {
        id: 'q_template_1',
        questionType: 'single_choice_with_reasoning',
        questionText: 'Is the sky blue?',
      },
    },
  ],
  answers: {
    q_template_1: { choice: 'yes', reasoning: 'Observed on a clear day.' },
  },
}

describe('SubmissionSchema', () => {
  it('parses the spec sample_input.json shape', () => {
    const result = SubmissionSchema.parse([validSubmission])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sub_1')
    expect(result[0].queueId).toBe('queue_1')
    expect(result[0].questions[0].data.questionText).toBe('Is the sky blue?')
  })

  it('parses multiple submissions', () => {
    const input = [validSubmission, { ...validSubmission, id: 'sub_2', queueId: 'queue_2' }]
    const result = SubmissionSchema.parse(input)
    expect(result).toHaveLength(2)
    expect(result[1].id).toBe('sub_2')
  })

  it('throws on missing required fields', () => {
    expect(() => SubmissionSchema.parse([{ id: 'sub_1' }])).toThrow()
  })

  it('throws on non-array input', () => {
    expect(() => SubmissionSchema.parse(validSubmission)).toThrow()
  })

  it('throws on null input', () => {
    expect(() => SubmissionSchema.parse(null)).toThrow()
  })

  it('throws when createdAt is a string instead of number', () => {
    expect(() =>
      SubmissionSchema.parse([{ ...validSubmission, createdAt: '2023-01-01' }])
    ).toThrow()
  })

  it('throws when questions is missing', () => {
    const { questions: _q, ...noQuestions } = validSubmission
    expect(() => SubmissionSchema.parse([noQuestions])).toThrow()
  })

  it('accepts empty answers object', () => {
    const result = SubmissionSchema.parse([{ ...validSubmission, answers: {} }])
    expect(result[0].answers).toEqual({})
  })

  it('accepts answers with arbitrary value shapes', () => {
    const result = SubmissionSchema.parse([
      { ...validSubmission, answers: { q1: 'free text', q2: { nested: true } } },
    ])
    expect(result[0].answers['q1']).toBe('free text')
  })
})
