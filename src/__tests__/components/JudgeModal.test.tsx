import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JudgeModal } from '../../components/JudgeModal'
import type { Judge } from '../../types'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'judge-1',
          name: 'Test Judge',
          system_prompt: 'Grade strictly.',
          target_model: 'claude-haiku-4-5-20251001',
          active: true,
          created_at: new Date().toISOString(),
        },
        error: null,
      }),
    }),
  },
}))

const mockJudge: Judge = {
  id: 'judge-1',
  name: 'Test Judge',
  system_prompt: 'Grade strictly.',
  target_model: 'claude-haiku-4-5-20251001',
  active: true,
  created_at: new Date().toISOString(),
}

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('JudgeModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "New Judge" title when no judge prop passed', () => {
    renderWithQuery(<JudgeModal onClose={vi.fn()} />)
    expect(screen.getByText('New Judge')).toBeInTheDocument()
  })

  it('renders "Edit Judge" title when judge prop passed', () => {
    renderWithQuery(<JudgeModal judge={mockJudge} onClose={vi.fn()} />)
    expect(screen.getByText('Edit Judge')).toBeInTheDocument()
  })

  it('pre-fills fields when editing', () => {
    renderWithQuery(<JudgeModal judge={mockJudge} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Test Judge')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Grade strictly.')).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    renderWithQuery(<JudgeModal onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    renderWithQuery(<JudgeModal onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('requires name and system prompt to submit', async () => {
    renderWithQuery(<JudgeModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /create judge/i }))
    // HTML5 required validation prevents submit — form does not call mutation
    // Name field should be required
    const nameInput = screen.getByPlaceholderText(/strict accuracy judge/i)
    expect(nameInput).toBeRequired()
  })

  it('submits with filled form data', async () => {
    const onClose = vi.fn()
    renderWithQuery(<JudgeModal onClose={onClose} />)

    await userEvent.type(screen.getByPlaceholderText(/strict accuracy judge/i), 'My Judge')
    await userEvent.type(
      screen.getByPlaceholderText(/describe the evaluation criteria/i),
      'Pass if the answer is correct.'
    )
    await userEvent.click(screen.getByRole('button', { name: /create judge/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})
