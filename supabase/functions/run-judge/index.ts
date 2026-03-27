import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'
import { z } from 'npm:zod'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VerdictSchema = z.object({
  verdict: z.enum(['pass', 'fail', 'inconclusive']),
  reasoning: z.string(),
})

const RequestSchema = z.object({
  submissionId: z.string(),
  questionId: z.string(),
  judgeId: z.string(),
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = RequestSchema.parse(await req.json())

    // Fetch judge
    const { data: judge, error: judgeErr } = await supabase
      .from('judges')
      .select('*')
      .eq('id', body.judgeId)
      .single()
    if (judgeErr || !judge) throw new Error(`Judge not found: ${body.judgeId}`)

    // Fetch question
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .eq('id', body.questionId)
      .single()
    if (qErr || !question) throw new Error(`Question not found: ${body.questionId}`)

    // Fetch answer
    const { data: answer } = await supabase
      .from('answers')
      .select('data')
      .eq('question_id', body.questionId)
      .single()

    const promptContent = buildPrompt(
      question.question_text as string,
      question.question_type as string,
      answer?.data ?? null
    )

    // Call LLM
    let verdict: z.infer<typeof VerdictSchema>

    const modelName = (judge.target_model as string) ?? 'claude-haiku-4-5-20251001'

    if (modelName.startsWith('claude-')) {
      verdict = await callAnthropic(modelName, judge.system_prompt as string, promptContent)
    } else if (modelName.startsWith('gpt-')) {
      verdict = await callOpenAI(modelName, judge.system_prompt as string, promptContent)
    } else {
      throw new Error(`Unsupported model: ${modelName}`)
    }

    // Persist evaluation
    const { error: evalErr } = await supabase.from('evaluations').insert({
      submission_id: body.submissionId,
      question_id: body.questionId,
      judge_id: body.judgeId,
      verdict: verdict.verdict,
      reasoning: verdict.reasoning,
    })
    if (evalErr) throw evalErr

    return new Response(JSON.stringify(verdict), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ verdict: 'inconclusive', reasoning: `Error: ${message}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildPrompt(questionText: string, questionType: string, answer: unknown): string {
  return `Question Type: ${questionType}
Question: ${questionText}
Answer: ${answer !== null ? JSON.stringify(answer, null, 2) : '(no answer provided)'}

Evaluate the answer against your rubric. Return your verdict and reasoning.`
}

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<z.infer<typeof VerdictSchema>> {
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
    output_config: {
      format: {
        type: 'json_schema',
        json_schema: {
          name: 'verdict',
          schema: {
            type: 'object',
            properties: {
              verdict: { type: 'string', enum: ['pass', 'fail', 'inconclusive'] },
              reasoning: { type: 'string' },
            },
            required: ['verdict', 'reasoning'],
            additionalProperties: false,
          },
        },
      },
    },
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return VerdictSchema.parse(JSON.parse(text))
}

async function callOpenAI(
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<z.infer<typeof VerdictSchema>> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'verdict',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              verdict: { type: 'string', enum: ['pass', 'fail', 'inconclusive'] },
              reasoning: { type: 'string' },
            },
            required: ['verdict', 'reasoning'],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 512,
    }),
  })

  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices[0].message.content
  return VerdictSchema.parse(JSON.parse(text))
}
