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
import { Ban, Coffee, ShoppingCart, CheckCircle, CreditCard, Banknote, AlertCircle, Award } from "lucide-react"
import { Session, ADDITIONAL_ITEMS, CURRENCY_SYMBOL, STUDENT_PRICE, DISCOUNT_CARD_AMOUNT, TIME_INTERVAL_OPTIONS } from "@/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
        <AlertDialogContent className="flex flex-col bg-background border-border max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl tracking-tight">
              End Session
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-2 text-sm">
                <span className="text-muted-foreground">Player:</span> <span className="font-medium">{session.playerName}</span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="overflow-hidden bg-card rounded-xl border border-border shadow-sm">
                  <div className="px-4 py-3 bg-muted/50 dark:bg-muted/30">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Duration</div>
                    <div>
                      <div className="text-2xl font-semibold text-foreground tracking-tight">
                        {getDuration()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <div className="flex items-center gap-2">
                          <span>Start: {session.startTime ? format(new Date(session.startTime), 'HH:mm') : 'Not started'}</span>
                          •
                          <span>End: {session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'Not ended'}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Booked for:</span> <span className="font-medium">{session.scheduledDuration} {session.scheduledDuration === 1 ? 'hour' : 'hours'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-foreground">
                            {session.hasSubscription ? "Subscription (Court Fee)" : session.type === "squash" ? (
                              session.isStudent ? "Student Rate" :
                                session.selectedTimeInterval === "day" ? "Day Rate (7-17)" :
                                  session.selectedTimeInterval === "evening" ? "Evening Rate (17-23)" :
                                    "Weekend Rate"
                            ) : (
                              "Table Tennis Rate"
                            )}
                          </div>
                          <div className="font-mono text-sm font-medium text-foreground">
                            {session.hasSubscription ? "Covered" : `${getRate().toFixed(2)} ${CURRENCY_SYMBOL}`}
                            {!session.hasSubscription && <span className="text-muted-foreground ml-1">/hour</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pl-2 text-sm">
                          <div className="text-muted-foreground">
                            {session.hasSubscription ?
                              "No Court Fee"
                              : `${session.scheduledDuration} ${session.scheduledDuration === 1 ? 'hour' : 'hours'} × ${getRate().toFixed(2)} ${CURRENCY_SYMBOL}`
                            }
                          </div>
                          <div className="font-mono font-medium text-foreground">
                            {session.hasSubscription ? `0.00 ${CURRENCY_SYMBOL}` : (getRate() * session.scheduledDuration).toFixed(2) + ` ${CURRENCY_SYMBOL}`}
                          </div>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-border space-y-2">
                          {items.some(item => {
                            const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                            return itemDef?.category === 'equipment' && item.quantity > 0;
                          }) && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground flex items-center">
                                  <ShoppingCart className="h-3 w-3 mr-1 text-muted-foreground" />
                                  Equipment
                                </div>
                                {items.map((item) => {
                                  const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                  if (!itemDef || itemDef.category !== 'equipment' || item.quantity === 0) return null
                                  return (
                                    <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>{itemDef.name}</span>
                                        <span className="text-muted-foreground text-xs">×</span>
                                        <span className="text-foreground">{item.quantity}</span>
                                      </div>
                                      <div className="font-mono text-sm font-medium text-foreground">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
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
                                <div className="text-xs font-medium text-muted-foreground flex items-center">
                                  <Coffee className="h-3 w-3 mr-1 text-muted-foreground" />
                                  Refreshments
                                </div>
                                {items.map((item) => {
                                  const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                  if (!itemDef || itemDef.category !== 'refreshment' || item.quantity === 0) return null
                                  return (
                                    <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>{itemDef.name}</span>
                                        <span className="text-muted-foreground text-xs">×</span>
                                        <span className="text-foreground">{item.quantity}</span>
                                      </div>
                                      <div className="font-mono text-sm font-medium text-foreground">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add discount cards section if applicable */}
                  {session.discountCards > 0 && (
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-border">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          {session.discountCards === 1 ? 'Discount Card Applied' : `${session.discountCards} Discount Cards Applied`}
                        </div>
                        <div className="font-mono text-sm font-medium text-blue-700 dark:text-blue-400">
                          -{(session.discountCards * DISCOUNT_CARD_AMOUNT).toFixed(2)} {CURRENCY_SYMBOL}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add subscription info if applicable */}
                  {session.hasSubscription && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-t border-border">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" />
                          <span>Subscription Active</span>
                        </div>
                        <div className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                          No Court Fee
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 bg-muted/50 dark:bg-muted/30 border-t border-border">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-foreground">Total Amount</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400 font-mono tracking-tight">
                        {getTotalCost().toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  Choose how you would like to end this session:
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col space-y-2">
            <AlertDialogAction
              onClick={() => onCompleteWithPayment?.('cash')}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white font-medium"
            >
              <Banknote className="w-4 h-4" />
              Pay with Cash
              <span className="text-xs text-yellow-100/90 font-normal">
                ({getTotalCost().toFixed(2)} {CURRENCY_SYMBOL})
              </span>
            </AlertDialogAction>

            <AlertDialogAction
              onClick={() => onCompleteWithPayment?.('card')}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium"
            >
              <CreditCard className="w-4 h-4" />
              Pay with Card
              <span className="text-xs text-green-100/90 font-normal">
                ({getTotalCost().toFixed(2)} {CURRENCY_SYMBOL})
              </span>
            </AlertDialogAction>

            <AlertDialogCancel
              onClick={onCancelWithoutPayment}
              className="w-full flex items-center justify-center gap-2 text-foreground hover:text-foreground hover:bg-muted font-medium"
            >
              <Ban className="w-4 h-4" />
              Cancel Session
              <span className="text-xs text-muted-foreground font-normal">(No charge)</span>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="flex flex-col bg-background border-border max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl tracking-tight">
              Session Details
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-2 text-sm">
                <span className="text-muted-foreground">Player:</span> <span className="font-medium">{session.playerName}</span>
                {session.contactInfo && (
                  <p className="text-sm text-muted-foreground mt-1">{session.contactInfo}</p>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {/* Session time info */}
                <div className="overflow-hidden bg-card rounded-xl border border-border shadow-sm">
                  <div className="px-4 py-3 bg-muted/50 dark:bg-muted/30">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Duration</div>
                    <div>
                      <div className="text-2xl font-semibold text-foreground tracking-tight">
                        {getDuration()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <div className="flex items-center gap-2">
                          <span>Start: {session.startTime ? format(new Date(session.startTime), 'HH:mm') : 'Not started'}</span>
                          •
                          <span>End: {session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'Not ended'}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Booked for:</span> <span className="font-medium">{session.scheduledDuration} {session.scheduledDuration === 1 ? 'hour' : 'hours'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-foreground">
                            {session.hasSubscription ? "Subscription (Court Fee)" : session.type === "squash" ? (
                              session.isStudent ? "Student Rate" :
                                session.selectedTimeInterval === "day" ? "Day Rate (7-17)" :
                                  session.selectedTimeInterval === "evening" ? "Evening Rate (17-23)" :
                                    "Weekend Rate"
                            ) : (
                              "Table Tennis Rate"
                            )}
                          </div>
                          <div className="font-mono text-sm font-medium text-foreground">
                            {session.hasSubscription ? "Covered" : `${getRate().toFixed(2)} ${CURRENCY_SYMBOL}`}
                            {!session.hasSubscription && <span className="text-muted-foreground ml-1">/hour</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pl-2 text-sm">
                          <div className="text-muted-foreground">
                            {session.hasSubscription ?
                              "No Court Fee"
                              : `${session.scheduledDuration} ${session.scheduledDuration === 1 ? 'hour' : 'hours'} × ${getRate().toFixed(2)} ${CURRENCY_SYMBOL}`
                            }
                          </div>
                          <div className="font-mono font-medium text-foreground">
                            {session.hasSubscription ? `0.00 ${CURRENCY_SYMBOL}` : (getRate() * session.scheduledDuration).toFixed(2) + ` ${CURRENCY_SYMBOL}`}
                          </div>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-border space-y-2">
                          {items.some(item => {
                            const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                            return itemDef?.category === 'equipment' && item.quantity > 0;
                          }) && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground flex items-center">
                                  <ShoppingCart className="h-3 w-3 mr-1 text-muted-foreground" />
                                  Equipment
                                </div>
                                {items.map((item) => {
                                  const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                  if (!itemDef || itemDef.category !== 'equipment' || item.quantity === 0) return null
                                  return (
                                    <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>{itemDef.name}</span>
                                        <span className="text-muted-foreground text-xs">×</span>
                                        <span className="text-foreground">{item.quantity}</span>
                                      </div>
                                      <div className="font-mono text-sm font-medium text-foreground">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
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
                                <div className="text-xs font-medium text-muted-foreground flex items-center">
                                  <Coffee className="h-3 w-3 mr-1 text-muted-foreground" />
                                  Refreshments
                                </div>
                                {items.map((item) => {
                                  const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
                                  if (!itemDef || itemDef.category !== 'refreshment' || item.quantity === 0) return null
                                  return (
                                    <div key={item.itemId} className="flex justify-between items-center py-0.5 pl-2">
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>{itemDef.name}</span>
                                        <span className="text-muted-foreground text-xs">×</span>
                                        <span className="text-foreground">{item.quantity}</span>
                                      </div>
                                      <div className="font-mono text-sm font-medium text-foreground">{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add discount cards section if applicable */}
                  {session.discountCards > 0 && (
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-border">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          {session.discountCards === 1 ? 'Discount Card Applied' : `${session.discountCards} Discount Cards Applied`}
                        </div>
                        <div className="font-mono text-sm font-medium text-blue-700 dark:text-blue-400">
                          -{(session.discountCards * DISCOUNT_CARD_AMOUNT).toFixed(2)} {CURRENCY_SYMBOL}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add subscription info if applicable */}
                  {session.hasSubscription && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-t border-border">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" />
                          <span>Subscription Active</span>
                        </div>
                        <div className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                          No Court Fee
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 bg-muted/50 dark:bg-muted/30 border-t border-border">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-foreground">Total Amount</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400 font-mono tracking-tight">
                        {getTotalCost().toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                  Session completed
                </div>

                {/* Payment Method Badge (if paid) */}
                {session.paymentStatus === 'paid' && session.paymentMethod && (
                  <div className="flex justify-center items-center">
                    <div className={cn(
                      "mt-1 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 font-medium",
                      session.paymentMethod === 'cash'
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    )}>
                      {session.paymentMethod === 'cash' ? (
                        <>
                          <Banknote className="h-3.5 w-3.5" />
                          Paid with Cash
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          Paid with Card
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancelation Badge (if canceled) */}
                {session.paymentStatus === 'canceled' && (
                  <div className="flex justify-center items-center">
                    <div className="mt-1 px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-sm flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Session Canceled
                    </div>
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