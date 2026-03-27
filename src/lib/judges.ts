import { supabase } from './supabase'
import type { Judge } from '../types'

export async function getJudges(): Promise<Judge[]> {
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Judge[]
}

export interface CreateJudgeInput {
  name: string
  system_prompt: string
  target_model: string
}

export async function createJudge(input: CreateJudgeInput): Promise<Judge> {
  const { data, error } = await supabase
    .from('judges')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Judge
}

export async function updateJudge(id: string, input: Partial<CreateJudgeInput>): Promise<Judge> {
  const { data, error } = await supabase
    .from('judges')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Judge
}

export async function deactivateJudge(id: string): Promise<void> {
  const { error } = await supabase
    .from('judges')
    .update({ active: false })
    .eq('id', id)
  if (error) throw error
}

export async function activateJudge(id: string): Promise<void> {
  const { error } = await supabase
    .from('judges')
    .update({ active: true })
    .eq('id', id)
  if (error) throw error
}
