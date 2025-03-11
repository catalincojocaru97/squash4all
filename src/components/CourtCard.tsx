"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Check, Clock, Plus, Minus, Users, Award, Ban, ChevronDown, ChevronUp, ShoppingCart, Coffee, CircleDollarSign, User } from "lucide-react"
import { AdditionalItems } from "./AdditionalItems"
import { PRICE_INTERVALS, STUDENT_PRICE, ADDITIONAL_ITEMS, CURRENCY_SYMBOL } from "@/types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define time intervals for selection with enhanced styling
const TIME_INTERVAL_OPTIONS = [
  { 
    label: "Day (7-17)", 
    value: "day", 
    price: 50,
    description: "Standard day rate",
    icon: <Clock className="h-4 w-4" />
  },
  { 
    label: "Evening (17-23)", 
    value: "evening", 
    price: 80,
    description: "Premium evening hours",
    icon: <Clock className="h-4 w-4" />
  },
  { 
    label: "Weekend", 
    value: "weekend", 
    price: 80,
    description: "Saturday & Sunday",
    icon: <Users className="h-4 w-4" />
  },
]

interface CourtCardProps {
  name: string
  type: "squash" | "table-tennis"
  courtNumber?: number
  hourlyRate: number
  onSessionStart?: () => void
  onSessionEnd?: (revenue: number | null) => void
}

