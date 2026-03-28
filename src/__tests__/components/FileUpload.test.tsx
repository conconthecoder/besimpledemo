import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FileUpload } from '../../components/FileUpload'

// Mock the Supabase client so tests don't hit network
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the upload zone', () => {
    renderWithQuery(<FileUpload />)
    expect(screen.getByText(/drop a json file here/i)).toBeInTheDocument()
  })

  it('shows a friendly error for invalid JSON', async () => {
    renderWithQuery(<FileUpload />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['not valid json {{{'], 'bad.json', { type: 'application/json' })

    await userEvent.upload(input, badFile)

    await waitFor(() => {
      expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
    })
  })

  it('shows a friendly error when JSON has wrong shape', async () => {
    renderWithQuery(<FileUpload />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    // Valid JSON but wrong shape (object instead of array)
    const wrongShape = new File(['{"id":"sub_1"}'], 'wrong.json', { type: 'application/json' })

    await userEvent.upload(input, wrongShape)

    await waitFor(() => {
      // Zod error message surfaces in the error banner
      expect(screen.getByText(/✗/)).toBeInTheDocument()
    })
  })
})
