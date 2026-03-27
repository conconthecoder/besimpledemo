import { z } from 'zod'
import { supabase } from './supabase'

// Zod schema matching sample_input.json shape exactly
const QuestionDataSchema = z.object({
  id: z.string(),
  questionType: z.string(),
  questionText: z.string(),
})

const QuestionSchema = z.object({
  rev: z.number(),
  data: QuestionDataSchema,
})

export const SubmissionSchema = z.array(
  z.object({
    id: z.string(),
    queueId: z.string(),
    labelingTaskId: z.string(),
    createdAt: z.number(),
    questions: z.array(QuestionSchema),
    answers: z.record(z.string(), z.unknown()),
  })
)

export type RawSubmission = z.infer<typeof SubmissionSchema>[number]

export async function ingestSubmissions(raw: unknown): Promise<{ count: number }> {
  const parsed = SubmissionSchema.parse(raw)

  for (const sub of parsed) {
    // Upsert submission
    const { error: subError } = await supabase.from('submissions').upsert({
      id: sub.id,
      queue_id: sub.queueId,
      task_id: sub.labelingTaskId,
      created_at: sub.createdAt,
      raw: sub as unknown as Record<string, unknown>,
    })
    if (subError) throw subError

    // Upsert questions
    for (const q of sub.questions) {
      const { error: qError } = await supabase.from('questions').upsert({
        id: q.data.id,
        submission_id: sub.id,
        rev: q.rev,
        question_type: q.data.questionType,
        question_text: q.data.questionText,
      })
      if (qError) throw qError

      // Upsert answer if present
      const answer = sub.answers[q.data.id]
      if (answer !== undefined) {
        const { error: aError } = await supabase.from('answers').upsert({
          question_id: q.data.id,
          data: answer,
        })
        if (aError) throw aError
      }
    }
  }

  return { count: parsed.length }
}

export async function getSubmissionsByQueue(): Promise<Record<string, import('../types').Submission[]>> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).reduce<Record<string, import('../types').Submission[]>>((acc, sub) => {
    const key = sub.queue_id as string
    if (!acc[key]) acc[key] = []
    acc[key].push(sub as import('../types').Submission)
    return acc
  }, {})
}

export async function getQuestionsBySubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('*, answers(*)')
    .eq('submission_id', submissionId)
  if (error) throw error
  return data ?? []
}
