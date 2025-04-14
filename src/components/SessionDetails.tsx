import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Session, ADDITIONAL_ITEMS, CURRENCY_SYMBOL } from "@/types"
import { format } from "date-fns"
import { Clock, CheckCircle, CircleDollarSign } from "lucide-react"

interface SessionDetailsProps {
  session: Session
  isOpen: boolean
  onClose: () => void
}

export function SessionDetails({ session, isOpen, onClose }: SessionDetailsProps) {
  // Calculate duration in hours and minutes
  const getDuration = () => {
    if (session.startTime && session.endTime) {
      const start = new Date(session.startTime)
      const end = new Date(session.endTime)
      const durationMs = end.getTime() - start.getTime()
      const hours = Math.floor(durationMs / (1000 * 60 * 60))
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${hours}h ${minutes}m`
    }
    
    return `${session.scheduledDuration}h (scheduled)`
  }
  
  // Get additional items with names
  const getItemsWithDetails = () => {
    return session.items.map(item => {
      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId)
      return {
        ...item,
        name: itemDef?.name || 'Unknown item',
        price: itemDef?.price || 0
      }
    })
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Player info */}
          <div>
            <h3 className="font-medium text-lg">{session.playerName}</h3>
            {session.contactInfo && (
              <p className="text-sm text-gray-500">{session.contactInfo}</p>
            )}
          </div>
          
          {/* Session time info */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">Session Time</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-500">Start</div>
                <div>
                  {session.startTime ? 
                    format(new Date(session.startTime), 'MMM d, yyyy h:mm a') : 
                    'Not started'}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">End</div>
                <div>
                  {session.endTime ? 
                    format(new Date(session.endTime), 'MMM d, yyyy h:mm a') : 
                    'Not ended'}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Duration</div>
                <div>{getDuration()}</div>
              </div>
              
              <div>
                <div className="text-gray-500">Status</div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Completed
                </div>
              </div>
            </div>
          </div>
          
          {/* Cost breakdown */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center text-sm">
              <CircleDollarSign className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">Cost Breakdown</span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Court rental ({session.scheduledDuration} hours)</span>
                <span className="font-medium">{(session.cost - session.items.reduce((sum, item) => {
                  const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId)
                  return sum + (itemDef?.price || 0) * item.quantity
                }, 0)).toFixed(2)} {CURRENCY_SYMBOL}</span>
              </div>
              
              {getItemsWithDetails().map(item => (
                <div key={item.itemId} className="flex justify-between text-gray-700">
                  <span>{item.name} ({item.quantity}x)</span>
                  <span>{(item.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</span>
                </div>
              ))}
              
              <div className="border-t pt-1 mt-1 flex justify-between font-medium">
                <span>Total</span>
                <span>{session.cost.toFixed(2)} {CURRENCY_SYMBOL}</span>
              </div>
              
              <div className="text-right text-xs text-green-600 font-medium">
                {session.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </div>
            </div>
          </div>
          
          {/* Additional notes if any */}
          {session.notes && (
            <div className="border-t pt-2 text-sm">
              <div className="font-medium">Notes</div>
              <p className="text-gray-700">{session.notes}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 