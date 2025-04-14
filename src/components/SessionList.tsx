import { Session, CURRENCY_SYMBOL } from "@/types"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { Edit, Play, Trash, MoreHorizontal, Calendar, Clock, Banknote, CreditCard } from "lucide-react"

interface SessionListProps {
  sessions: Session[]
  variant?: 'default' | 'history'
  isSessionActive?: boolean
  onStart?: (sessionId: string) => void
  onCancel?: (sessionId: string) => void
  onEdit?: (sessionId: string) => void
  onViewDetails?: (sessionId: string) => void
}

// Sort sessions by scheduled time
const sortSessionsByTime = (sessions: Session[]) => {
  return [...sessions].sort((a, b) => {
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    
    // Extract hours from the time string (e.g., "14:00" -> 14)
    const getHour = (time: string): number => {
      return parseInt(time.split(':')[0], 10);
    };
    
    const hourA = getHour(a.scheduledTime);
    const hourB = getHour(b.scheduledTime);
    
    return hourA - hourB; // Numeric comparison
  });
};

export function SessionList({
  sessions,
  variant = 'default',
  isSessionActive = false,
  onStart,
  onCancel,
  onEdit,
  onViewDetails
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {variant === 'default' ? 'No upcoming sessions' : 'No finished sessions'}
      </div>
    )
  }

  // Sort sessions by date and time if showing upcoming sessions
  const sortedSessions = variant === 'default' ? sortSessionsByTime(sessions) : sessions;

  return (
    <div className="space-y-2">
      {sortedSessions.map(session => (
        <div key={session.id} className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow transition-shadow duration-200 text-sm">
          {/* Main content area */}
          <div className="p-2">
            {/* Top row with all key info */}
            <div className="flex flex-wrap justify-between items-center gap-y-1">
              {/* Left side: Name + time */}
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-1">
                  <div className="font-medium text-gray-900 truncate">{session.playerName}</div>
                  {session.isStudent && (
                    <span className="px-1 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                      S
                    </span>
                  )}
                </div>
                
                {/* Middle row: Time information */}
                <div className="flex items-center text-xs text-gray-600 mb-2">
                  <Clock className="h-3 w-3 text-blue-500 mr-1" />
                  {variant === 'default' ? (
                    <span className="truncate">
                      {session.scheduledTime} ({session.scheduledDuration}h)
                    </span>
                  ) : (
                    <span className="truncate">
                      {session.startTime && format(new Date(session.startTime), 'MMM d, HH:mm')} 
                      {session.endTime && ` - ${format(new Date(session.endTime), 'HH:mm')}`}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Right side: Cost + Actions */}
              <div className="flex items-center gap-1.5">
                <div className="font-medium text-gray-900 mr-1">
                  {session.cost.toFixed(2)} {CURRENCY_SYMBOL}
                </div>
                
                {variant === 'default' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onEdit?.(session.id)}
                      title="Edit session"
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={() => onStart?.(session.id)}
                      disabled={isSessionActive}
                      title={isSessionActive ? "Cannot start: Another session is active" : "Start session"}
                      className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onCancel?.(session.id)}
                      title="Cancel session"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </>
                )}
                
                {variant === 'history' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onViewDetails?.(session.id)}
                    className="h-6 w-6 p-0"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Additional items (optional, only shown if present) */}
            {session.items.length > 0 && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                <span className="font-medium">Items:</span>{' '}
                {session.items.map((item, index) => (
                  <span key={item.itemId}>
                    {item.quantity}x {item.itemId}
                    {index < session.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            
            {/* Payment method for finished sessions */}
            {variant === 'history' && session.paymentStatus === 'paid' && session.paymentMethod && (
              <div className="flex items-center text-xs text-gray-600 mb-2">
                {session.paymentMethod === 'cash' ? (
                  <>
                    <Banknote className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="truncate">Paid with cash</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="truncate">Paid with card</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 