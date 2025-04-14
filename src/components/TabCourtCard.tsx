import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Session, CURRENCY_SYMBOL, Court, STUDENT_PRICE } from "@/types"
import { useCourtSessions } from "@/hooks/useCourtSessions"
import { SessionList } from "@/components/SessionList"
import { ActiveSession } from "@/components/ActiveSession"
import { EmptyState } from "@/components/EmptyState"
import { BookingDialog } from "@/components/BookingDialog"
import { EndSessionDialog } from "@/components/EndSessionDialog"
import { Calendar, Clock, CircleDollarSign, Users, CircleSlash, ChevronUp, ChevronDown, Award, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface TabCourtCardProps {
  id: string
  name: string
  type: "squash" | "table-tennis"
  courtNumber?: number
  hourlyRate: number
  onSessionStart?: () => void
  onSessionEnd?: (revenue: number) => void
}

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

// Active Tab showing current active session
// Moved definition outside TabCourtCard for clarity and performance
interface ActiveTabProps {
  activeSession: Session;
  onEndSession: (finalCost: number, paymentMethod?: 'cash' | 'card') => void;
  onUpdateSession: (updates: Partial<Session>) => void;
}

function ActiveTab({ activeSession, onEndSession, onUpdateSession }: ActiveTabProps) {

  // Handler for adding/removing items - update parent via onUpdateSession
  const handleAddItems = (newItems: { itemId: string; quantity: number }[]) => {
    onUpdateSession({ items: newItems });
  };

  // Handler for updating session details (rate, student status) - update parent via onUpdateSession
  const handleUpdateDetails = (updates: { isStudent?: boolean; selectedTimeInterval?: string }) => {
    onUpdateSession(updates);
  };

  return (
    <div className="p-4">
      <ActiveSession 
        session={activeSession} 
        onEnd={onEndSession} // Pass the main endSession handler directly
        onAddItems={handleAddItems} // Use the new handler
        onUpdateSessionDetails={handleUpdateDetails} // Pass the new handler
      />
    </div>
  );
}

export function TabCourtCard({ 
  id,
  name, 
  type, 
  courtNumber, 
  hourlyRate,
  onSessionStart,
  onSessionEnd 
}: TabCourtCardProps) {
  // Use court sessions hook to manage sessions for this court
  const { 
    upcomingSessions, 
    activeSession, // This is the single source of truth for the active session
    finishedSessions,
    createUpcomingSession,
    updateUpcomingSession,
    cancelUpcomingSession,
    startSession,
    updateActiveSession, // This function updates the hook's state
    endSession // This function updates the hook's state
  } = useCourtSessions(id)
  
  // Dialog states
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  
  // Handle create booking
  const handleCreateBooking = () => {
    setIsBookingDialogOpen(true)
  }
  
  // Handle confirm booking
  const handleConfirmBooking = (sessionData: Omit<Session, 'id' | 'status'>) => {
    if (selectedSession) {
      // Update existing session
      updateUpcomingSession(selectedSession.id, {
        ...sessionData,
        type,
        hourlyRate
      })
    } else {
      // Create new session
      createUpcomingSession({
        ...sessionData,
        type,
        hourlyRate
      })
    }
    setIsBookingDialogOpen(false)
    setSelectedSession(null)
  }
  
  // Handle edit booking
  const handleEditSession = (sessionId: string) => {
    const session = upcomingSessions.find(s => s.id === sessionId)
    if (session) {
      setSelectedSession(session)
      setIsBookingDialogOpen(true)
    }
  }
  
  // Handle cancel booking
  const handleCancelSession = (sessionId: string) => {
    cancelUpcomingSession(sessionId)
  }
  
  // Handle start session (from upcoming to active)
  const handleStartSession = (sessionId?: string) => {
    if (sessionId) {
      startSession(sessionId)
      onSessionStart?.()
    } else {
      // Direct start without an upcoming session - open booking dialog
      setIsBookingDialogOpen(true)
    }
  }
  
  // Main handler to end session (called by ActiveSession via ActiveTab)
  const handleEndSession = (finalCost: number, paymentMethod?: 'cash' | 'card') => {
    console.log('TabCourtCard: Received end session signal with cost:', finalCost, 'Method:', paymentMethod);
    const completedSession = endSession(finalCost, paymentMethod); // Call the hook's end function
    if (completedSession && onSessionEnd) {
       onSessionEnd(completedSession.cost); // Propagate if needed
    }
  }
  
  // Handle view session details
  const handleViewSessionDetails = (sessionId: string) => {
    const session = finishedSessions.find(s => s.id === sessionId)
    if (session) {
      setSelectedSession(session)
      setIsSessionDetailsOpen(true)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 h-[645px] flex flex-col",
        activeSession
          ? "shadow-lg border-orange-400 bg-orange-50/20"
          : "shadow-md hover:shadow-lg border-green-400 bg-green-50/20"
      )}>
        <CardHeader className="pb-1 pt-2 px-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                activeSession ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
              )}>
                {courtNumber || (type === "squash" ? "S" : "T")}
              </div>
              <div>
                <CardTitle className="text-lg">{name}</CardTitle>
              </div>
            </div>
            <Badge variant={activeSession ? "default" : "outline"} className={cn(
              "transition-all",
              activeSession 
                ? "bg-orange-100 hover:bg-orange-100 text-orange-700 border-orange-200"
                : "bg-green-100 text-green-700 border-green-200"
            )}>
              {activeSession ? "In Use" : "Available"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto custom-scrollbar pb-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm w-full">
              <TabsTrigger value="upcoming" className="flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Upcoming ({upcomingSessions.length})</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center justify-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Active {activeSession ? "(1)" : "(0)"}</span>
              </TabsTrigger>
              <TabsTrigger value="finished" className="flex items-center justify-center">
                <CircleDollarSign className="h-4 w-4 mr-1" />
                <span>Finished ({finishedSessions.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Upcoming Bookings</h3>
                <Button onClick={handleCreateBooking} size="sm" className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Book Court
                </Button>
              </div>
              {upcomingSessions.length > 0 ? (
                <SessionList 
                  sessions={upcomingSessions} 
                  isSessionActive={!!activeSession}
                  onStart={handleStartSession}
                  onCancel={handleCancelSession}
                  onEdit={handleEditSession}
                />
              ) : (
                <EmptyState
                  message="No upcoming bookings"
                />
              )}
            </TabsContent>
            
            <TabsContent value="active">
              {activeSession ? (
                <ActiveTab 
                  activeSession={activeSession} // Pass the session state from the hook
                  onUpdateSession={updateActiveSession} // Pass the update function from the hook
                  onEndSession={handleEndSession} // Pass the end handler
                />
              ) : (
                <EmptyState
                  message="No active session"
                  action={
                    <Button onClick={() => handleStartSession()}> 
                      Start Session
                    </Button>
                  }
                />
              )}
            </TabsContent>
            
            <TabsContent value="finished" className="space-y-4">
              {finishedSessions.length > 0 ? (
                <SessionList 
                  sessions={finishedSessions}
                  variant="history"
                  onViewDetails={handleViewSessionDetails}
                />
              ) : (
                <EmptyState message="No finished sessions" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Booking Dialog */}
      <BookingDialog 
        courtId={id}
        courtType={type}
        hourlyRate={hourlyRate}
        isOpen={isBookingDialogOpen}
        onClose={() => {
          setIsBookingDialogOpen(false)
          setSelectedSession(null)
        }}
        onConfirm={handleConfirmBooking}
        existingSession={selectedSession || undefined}
      />
      
      {/* Session Details Dialog */}
      {selectedSession && (
        <EndSessionDialog 
          session={selectedSession}
          isOpen={isSessionDetailsOpen}
          onClose={() => {
            setIsSessionDetailsOpen(false)
            setSelectedSession(null)
          }}
          mode="details"
        />
      )}
    </motion.div>
  )
} 