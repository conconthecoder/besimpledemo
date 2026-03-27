import { useRef, useState } from 'react'
import { useIngestSubmissions } from '../hooks/useSubmissions'

export function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const { mutate, isPending, isSuccess, isError, error, data, reset } = useIngestSubmissions()

  function handleFile(file: File) {
    reset()
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        mutate(json)
      } catch {
        // Let the mutation error state handle display — but we need to surface parse errors too
        // Trigger via mutate with invalid shape so Zod catches it
        mutate(null)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="mb-8">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <p className="text-sm text-gray-600">
          {isPending
            ? 'Uploading…'
            : 'Drop a JSON file here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Follows sample_input.json shape</p>
      </div>

      {isSuccess && (
        <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          ✓ Imported {data.count} submission{data.count !== 1 ? 's' : ''}
        </p>
      )}
      {isError && (
        <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          ✗ {error instanceof Error ? error.message : 'Upload failed'}
        </p>
      )}
    </div>
  )
}
