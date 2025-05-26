import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ADDITIONAL_ITEMS, CURRENCY_SYMBOL, STUDENT_PRICE, DISCOUNT_CARD_AMOUNT, Session, TIME_INTERVAL_OPTIONS, TimeIntervalOption } from "@/types" // Import necessary types/constants and TimeIntervalOption
import { cn } from "@/lib/utils"
import { Plus, Minus, CircleDollarSign, ShoppingCart, Coffee, ChevronDown, ChevronUp, Award } from "lucide-react" // Import icons
import { motion, AnimatePresence } from "framer-motion" // Import animation components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs

// Keep TIME_INTERVAL_OPTIONS if not imported, or ensure it's available

interface BookingDialogProps {
  courtId: string
  courtType: "squash" | "table-tennis"
  hourlyRate: number
  isOpen: boolean
  onClose: () => void
  onConfirm: (session: Omit<Session, 'id' | 'status'>) => void
  existingSession?: Session // Used for editing
}

export function BookingDialog({
  courtId,
  courtType,
  hourlyRate,
  isOpen,
  onClose,
  onConfirm,
  existingSession
}: BookingDialogProps) {
  // Existing state
  const [playerName, setPlayerName] = useState("")
  const [scheduledDuration, setScheduledDuration] = useState(1) // Default to 1 hour
  const [scheduledTime, setScheduledTime] = useState("8:00") // Default to 8:00 AM
  const nameInputRef = useRef<HTMLInputElement>(null)

  // State for new sections (mirroring ActiveSession structure)
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [isStudent, setIsStudent] = useState(false)
  const [discountCards, setDiscountCards] = useState(0) // Changed from hasDiscountCard boolean to a number
  const [selectedTimeInterval, setSelectedTimeInterval] = useState<string>("day") // Default to 'day'
  const [rateOptionsExpanded, setRateOptionsExpanded] = useState(false)
  const [equipmentExpanded, setEquipmentExpanded] = useState(false)
  const [refreshmentsExpanded, setRefreshmentsExpanded] = useState(false)
  const [discountCardsExpanded, setDiscountCardsExpanded] = useState(false)
  const [displayCost, setDisplayCost] = useState(0) // State to hold calculated cost
  const [hasSubscription, setHasSubscription] = useState(false) // State for subscription

  // Reset state when dialog opens or closes, or when existingSession changes
  useEffect(() => {
    if (isOpen) {
      if (existingSession) {
        // Populate state for editing
        setPlayerName(existingSession.playerName || "")
        setScheduledDuration(existingSession.scheduledDuration || 1)
        setSelectedItems(existingSession.items || [])
        setIsStudent(existingSession.isStudent || false)
        setDiscountCards(existingSession.discountCards || 0) // Set the number of discount cards
        setSelectedTimeInterval(existingSession.selectedTimeInterval || determineDefaultTimeInterval())
        setScheduledTime(existingSession.scheduledTime || "8:00")
        setHasSubscription(existingSession.hasSubscription || false) // Populate subscription
      } else {
        // Reset state for new booking
        setPlayerName("")
        setScheduledDuration(1)
        setSelectedItems([])
        setIsStudent(false)
        setDiscountCards(0) // Reset discount cards to 0
        setSelectedTimeInterval(determineDefaultTimeInterval()) // Set default based on time
        setScheduledTime("8:00")
        setHasSubscription(false) // Reset subscription
      }
      // Focus name input after a short delay
      setTimeout(() => nameInputRef.current?.focus(), 100)
    } else {
      // Optionally reset on close as well if desired
      // setPlayerName(""); // ... reset other states ...
    }
  }, [isOpen, existingSession])

  // Determine default time interval based on current time (copied from CourtCard)
   const determineDefaultTimeInterval = () => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    if (day === 0 || day === 6) return "weekend"
    if (hour >= 7 && hour < 17) return "day"
    return "evening"
  }

  // Calculate current applicable court rate based on dialog state
  const getCourtRate = useCallback(() => {
    if (courtType === "table-tennis") return hourlyRate;
    if (isStudent && selectedTimeInterval === 'day') return STUDENT_PRICE;
    const option: TimeIntervalOption | undefined = TIME_INTERVAL_OPTIONS.find(opt => opt.value === selectedTimeInterval);
    return option ? option.price : hourlyRate; // Fallback to base rate
  }, [courtType, hourlyRate, isStudent, selectedTimeInterval]);

  // Calculate total cost based on dialog state
  const calculateTotalCost = useCallback(() => {
    const rate = getCourtRate();
    const courtCost = hasSubscription ? 0 : rate * scheduledDuration; // Apply subscription
    const itemsCost = selectedItems.reduce((total, item) => {
      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
      return total + (itemDef?.price || 0) * item.quantity;
    }, 0);
    
    // Apply discount for card holders (multiple cards)
    const baseTotal = courtCost + itemsCost;
    const discountAmount = discountCards * DISCOUNT_CARD_AMOUNT;
    
    return Math.max(0, baseTotal - discountAmount); // Ensure cost doesn't go below 0
  }, [getCourtRate, scheduledDuration, selectedItems, discountCards, hasSubscription]);

  // Update display cost whenever relevant state changes
  useEffect(() => {
    setDisplayCost(calculateTotalCost());
  }, [calculateTotalCost]); // Dependency array includes the memoized function

  // Handlers for Rate Options
  const handleTimeIntervalChange = (value: string) => {
    setSelectedTimeInterval(value);
    if (value !== 'day' && isStudent) {
      setIsStudent(false); // Reset student if interval changes from day
    }
    // Cost will update via useEffect
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setIsStudent(e.target.checked);
  };

  // Handle discount card change - now for multiple cards
  const increaseDiscountCards = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDiscountCards(prev => prev + 1);
  };

  const decreaseDiscountCards = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDiscountCards(prev => Math.max(0, prev - 1));
  };

  // Handler for Item Changes
  const handleItemChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => {
      const newItems = prev.filter(item => item.itemId !== itemId);
      if (quantity > 0) {
        newItems.push({ itemId, quantity });
      }
      return newItems;
    });
    // Cost will update via useEffect
  };

  // Confirm Booking Handler
  const handleConfirm = () => {
    const finalCost = calculateTotalCost(); // Recalculate final cost before confirming
    const sessionData: Omit<Session, 'id' | 'status'> = {
      courtId,
      playerName: playerName || "Guest", // Default name if empty
      scheduledDuration,
      items: selectedItems,
      isStudent,
      discountCards, // Include discount cards count
      selectedTimeInterval,
      cost: finalCost,
      type: courtType,
      hourlyRate: getCourtRate(), // Pass the calculated rate
      scheduledTime,
      paymentStatus: 'unpaid', // Default
      startTime: null,
      endTime: null,
      hasSubscription, // Include subscription status
    };
    onConfirm(sessionData);
  };

  // --- JSX Structure ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0"> {/* Removed padding from DialogContent */}
        <DialogHeader className="p-6 pb-2"> {/* Added explicit padding to header */}
          <DialogTitle>{existingSession ? "Edit Booking" : "Book Court"}</DialogTitle>
          <DialogDescription>
            Enter details for the court booking. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        {/* Main Content Area - now scrollable, removed right padding */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Player Name Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-medium">
              Name*
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="col-span-3"
              placeholder="Enter player's name"
              required
            />
          </div>

          {/* Duration Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right font-medium">
              Hours*
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="duration"
                type="number"
                min="1"
                step="1"
                value={scheduledDuration}
                onChange={(e) => setScheduledDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
                required
              />
              <span className="text-sm text-muted-foreground">hour(s)</span>
              <div className="flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setScheduledDuration(h => Math.max(1, h - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0"
                  onClick={() => setScheduledDuration(h => h + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Starting Hour Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startHour" className="text-right font-medium">
              Start Time*
            </Label>
            <div className="col-span-3">
              <select
                id="startHour"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex h-10 w-1/2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                  <option key={hour} value={`${hour}:00`}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Subscription Checkbox */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subscription" className="text-right font-medium">
              Subscription
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                type="checkbox"
                id="subscription"
                checked={hasSubscription}
                onChange={(e) => setHasSubscription(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
              />
              <label htmlFor="subscription" className="text-sm text-muted-foreground">
                Monthly Subscriber (No Court Fee)
              </label>
            </div>
          </div>
          
          {/* --- Rate Options Section (Squash Only) --- */}
          {courtType === "squash" && (
             <div className="rounded-md border border-border overflow-hidden">
                <button
                    onClick={() => setRateOptionsExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between p-2.5 bg-card hover:bg-muted/50 text-sm font-medium"
                >
                    <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-purple-500" />
                        <span>Rate Options</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="text-xs text-muted-foreground mr-1">{
                            isStudent ? "Student Rate" :
                            selectedTimeInterval === "day" ? "Day Rate" :
                            selectedTimeInterval === "evening" ? "Evening Rate" : "Weekend Rate"
                        }</div>
                        {rateOptionsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </button>
                <AnimatePresence>
                    {rateOptionsExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="p-2 bg-muted/50 dark:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                                <Tabs value={selectedTimeInterval || "day"} onValueChange={handleTimeIntervalChange} className="w-full">
                                    <div className="bg-card rounded-md p-1.5 flex border border-border mb-2">
                                      <TabsList className="bg-transparent p-0 w-full flex justify-between" onClick={(e) => e.stopPropagation()}>
                                        {TIME_INTERVAL_OPTIONS.map((option: TimeIntervalOption) => (
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
                                    {TIME_INTERVAL_OPTIONS.map((option: TimeIntervalOption) => (
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
                                                                checked={isStudent}
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

          {/* --- Discount Cards Section --- */}
          <div className="rounded-md border border-border overflow-hidden">
            <button 
              onClick={() => setDiscountCardsExpanded(prev => !prev)}
              className="w-full flex items-center justify-between p-2.5 bg-card hover:bg-muted/50 text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-blue-500" />
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
                            onClick={decreaseDiscountCards}
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
                            onClick={increaseDiscountCards}
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

          {/* --- Equipment Section --- */}
          <div className="rounded-md border border-border overflow-hidden">
                <button
                    onClick={() => setEquipmentExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between p-2.5 bg-card hover:bg-muted/50 text-sm font-medium"
                >
                     <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                        <span>Equipment</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                         {selectedItems.filter(item => ADDITIONAL_ITEMS.find(i => i.id === item.itemId)?.category === 'equipment').length > 0 && (
                             <div className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                                 {selectedItems.filter(item => ADDITIONAL_ITEMS.find(i => i.id === item.itemId)?.category === 'equipment').reduce((sum, item) => sum + item.quantity, 0)}
                             </div>
                         )}
                         {equipmentExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     </div>
                 </button>
                 <AnimatePresence>
                     {equipmentExpanded && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="p-3 bg-muted/50 dark:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1.5">
                                    {ADDITIONAL_ITEMS.filter(item => item.category === 'equipment').map((item) => (
                                        <div key={item.id} className={cn("flex items-center justify-between py-1.5 px-2 rounded-md", 
                                          (selectedItems.find(i => i.itemId === item.id)?.quantity || 0) > 0 
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
                                                        const currentQty = selectedItems.find(i => i.itemId === item.id)?.quantity || 0;
                                                        if (currentQty > 0) {
                                                            handleItemChange(item.id, currentQty - 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-1 rounded-full transition-colors",
                                                        (selectedItems.find(i => i.itemId === item.id)?.quantity || 0) > 0
                                                            ? "text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                            : "text-gray-300 dark:text-gray-600"
                                                    )}
                                                    disabled={(selectedItems.find(i => i.itemId === item.id)?.quantity || 0) === 0}
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className={cn("w-5 text-center text-sm font-medium transition-colors", (selectedItems.find(i => i.itemId === item.id)?.quantity || 0) > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")}> {selectedItems.find(i => i.itemId === item.id)?.quantity || 0} </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const currentQty = selectedItems.find(i => i.itemId === item.id)?.quantity || 0;
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

          {/* --- Refreshments Section --- */}
          <div className="rounded-md border border-border overflow-hidden">
                <button
                     onClick={() => setRefreshmentsExpanded(prev => !prev)}
                     className="w-full flex items-center justify-between p-2.5 bg-card hover:bg-muted/50 text-sm font-medium"
                 >
                     <div className="flex items-center gap-2">
                         <Coffee className="h-4 w-4 text-green-500" />
                         <span>Refreshments</span>
                     </div>
                    <div className="flex items-center gap-1.5">
                         {selectedItems.filter(item => ADDITIONAL_ITEMS.find(i => i.id === item.itemId)?.category === 'refreshment').length > 0 && (
                             <div className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                                 {selectedItems.filter(item => ADDITIONAL_ITEMS.find(i => i.id === item.itemId)?.category === 'refreshment').reduce((sum, item) => sum + item.quantity, 0)}
                             </div>
                         )}
                         {refreshmentsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     </div>
                 </button>
                 <AnimatePresence>
                     {refreshmentsExpanded && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                             <div className="p-3 bg-muted/50 dark:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                                 <div className="space-y-1.5">
                                     {ADDITIONAL_ITEMS.filter(item => item.category === 'refreshment').map((item) => (
                                         <div key={item.id} className={cn("flex items-center justify-between py-1.5 px-2 rounded-md", 
                                          (selectedItems.find(i => i.itemId === item.id)?.quantity || 0) > 0 
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
                                                         const currentQty = selectedItems.find(i => i.itemId === item.id)?.quantity || 0;
                                                         if (currentQty > 0) {
                                                             handleItemChange(item.id, currentQty - 1);
                                                         }
                                                     }}
                                                     className={cn(
                                                         "p-1 rounded-full transition-colors",
                                                         (selectedItems.find(i => i.itemId === item.id)?.quantity || 0) > 0
                                                             ? "text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                             : "text-gray-300 dark:text-gray-600"
                                                     )}
                                                     disabled={(selectedItems.find(i => i.itemId === item.id)?.quantity || 0) === 0}
                                                 >
                                                     <Minus className="w-3.5 h-3.5" />
                                                 </button>
                                                 <span className={cn("w-5 text-center text-sm font-medium transition-colors", (selectedItems.find(i => i.itemId === item.id)?.quantity || 0) > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500")}> {selectedItems.find(i => i.itemId === item.id)?.quantity || 0} </span>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const currentQty = selectedItems.find(i => i.itemId === item.id)?.quantity || 0;
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

        {/* Estimated Cost Display - moved outside scrollable area */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Estimated Cost:</span>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              {displayCost.toFixed(2)} {CURRENCY_SYMBOL}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {scheduledDuration} hour(s), selected rate, and items.
          </p>
        </div>

        {/* Footer with Actions */}
        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!playerName || scheduledDuration < 1} // Basic validation
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {existingSession ? "Update Booking" : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 