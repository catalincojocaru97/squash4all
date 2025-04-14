import React, { useState, useEffect, useCallback } from "react"
import { Session, CURRENCY_SYMBOL, ADDITIONAL_ITEMS, STUDENT_PRICE, DISCOUNT_CARD_AMOUNT, TIME_INTERVAL_OPTIONS } from "@/types"
import {
  CircleDollarSign,
  ShoppingCart,
  Coffee,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Award,
  CreditCard,
  User,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Define time intervals for selection with enhanced styling
// Moved to types/index.ts
// const TIME_INTERVAL_OPTIONS = [...]; 

interface ActiveSessionProps {
  session: Session
  onAddItems: (items: { itemId: string; quantity: number }[]) => void
  onUpdateSessionDetails: (updates: { isStudent?: boolean; selectedTimeInterval?: string; discountCards?: number }) => void
}

export function ActiveSession({ session, onAddItems, onUpdateSessionDetails }: ActiveSessionProps) {
  const [time, setTime] = useState<number>(session.actualDuration || 0)
  const [currentCost, setCurrentCost] = useState<number>(session.cost)
  const [items, setItems] = useState(session.items)
  const [discountCards, setDiscountCards] = useState(session.discountCards || 0)

  // Collapsible sections
  const [additionalItemsExpanded, setAdditionalItemsExpanded] = useState(false)
  const [refreshmentItemsExpanded, setRefreshmentItemsExpanded] = useState(false)
  const [rateOptionsExpanded, setRateOptionsExpanded] = useState(false)
  const [discountCardsExpanded, setDiscountCardsExpanded] = useState(false)

  // Format time in hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }

  // Calculate cost based on session rate and rental hours (not elapsed time)
  const getSessionRate = useCallback(() => {
    // Get base rate from session
    const baseRate = session.isStudent ? STUDENT_PRICE :
      session.type === "squash" ?
        (session.selectedTimeInterval === "day" ? 50 :
          session.selectedTimeInterval === "evening" ? 80 :
            session.selectedTimeInterval === "weekend" ? 80 : 50) :
        session.hourlyRate

    return baseRate
  }, [session.isStudent, session.selectedTimeInterval, session.type, session.hourlyRate])

  // Calculate total cost
  const getSessionCost = useCallback(() => {
    // Calculate based on scheduled duration, not elapsed time
    const courtCost = getSessionRate() * session.scheduledDuration

    // Add additional items cost
    const additionalCost = items.reduce((total, item) => {
      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId)
      return total + (itemDef?.price || 0) * item.quantity
    }, 0)

    // Apply discount for card holders (multiple cards)
    const baseTotal = courtCost + additionalCost
    const discountAmount = discountCards * DISCOUNT_CARD_AMOUNT

    return Math.max(0, baseTotal - discountAmount) // Ensure cost doesn't go below 0
  }, [getSessionRate, session.scheduledDuration, items, discountCards])

  // Update timer and cost
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prevTime => prevTime + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Effect to update local currentCost when session details or items change
  useEffect(() => {
    const newCost = getSessionCost();
    setCurrentCost(newCost);
  }, [session.isStudent, session.selectedTimeInterval, session.scheduledDuration, items, getSessionCost, discountCards]);

  // Handle adding/removing items
  const handleItemChange = (itemId: string, quantity: number) => {
    const newItems = items.filter((item) => item.itemId !== itemId);
    if (quantity > 0) {
      newItems.push({ itemId, quantity });
    }

    // Update local state
    setItems(newItems);

    // Update items in parent component with the new items array
    onAddItems(newItems);
  }

  // Rate interval change handler - call parent via onUpdateSessionDetails
  const handleTimeIntervalChange = (value: string) => {
    let studentUpdate = {};
    // If changing to non-day and student rate is active, signal to disable student rate
    if (value !== 'day' && session.isStudent) {
      studentUpdate = { isStudent: false };
    }
    // Call the parent to update the session state
    onUpdateSessionDetails({ selectedTimeInterval: value, ...studentUpdate });
  };

  // Student status change handler - call parent via onUpdateSessionDetails
  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Keep stopPropagation
    const newIsStudent = e.target.checked;
    // Call the parent to update the session state
    onUpdateSessionDetails({ isStudent: newIsStudent });
  };

  // Handle discount card changes
  const handleIncreaseDiscountCards = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newCount = discountCards + 1;
    setDiscountCards(newCount);
    onUpdateSessionDetails({ discountCards: newCount });
  }

  const handleDecreaseDiscountCards = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (discountCards > 0) {
      const newCount = discountCards - 1;
      setDiscountCards(newCount);
      onUpdateSessionDetails({ discountCards: newCount });
    }
  }

  // Get the count of additional items by category
  const getItemCount = (category: string) => {
    return items.filter(item => {
      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
      return itemDef?.category === category;
    }).reduce((sum, item) => sum + item.quantity, 0);
  }

  // Helper to get rate name
  const getRateName = () => {
    if (session.type === "squash") {
      if (session.isStudent) return "Student Rate";
      if (session.selectedTimeInterval === "day") return "Day Rate";
      if (session.selectedTimeInterval === "evening") return "Evening Rate";
      if (session.selectedTimeInterval === "weekend") return "Weekend Rate";
    }
    return "Fixed Rate";
  }

  return (
    <div className="space-y-3">
      {/* Simplified Session Info Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header with player info */}
          <div className="px-3 py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 shadow-sm flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium leading-tight">{session.playerName}</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800 text-xs px-1.5 py-0">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400 animate-pulse"></span>
                  Active
                </span>
              </Badge>
              {session.startTime && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Started at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>

          {/* Compact stats row */}
          <div className="p-3 grid grid-cols-3 gap-3 text-sm">
            {/* Time */}
            <div>
              <div className="flex items-center text-muted-foreground text-xs gap-1 mb-1">
                <Clock className="h-3 w-3" />
                <span>Time</span>
              </div>
              <div className="font-medium">{formatTime(time)}</div>
              <div className="text-xs text-muted-foreground">Booked: {session.scheduledDuration}h</div>
            </div>

            {/* Cost */}
            <div>
              <div className="flex items-center text-muted-foreground text-xs gap-1 mb-1">
                <CircleDollarSign className="h-3 w-3" />
                <span>Cost</span>
              </div>
              <div className="font-medium text-green-600 dark:text-green-400">{currentCost.toFixed(2)} {CURRENCY_SYMBOL}</div>
              <div className="text-xs text-muted-foreground">{getSessionRate()} {CURRENCY_SYMBOL}/h</div>
            </div>

            {/* Rate Type */}
            <div>
              <div className="flex items-center text-muted-foreground text-xs gap-1 mb-1">
                {session.isStudent ? (
                  <Award className="h-3 w-3" />
                ) : (
                  <CircleDollarSign className="h-3 w-3" />
                )}
                <span>Rate</span>
              </div>
              <div className="font-medium">{getRateName()}</div>
              <div className="text-xs text-muted-foreground capitalize">{session.type.replace('-', ' ')}</div>
            </div>
          </div>

          {/* Discount info if applicable */}
          {discountCards > 0 && (
            <div className="px-3 pb-2 -mt-1">
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <CreditCard className="h-3 w-3 mr-1" />
                <span>
                  {discountCards} card{discountCards > 1 ? 's' : ''} applied
                  (-{(discountCards * DISCOUNT_CARD_AMOUNT).toFixed(2)} {CURRENCY_SYMBOL})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options Sections */}
      <div className="space-y-2">
        {/* Rate Options - Only for Squash Courts */}
        {session.type === "squash" && (
          <div className="rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setRateOptionsExpanded(prev => !prev)}
              className="w-full flex items-center justify-between p-2 bg-card hover:bg-muted/50 text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-purple-500" />
                <span>Rate Options</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs text-muted-foreground mr-1">{
                  session.isStudent ? "Student Rate" :
                    session.selectedTimeInterval === "day" ? "Day Rate" :
                      session.selectedTimeInterval === "evening" ? "Evening Rate" : "Weekend Rate"
                }</div>
                {rateOptionsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            <AnimatePresence>
              {rateOptionsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 bg-muted/50 dark:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                    <Tabs value={session.selectedTimeInterval || "day"} onValueChange={handleTimeIntervalChange} className="w-full">
                      <div className="bg-card rounded-md p-1.5 flex border border-border mb-2">
                        <TabsList className="bg-transparent p-0 w-full flex justify-between">
                          {TIME_INTERVAL_OPTIONS.map((option) => (
                            <TabsTrigger
                              key={option.value}
                              value={option.value}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=active]:bg-muted/80 data-[state=active]:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {option.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      {TIME_INTERVAL_OPTIONS.map((option) => (
                        <TabsContent key={option.value} value={option.value} className="mt-1">
                          <div className="rounded-md bg-card p-2.5 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {option.icon}
                                <div className="font-medium">{option.price} {CURRENCY_SYMBOL}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>

                            {option.value === 'day' && (
                              <div className="mt-2.5 pt-2 border-t border-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={session.isStudent}
                                    onChange={handleStudentChange}
                                    className="rounded border-green-500 text-green-500 focus:ring-green-500/25"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <Award className="h-3.5 w-3.5 text-green-500" />
                                    <span className="text-sm">Student Rate ({STUDENT_PRICE} {CURRENCY_SYMBOL})</span>
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Discount Cards Section - Available for all court types */}
        <div className="rounded-md border border-border overflow-hidden">
          <button 
            onClick={() => setDiscountCardsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between p-2 bg-card hover:bg-muted/50 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span>Discount Cards</span>
            </div>
            <div className="flex items-center gap-1.5">
              {discountCards > 0 && (
                <div className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                  {discountCards}
                </div>
              )}
              {discountCardsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>
          
          <AnimatePresence>
            {discountCardsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-muted/50 dark:bg-muted/20">
                  <div className="rounded-md bg-card p-2.5 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">Discount Cards</div>
                        <p className="text-xs text-muted-foreground">Each card provides {DISCOUNT_CARD_AMOUNT} {CURRENCY_SYMBOL} discount</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex-1">
                        <span className="text-sm">Applied discount:</span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-1">
                          {discountCards > 0 ? `-${(discountCards * DISCOUNT_CARD_AMOUNT).toFixed(2)} ${CURRENCY_SYMBOL}` : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={handleDecreaseDiscountCards}
                          className={cn(
                            "p-1 rounded-full transition-colors",
                            discountCards > 0
                              ? "text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                              : "text-gray-300 dark:text-gray-600"
                          )}
                          disabled={discountCards === 0}
                          type="button"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className={cn(
                          "w-5 text-center text-sm font-medium transition-colors",
                          discountCards > 0 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-gray-400 dark:text-gray-500"
                        )}>
                          {discountCards}
                        </span>
                        <button
                          onClick={handleIncreaseDiscountCards}
                          className="p-1 rounded-full text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          type="button"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Equipment Section */}
        <div className="rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setAdditionalItemsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between p-2 bg-card hover:bg-muted/50 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <span>Equipment</span>
            </div>
            <div className="flex items-center gap-1.5">
              {getItemCount('equipment') > 0 && (
                <div className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                  {getItemCount('equipment')}
                </div>
              )}
              {additionalItemsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          <AnimatePresence>
            {additionalItemsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-muted/50 dark:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1.5">
                    {ADDITIONAL_ITEMS.filter(item => item.category === 'equipment').map((item) => (
                      <div key={item.id} className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded-md",
                        (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "bg-card dark:bg-card"
                      )}>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.price.toFixed(2)} {CURRENCY_SYMBOL}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                              if (currentQty > 0) {
                                handleItemChange(item.id, currentQty - 1);
                              }
                            }}
                            className={cn(
                              "p-1 rounded-full transition-colors",
                              (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                                ? "text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                : "text-gray-300 dark:text-gray-600"
                            )}
                            disabled={(items.find(i => i.itemId === item.id)?.quantity || 0) === 0}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={cn(
                            "w-5 text-center text-sm font-medium transition-colors",
                            (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}>
                            {items.find(i => i.itemId === item.id)?.quantity || 0}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                              handleItemChange(item.id, currentQty + 1);
                            }}
                            className="p-1 rounded-full text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refreshments Section */}
        <div className="rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setRefreshmentItemsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between p-2 bg-card hover:bg-muted/50 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-green-500" />
              <span>Refreshments</span>
            </div>
            <div className="flex items-center gap-1.5">
              {getItemCount('refreshment') > 0 && (
                <div className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                  {getItemCount('refreshment')}
                </div>
              )}
              {refreshmentItemsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          <AnimatePresence>
            {refreshmentItemsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-muted/50 dark:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1.5">
                    {ADDITIONAL_ITEMS.filter(item => item.category === 'refreshment').map((item) => (
                      <div key={item.id} className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded-md",
                        (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                          ? "bg-green-50 dark:bg-green-900/30"
                          : "bg-card dark:bg-card"
                      )}>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.price.toFixed(2)} {CURRENCY_SYMBOL}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                              if (currentQty > 0) {
                                handleItemChange(item.id, currentQty - 1);
                              }
                            }}
                            className={cn(
                              "p-1 rounded-full transition-colors",
                              (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                                ? "text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                : "text-gray-300 dark:text-gray-600"
                            )}
                            disabled={(items.find(i => i.itemId === item.id)?.quantity || 0) === 0}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={cn(
                            "w-5 text-center text-sm font-medium transition-colors",
                            (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}>
                            {items.find(i => i.itemId === item.id)?.quantity || 0}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                              handleItemChange(item.id, currentQty + 1);
                            }}
                            className="p-1 rounded-full text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 