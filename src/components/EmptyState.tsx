import { ReactNode } from "react"

interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed rounded-lg bg-muted/50 dark:bg-muted/20 border-border">
      <p className="text-muted-foreground text-center mb-4">{message}</p>
      {action}
    </div>
  )
} 