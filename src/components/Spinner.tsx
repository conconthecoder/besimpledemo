interface Props {
  label?: string
}

export function Spinner({ label }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      {label && <span>{label}</span>}
    </div>
  )
}