export function CourtCard({ 
  name, 
  type, 
  courtNumber, 
  hourlyRate,
  onSessionStart,
  onSessionEnd 
}: CourtCardProps) {
  const [isActive, setIsActive] = useState(false)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const [time, setTime] = useState(0)
  const [cost, setCost] = useState(0)
  const [isStudent, setIsStudent] = useState(false)
  const [items, setItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [selectedTimeInterval, setSelectedTimeInterval] = useState<string | null>(null)
  
  // Add state for renter name
  const [renterName, setRenterName] = useState<string>("")
  const [showNameDialog, setShowNameDialog] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [rentalHours, setRentalHours] = useState<number>(1)

  // Format time in hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Add new state variables for collapsible sections
  const [additionalItemsExpanded, setAdditionalItemsExpanded] = useState(false)
  const [refreshmentItemsExpanded, setRefreshmentItemsExpanded] = useState(false)
  const [rateOptionsExpanded, setRateOptionsExpanded] = useState(false)

  // Check if student rate can be applied (only during day time)
  const canApplyStudentRate = selectedTimeInterval === 'day'

  // Reset student rate if time interval changes to non-day
  useEffect(() => {
    if (!canApplyStudentRate && isStudent) {
      setIsStudent(false)
    }
  }, [selectedTimeInterval, canApplyStudentRate, isStudent])

  // Determine the default time interval based on current time
  const determineDefaultTimeInterval = () => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    
    if (day === 0 || day === 6) {
      return "weekend" // Weekend
    } else if (hour >= 7 && hour < 17) {
      return "day" // Day time
    } else {
      return "evening" // Evening
    }
  }

  const getCourtRate = () => {
    if (type === "table-tennis") {
      // Table tennis has a fixed rate
      return hourlyRate
    }

    // If student rate is selected and can be applied (day time only)
    if (isStudent && canApplyStudentRate) {
      return STUDENT_PRICE
    }
    
    // If manually selected, use that interval
    if (selectedTimeInterval) {
      const option = TIME_INTERVAL_OPTIONS.find(opt => opt.value === selectedTimeInterval)
      return option ? option.price : 0
    }
    
    // Otherwise use the current time to determine rate
    if (!sessionStartTime) return 0

    // Check if it's a weekend
    const day = sessionStartTime.getDay()
    const isWeekend = day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
    
    // Get the current hour
    const currentHour = sessionStartTime.getHours()
    
    // Find the appropriate price interval
    const interval = PRICE_INTERVALS.find(
      (interval) => 
        currentHour >= interval.start && 
        currentHour < interval.end && 
        interval.isWeekend === isWeekend
    )
    
    // If no interval found, use the default rate
    return interval ? interval.price : hourlyRate
  }

  const calculateAdditionalCost = () => {
    return items.reduce((total, item) => {
      const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
      return total + (itemDef?.price || 0) * item.quantity
    }, 0)
  }

  // Calculate hours, always rounding up to the next full hour
  const calculateHours = (seconds: number) => {
    // Convert seconds to hours, then take the ceiling to always round up
    return Math.ceil(seconds / 3600)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          
          // Calculate court cost
          const rate = getCourtRate();
          
          // Calculate court cost based on rental hours, not elapsed time
          const courtCost = rate * rentalHours;

          // Add additional items cost
          const additionalCost = calculateAdditionalCost();
          setCost(courtCost + additionalCost);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, hourlyRate, isStudent, items, type, selectedTimeInterval, rentalHours, getCourtRate, calculateAdditionalCost, time]);

  // Display billing information
  const displayRateInfo = () => {
    if (type === "squash") {
      if (isStudent && canApplyStudentRate) {
        return `Student rate: ${STUDENT_PRICE} ${CURRENCY_SYMBOL}`
      } else {
        const option = selectedTimeInterval 
          ? TIME_INTERVAL_OPTIONS.find(opt => opt.value === selectedTimeInterval)
          : null
          
        if (option) {
          return `${option.label}: ${option.price} ${CURRENCY_SYMBOL}`
        } else if (sessionStartTime) {
          const day = sessionStartTime.getDay()
          const isWeekend = day === 0 || day === 6
          const hour = sessionStartTime.getHours()
          
          if (isWeekend) {
            return `Weekend rate: 80 ${CURRENCY_SYMBOL}`
          } else if (hour >= 7 && hour < 17) {
            return `Day rate (7-17): 50 ${CURRENCY_SYMBOL}`
          } else if (hour >= 17 && hour < 23) {
            return `Evening rate (17-23): 80 ${CURRENCY_SYMBOL}`
          }
        }
      }
    } else {
      // Table tennis
      return `Fixed rate: ${hourlyRate} ${CURRENCY_SYMBOL}`
    }
    return ""
  }

  const resetSession = () => {
    setIsActive(false)
    if (timer) {
      clearInterval(timer)
      setTimer(null)
    }
    setTime(0)
    setCost(0)
    setItems([])
    setSessionStartTime(null)
    setSelectedTimeInterval(null)
    setIsStudent(false)
    setRenterName("")
    setRentalHours(1)
  }

  const handleSessionToggle = () => {
    if (!isActive) {
      // If starting a session, show the name dialog
      setShowNameDialog(true)
    } else {
      // If ending a session, handle that logic
      if (timer) {
        clearInterval(timer)
        setTimer(null)
      }
      setIsActive(false)
      if (onSessionEnd) {
        onSessionEnd(cost)
      }
    }
  }

  const startSession = () => {
    setIsActive(true)
    const now = new Date()
    setSessionStartTime(now)
    setSelectedTimeInterval(determineDefaultTimeInterval())
    
    // Calculate initial cost based on rental hours
    const rate = getCourtRate()
    const initialCost = rate * rentalHours
    const additionalCost = calculateAdditionalCost()
    setCost(initialCost + additionalCost)
    
    // Set up timer for tracking elapsed time
    const timeIntervalId = setInterval(() => {
      setTime(prevTime => prevTime + 1)
    }, 1000)
    
    setTimer(timeIntervalId)
    
    if (onSessionStart) {
      onSessionStart()
    }
  }

  const handleItemChange = (itemId: string, quantity: number) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.itemId !== itemId)
      if (quantity > 0) {
        newItems.push({ itemId, quantity })
      }
      return newItems
    })
  }

  // Handler for time interval change
  const handleTimeIntervalChange = (value: string) => {
    setSelectedTimeInterval(value)
    // If changing to a non-day rate and student rate is active, disable student rate
    if (value !== 'day' && isStudent) {
      setIsStudent(false)
    }
  }

  const handleSessionEnd = (shouldCharge: boolean) => {
    if (shouldCharge) {
      onSessionEnd?.(cost)
    } else {
      onSessionEnd?.(null)
    }
    resetSession()
  }

  // Function to remove number from the court name
  const getDisplayName = () => {
    // If there's no court number in the props, just use the full name
    if (!courtNumber) return name;
    
    // Remove the number from the end of the court name
    return name.replace(/\s+\d+$/, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        isActive
          ? "shadow-lg border-orange-400 bg-orange-50/20"
          : "shadow-md hover:shadow-lg border-green-400 bg-green-50/20"
      )}>
        {/* Court Header */}
        <CardHeader className="pb-1 pt-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                isActive ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
              )}>
                {courtNumber || (type === "squash" ? "S" : "T")}
              </div>
              <div>
                <CardTitle className="text-lg">{getDisplayName()}</CardTitle>
              </div>
            </div>
            <Badge variant={isActive ? "default" : "outline"} className={cn(
              "transition-all",
              isActive 
                ? "bg-orange-100 hover:bg-orange-100 text-orange-700 border-orange-200"
                : "bg-green-100 text-green-700 border-green-200"
            )}>
              {isActive ? "In Use" : "Available"}
            </Badge>
          </div>
        </CardHeader>
        
        {/* Summary Panel - Reduced top padding */}
        {isActive && (
          <div className="px-4 py-2 bg-gray-50 border-y border-gray-200">
            {/* Show renter name if provided */}
            {renterName && (
              <div className="mb-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-medium text-gray-700">{renterName}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500">Duration</span>
                <div>
                  <span className="text-lg font-semibold">{formatTime(time)}</span>
                  <span className="text-xs text-gray-500 ml-1">/ {rentalHours}h booked</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-gray-500">Total Cost</span>
                <span className="text-lg font-bold text-green-600">{cost.toFixed(2)} {CURRENCY_SYMBOL}</span>
              </div>
            </div>
            
            {/* Rate Display */}
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  Current Rate: <span className="font-medium text-gray-700">
                    {type === "squash" ? (
                      isStudent ? "Student Rate" : 
                      selectedTimeInterval === "day" ? "Day Rate" :
                      selectedTimeInterval === "evening" ? "Evening Rate" : "Weekend Rate"
                    ) : (
                      "Table Tennis"
                    )}
                  </span>
                </div>
                <div className="font-medium">
                  {getCourtRate()} {CURRENCY_SYMBOL}{type === "table-tennis" ? "/hour" : ""}
                </div>
              </div>
              
              {/* Additional Items Summary */}
              {items.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3 text-blue-500" />
                      <span>
                        {items.reduce((sum, item) => sum + item.quantity, 0)} items added
                      </span>
                    </div>
                    <div className="font-medium">
                      {calculateAdditionalCost().toFixed(2)} {CURRENCY_SYMBOL}
                    </div>
                  </div>
                  
                  {/* Show item list split by category */}
                  <div className="mt-1 text-xs text-gray-500 space-y-1.5">
                    {/* Equipment */}
                    {items.some(item => {
                      const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                      return itemDef?.category === 'equipment';
                    }) && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase mb-0.5 flex items-center">
                          <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
                          Equipment
                        </div>
                        {items.map(item => {
                          const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                          if (!itemDef || itemDef.category !== 'equipment') return null;
                          return (
                            <div key={item.itemId} className="flex justify-between pl-2">
                              <div>
                                {itemDef.name} <span className="text-gray-400">×</span> {item.quantity}
                              </div>
                              <div>{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Refreshments */}
                    {items.some(item => {
                      const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                      return itemDef?.category === 'refreshment';
                    }) && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase mb-0.5 flex items-center">
                          <Coffee className="h-2.5 w-2.5 mr-0.5" />
                          Refreshments
                        </div>
                        {items.map(item => {
                          const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId);
                          if (!itemDef || itemDef.category !== 'refreshment') return null;
                          return (
                            <div key={item.itemId} className="flex justify-between pl-2">
                              <div>
                                {itemDef.name} <span className="text-gray-400">×</span> {item.quantity}
                              </div>
                              <div>{(itemDef.price * item.quantity).toFixed(2)} {CURRENCY_SYMBOL}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <CardContent className={cn("pt-4", isActive ? "pb-3" : "pb-4")}>
          {!isActive && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-gray-400 flex flex-col items-center gap-1">
                <Clock className="h-5 w-5 opacity-70" />
                <span className="text-xs">Available</span>
              </div>
            </div>
          )}
          
          {/* Collapsible Sections Only When Active */}
          {isActive && (
            <div className="space-y-3">
              {/* Rate Options Collapsible Section - Only for Squash */}
              {type === "squash" && (
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <button 
                    onClick={() => setRateOptionsExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-gray-50 text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-purple-500" />
                      <span>Rate Options</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-xs text-gray-500 mr-1">{
                        isStudent ? "Student Rate" : 
                        selectedTimeInterval === "day" ? "Day Rate" :
                        selectedTimeInterval === "evening" ? "Evening Rate" : "Weekend Rate"
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
                        <div className="p-2 bg-gray-50/50">
                          <Tabs value={selectedTimeInterval || "day"} onValueChange={handleTimeIntervalChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-2">
                              {TIME_INTERVAL_OPTIONS.map((option) => (
                                <TabsTrigger key={option.value} value={option.value} className="text-xs">
                                  {option.label}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            
                            {TIME_INTERVAL_OPTIONS.map((option) => (
                              <TabsContent key={option.value} value={option.value} className="mt-1">
                                <div className="rounded-md bg-white p-2.5 text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      {option.icon}
                                      <div className="font-medium">{option.price} {CURRENCY_SYMBOL}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                  </div>
                                  
                                  {option.value === 'day' && (
                                    <div className="mt-2.5 pt-2 border-t border-gray-100">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isStudent}
                                          onChange={(e) => setIsStudent(e.target.checked)}
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
              
              {/* Split Additional Items into separate collapsible sections */}
              {/* Equipment Section */}
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => setAdditionalItemsExpanded(prev => !prev)}
                  className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <span>Equipment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {items.filter(item => {
                      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
                      return itemDef?.category === 'equipment';
                    }).length > 0 && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {items.filter(item => {
                          const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
                          return itemDef?.category === 'equipment';
                        }).reduce((sum, item) => sum + item.quantity, 0)}
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
                      <div className="p-3 bg-gray-50/50">
                        <div className="space-y-1.5">
                          {ADDITIONAL_ITEMS.filter(item => item.category === 'equipment').map((item) => (
                            <div key={item.id} className={cn(
                              "flex items-center justify-between py-1.5 px-2 rounded-md",
                              (items.find(i => i.itemId === item.id)?.quantity || 0) > 0 ? "bg-blue-50" : "bg-white"
                            )}>
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.price.toFixed(2)} {CURRENCY_SYMBOL}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                                    if (currentQty > 0) {
                                      handleItemChange(item.id, currentQty - 1);
                                    }
                                  }}
                                  className={cn(
                                    "p-1 rounded-full transition-colors",
                                    (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                                      ? "text-red-500 hover:bg-red-100"
                                      : "text-gray-300"
                                  )}
                                  disabled={(items.find(i => i.itemId === item.id)?.quantity || 0) === 0}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className={cn(
                                  "w-5 text-center text-sm font-medium transition-colors",
                                  (items.find(i => i.itemId === item.id)?.quantity || 0) > 0 ? "text-blue-600" : "text-gray-400"
                                )}>
                                  {items.find(i => i.itemId === item.id)?.quantity || 0}
                                </span>
                                <button
                                  onClick={() => {
                                    const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                                    handleItemChange(item.id, currentQty + 1);
                                  }}
                                  className="p-1 rounded-full text-green-500 hover:bg-green-100 transition-colors"
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
              <div className="rounded-md border border-gray-200 overflow-hidden mt-2">
                <button 
                  onClick={() => setRefreshmentItemsExpanded(prev => !prev)}
                  className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-green-500" />
                    <span>Refreshments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {items.filter(item => {
                      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
                      return itemDef?.category === 'refreshment';
                    }).length > 0 && (
                      <div className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        {items.filter(item => {
                          const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
                          return itemDef?.category === 'refreshment';
                        }).reduce((sum, item) => sum + item.quantity, 0)}
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
                      <div className="p-3 bg-gray-50/50">
                        <div className="space-y-1.5">
                          {ADDITIONAL_ITEMS.filter(item => item.category === 'refreshment').map((item) => (
                            <div key={item.id} className={cn(
                              "flex items-center justify-between py-1.5 px-2 rounded-md",
                              (items.find(i => i.itemId === item.id)?.quantity || 0) > 0 ? "bg-green-50" : "bg-white"
                            )}>
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.price.toFixed(2)} {CURRENCY_SYMBOL}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                                    if (currentQty > 0) {
                                      handleItemChange(item.id, currentQty - 1);
                                    }
                                  }}
                                  className={cn(
                                    "p-1 rounded-full transition-colors",
                                    (items.find(i => i.itemId === item.id)?.quantity || 0) > 0
                                      ? "text-red-500 hover:bg-red-100"
                                      : "text-gray-300"
                                  )}
                                  disabled={(items.find(i => i.itemId === item.id)?.quantity || 0) === 0}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className={cn(
                                  "w-5 text-center text-sm font-medium transition-colors",
                                  (items.find(i => i.itemId === item.id)?.quantity || 0) > 0 ? "text-green-600" : "text-gray-400"
                                )}>
                                  {items.find(i => i.itemId === item.id)?.quantity || 0}
                                </span>
                                <button
                                  onClick={() => {
                                    const currentQty = items.find(i => i.itemId === item.id)?.quantity || 0;
                                    handleItemChange(item.id, currentQty + 1);
                                  }}
                                  className="p-1 rounded-full text-green-500 hover:bg-green-100 transition-colors"
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
          )}
        </CardContent>
        
        <CardFooter className={cn("pt-0 pb-4", isActive ? "px-4" : "px-4")}>
          {!isActive ? (
            <Button 
              onClick={handleSessionToggle}
              variant="default"
              className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 h-10"
            >
              Start Session
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="w-full bg-red-500 hover:bg-red-600 transition-all duration-300 h-10"
                >
                  End Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl tracking-tight">
                    End Session for {name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {/* Add renter name to the dialog if provided */}
                    {renterName && (
                      <div className="mb-2 text-sm">
                        <span className="text-gray-600">Rented by:</span> <span className="font-medium">{renterName}</span>
                      </div>
                    )}
                    
                    <div className="mt-4 space-y-4">
                      <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
                        {/* Duration row */}
                        <div className="px-4 py-3 bg-gray-50/50">
                          <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">Duration</div>
                          <div>
                            <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                              {Math.floor(time / 3600)}h {Math.floor((time % 3600) / 60)}m
                            </div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              Booked for: {rentalHours} {rentalHours === 1 ? 'hour' : 'hours'}
                            </div>
                          </div>
                        </div>

                        {/* Cost breakdown */}
                        <div className="px-4 py-3">
                          <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">Cost Breakdown</div>
                          <div className="space-y-2">
                            {/* Court cost */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium text-gray-700">
                                  {type === "squash" ? (
                                    isStudent ? "Student Rate" : 
                                    selectedTimeInterval === "day" ? "Day Rate (7-17)" :
                                    selectedTimeInterval === "evening" ? "Evening Rate (17-23)" : 
                                    "Weekend Rate"
                                  ) : (
                                    "Table Tennis Rate"
                                  )}
                                </div>
                                <div className="font-mono text-sm font-medium text-gray-900">
                                  {getCourtRate().toFixed(2)} {CURRENCY_SYMBOL}
                                  <span className="text-gray-500 ml-1">/hour</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pl-2 text-sm">
                                <div className="text-gray-600">
                                  {rentalHours} {rentalHours === 1 ? 'hour' : 'hours'} × {getCourtRate().toFixed(2)} {CURRENCY_SYMBOL}
                                </div>
                                <div className="font-mono font-medium text-gray-900">
                                  {(getCourtRate() * rentalHours).toFixed(2)} {CURRENCY_SYMBOL}
                                </div>
                              </div>
                            </div>

                            {/* Additional items */}
                            {items.length > 0 && (
                              <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                                {/* Equipment */}
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
                                
                                {/* Refreshments */}
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

                        {/* Total row */}
                        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-semibold text-gray-900">Total Amount</div>
                            <div className="text-xl font-bold text-green-600 font-mono tracking-tight">
                              {cost.toFixed(2)} {CURRENCY_SYMBOL}
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
                <AlertDialogFooter className="mt-4 sm:mt-6">
                  <AlertDialogCancel
                    onClick={() => handleSessionEnd(false)}
                    className="flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 font-medium"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel Session
                    <span className="text-xs text-gray-500 font-normal">(No charge)</span>
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleSessionEnd(true)}
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Complete with Payment
                    <span className="text-xs text-green-100/90 font-normal">({cost.toFixed(2)} {CURRENCY_SYMBOL})</span>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
      
      {/* Add Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start Session</DialogTitle>
            <DialogDescription>
              Enter the name of the person renting {name} and specify rental duration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right font-medium">
                Name
              </div>
              <input
                id="name"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={renterName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenterName(e.target.value)}
                placeholder="Enter renter's name"
                ref={nameInputRef}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right font-medium">
                Hours
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rentalHours}
                  onChange={(e) => setRentalHours(Math.max(1, parseInt(e.target.value)))}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span className="text-sm text-gray-500">hours</span>
                <div className="flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setRentalHours(h => Math.max(1, h - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-l-none border-l-0"
                    onClick={() => setRentalHours(h => h + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNameDialog(false);
                setRenterName("");
                setRentalHours(1);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowNameDialog(false);
                startSession();
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
} 