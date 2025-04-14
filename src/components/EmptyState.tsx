import { ReactNode } from "react"

interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed rounded-lg bg-gray-50">
      <p className="text-gray-500 text-center mb-4">{message}</p>
      {action}
    </div>
  )
} 