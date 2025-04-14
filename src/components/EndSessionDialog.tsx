import React from "react"
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Ban, Check, Coffee, ShoppingCart, Clock, CheckCircle, CircleDollarSign, CreditCard, Banknote } from "lucide-react"
import { Session, ADDITIONAL_ITEMS, CURRENCY_SYMBOL, STUDENT_PRICE, TIME_INTERVAL_OPTIONS } from "@/types"
import { format } from "date-fns"

interface EndSessionDialogProps {
  session: Session
  currentCost?: number
  elapsedTime?: number
  items?: { itemId: string; quantity: number }[]
  getSessionRate?: () => number
  onCompleteWithPayment?: (paymentMethod: 'cash' | 'card') => void
  onCancelWithoutPayment?: () => void
  mode?: 'end' | 'details'
  isOpen?: boolean
  onClose?: () => void
}

export function EndSessionDialog({ 
  session,
  currentCost,
  elapsedTime,
  items = session.items,
  getSessionRate,
  onCompleteWithPayment, 
  onCancelWithoutPayment,
  mode = 'end',
  isOpen,
  onClose
}: EndSessionDialogProps) {
  
  // Calculate duration in hours and minutes for details mode
  const getDuration = () => {
    if (mode === 'end' && elapsedTime) {
      // For active sessions
      return `${Math.floor(elapsedTime / 3600)}h ${Math.floor((elapsedTime % 3600) / 60)}m`
    } else if (session.startTime && session.endTime) {
      // For finished sessions
      const start = new Date(session.startTime)
      const end = new Date(session.endTime)
      const durationMs = end.getTime() - start.getTime()
      const hours = Math.floor(durationMs / (1000 * 60 * 60))
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${hours}h ${minutes}m`
    }
    
    return `${session.scheduledDuration}h (scheduled)`
  }
  
  // Get rate for either mode
  const getRate = () => {
    if (mode === 'end' && getSessionRate) {
      return getSessionRate()
    }
    
    // Use the same rate calculation logic for details mode as used in active session
    if (session.isStudent && session.selectedTimeInterval === 'day') {
      return STUDENT_PRICE
    }
    
    if (session.type === "table-tennis") {
      return session.hourlyRate
    }
    
    // For squash courts, find the appropriate rate from TIME_INTERVAL_OPTIONS
    const option = TIME_INTERVAL_OPTIONS.find(opt => opt.value === session.selectedTimeInterval)
    return option ? option.price : session.hourlyRate
  }
  
  // Calculate total cost for either mode
  const getTotalCost = () => {
    if (mode === 'end' && currentCost) {
      return currentCost
    }
    return session.cost
  }
  
  // Conditionally render the dialog based on mode
  return (
    mode === 'end' ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive"
            className="w-full bg-red-500 hover:bg-red-600 transition-all duration-300 h-10 mt-2"
          >
            End Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl tracking-tight">
              End Session
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-2 text-sm">
                <span className="text-gray-600">Player:</span> <span className="font-medium">{session.playerName}</span>
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
                  <div className="px-4 py-3 bg-gray-50/50">
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">Duration</div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {getDuration()}
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        <div className="flex items-center gap-2">
                          <span>Start: {session.startTime ? format(new Date(session.startTime), 'HH:mm') : 'Not started'}</span>
                          •
                          <span>End: {session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'Not ended'}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-gray-500">Booked for:</span> <span className="font-medium">{session.scheduledDuration} {session.scheduledDuration === 1 ? 'hour' : 'hours'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-gray-700">
                            {session.type === "squash" ? (
                              session.isStudent ? "Student Rate" : 
                              session.selectedTimeInterval === "day" ? "Day Rate (7-17)" :
                              session.selectedTimeInterval === "evening" ? "Evening Rate (17-23)" : 
                              "Weekend Rate"
                            ) : (
                              "Table Tennis Rate"
                            )}
                          </div>
                          <div className="font-mono text-sm font-medium text-gray-900">
                            {getRate().toFixed(2)} {CURRENCY_SYMBOL}
                            <span className="text-gray-500 ml-1">/hour</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pl-2 text-sm">
                          <div className="text-gray-600">
                            {session.scheduledDuration} {session.scheduledDuration === 1 ? 'hour' : 'hours'} × {getRate().toFixed(2)} {CURRENCY_SYMBOL}
                          </div>
                          <div className="font-mono font-medium text-gray-900">
                            {(getRate() * session.scheduledDuration).toFixed(2)} {CURRENCY_SYMBOL}
                          </div>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                          {items.some(item => {
                            const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                            return itemDef?.category === 'equipment' && item.quantity > 0;
                          }) && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-500 flex items-center">
                                <ShoppingCart className="h-3 w-3 mr-1 text-gray-400" />
                                Equipment
                              </div>
                              {items.map((item) => {
                                const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                if (!itemDef || itemDef.category !== 'equipment' || item.quantity === 0) return null
                                return (
                                  <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <span>{itemDef.name}</span>
                                      <span className="text-gray-400 text-xs">×</span>
                                      <span className="text-gray-900">{item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-sm font-medium text-gray-900">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          {items.some(item => {
                            const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                            return itemDef?.category === 'refreshment' && item.quantity > 0;
                          }) && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-500 flex items-center">
                                <Coffee className="h-3 w-3 mr-1 text-gray-400" />
                                Refreshments
                              </div>
                              {items.map((item) => {
                                const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                if (!itemDef || itemDef.category !== 'refreshment' || item.quantity === 0) return null
                                return (
                                  <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <span>{itemDef.name}</span>
                                      <span className="text-gray-400 text-xs">×</span>
                                      <span className="text-gray-900">{item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-sm font-medium text-gray-900">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-gray-900">Total Amount</div>
                      <div className="text-xl font-bold text-green-600 font-mono tracking-tight">
                        {getTotalCost().toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 text-center">
                  Choose how you would like to end this session:
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col space-y-2">
            <AlertDialogAction
              onClick={() => onCompleteWithPayment?.('cash')}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
            >
              <Banknote className="w-4 h-4" />
              Pay with Cash
              <span className="text-xs text-yellow-100/90 font-normal">
                ({getTotalCost().toFixed(2)} {CURRENCY_SYMBOL})
              </span>
            </AlertDialogAction>
            
            <AlertDialogAction
              onClick={() => onCompleteWithPayment?.('card')}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium"
            >
              <CreditCard className="w-4 h-4" />
              Pay with Card
              <span className="text-xs text-green-100/90 font-normal">
                ({getTotalCost().toFixed(2)} {CURRENCY_SYMBOL})
              </span>
            </AlertDialogAction>
            
            <AlertDialogCancel
              onClick={onCancelWithoutPayment}
              className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 font-medium"
            >
              <Ban className="w-4 h-4" />
              Cancel Session
              <span className="text-xs text-gray-500 font-normal">(No charge)</span>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl tracking-tight">
              Session Details
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-2 text-sm">
                <span className="text-gray-600">Player:</span> <span className="font-medium">{session.playerName}</span>
                {session.contactInfo && (
                  <p className="text-sm text-gray-500 mt-1">{session.contactInfo}</p>
                )}
              </div>
              
              <div className="mt-4 space-y-4">
                {/* Session time info */}
                <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
                  <div className="px-4 py-3 bg-gray-50/50">
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">Duration</div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {getDuration()}
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        <div className="flex items-center gap-2">
                          <span>Start: {session.startTime ? format(new Date(session.startTime), 'HH:mm') : 'Not started'}</span>
                          •
                          <span>End: {session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'Not ended'}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-gray-500">Booked for:</span> <span className="font-medium">{session.scheduledDuration} {session.scheduledDuration === 1 ? 'hour' : 'hours'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-gray-700">
                            {session.type === "squash" ? (
                              session.isStudent ? "Student Rate" : 
                              session.selectedTimeInterval === "day" ? "Day Rate (7-17)" :
                              session.selectedTimeInterval === "evening" ? "Evening Rate (17-23)" : 
                              "Weekend Rate"
                            ) : (
                              "Table Tennis Rate"
                            )}
                          </div>
                          <div className="font-mono text-sm font-medium text-gray-900">
                            {getRate().toFixed(2)} {CURRENCY_SYMBOL}
                            <span className="text-gray-500 ml-1">/hour</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pl-2 text-sm">
                          <div className="text-gray-600">
                            {session.scheduledDuration} {session.scheduledDuration === 1 ? 'hour' : 'hours'} × {getRate().toFixed(2)} {CURRENCY_SYMBOL}
                          </div>
                          <div className="font-mono font-medium text-gray-900">
                            {(getRate() * session.scheduledDuration).toFixed(2)} {CURRENCY_SYMBOL}
                          </div>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                          {items.some(item => {
                            const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                            return itemDef?.category === 'equipment' && item.quantity > 0;
                          }) && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-500 flex items-center">
                                <ShoppingCart className="h-3 w-3 mr-1 text-gray-400" />
                                Equipment
                              </div>
                              {items.map((item) => {
                                const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                if (!itemDef || itemDef.category !== 'equipment' || item.quantity === 0) return null
                                return (
                                  <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <span>{itemDef.name}</span>
                                      <span className="text-gray-400 text-xs">×</span>
                                      <span className="text-gray-900">{item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-sm font-medium text-gray-900">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          {items.some(item => {
                            const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                            return itemDef?.category === 'refreshment' && item.quantity > 0;
                          }) && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-500 flex items-center">
                                <Coffee className="h-3 w-3 mr-1 text-gray-400" />
                                Refreshments
                              </div>
                              {items.map((item) => {
                                const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                if (!itemDef || itemDef.category !== 'refreshment' || item.quantity === 0) return null
                                return (
                                  <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <span>{itemDef.name}</span>
                                      <span className="text-gray-400 text-xs">×</span>
                                      <span className="text-gray-900">{item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-sm font-medium text-gray-900">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-gray-900">Total Amount</div>
                      <div className="text-xl font-bold text-green-600 font-mono tracking-tight">
                        {session.cost.toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 mr-1"
                        style={{ 
                          backgroundColor: session.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                          color: session.paymentStatus === 'paid' ? '#166534' : '#b91c1c'
                        }}
                      >
                        {session.paymentStatus === 'paid' ? <Check className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                        {session.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                      
                      {session.paymentStatus === 'paid' && session.paymentMethod && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{ 
                            backgroundColor: session.paymentMethod === 'cash' ? '#fef9c3' : '#f0f9ff',
                            color: session.paymentMethod === 'cash' ? '#854d0e' : '#0c4a6e'
                          }}
                        >
                          {session.paymentMethod === 'cash' 
                            ? <Banknote className="h-3 w-3" /> 
                            : <CreditCard className="h-3 w-3" />
                          }
                          {session.paymentMethod === 'cash' ? 'Cash' : 'Card'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Session completed
                </div>

                {/* Additional notes if any */}
                {session.notes && (
                  <div className="border-t pt-2 text-sm">
                    <div className="font-medium">Notes</div>
                    <p className="text-gray-700">{session.notes}</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 sm:mt-6">
            <AlertDialogAction
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  )
} 