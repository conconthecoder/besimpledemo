import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelect({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  function clearAll() {
    onChange([])
  }

  const activeCount = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50 ${
          activeCount > 0 ? 'border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
            {activeCount}
          </span>
        )}
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No options</p>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  selected.includes(opt.value)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300'
                }`}
              >
                {selected.includes(opt.value) && '✓'}
              </span>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
          {activeCount > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={clearAll}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
