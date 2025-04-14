import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Session } from "@/types"
import { useCourtSessions } from "@/hooks/useCourtSessions"
import { SessionList } from "@/components/SessionList"
import { ActiveSession } from "@/components/ActiveSession"
import { EmptyState } from "@/components/EmptyState"
import { BookingDialog } from "@/components/BookingDialog"
import { EndSessionDialog } from "@/components/EndSessionDialog"
import { Calendar, Clock, CircleDollarSign, Plus } from "lucide-react"
import { motion } from "framer-motion"
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

// Active Tab showing current active session
// Moved definition outside TabCourtCard for clarity and performance
// No longer needed as the content has been integrated directly into the component
// interface ActiveTabProps {
//   activeSession: Session;
//   onEndSession: (finalCost: number, paymentMethod?: 'cash' | 'card') => void;
//   onUpdateSession: (updates: Partial<Session>) => void;
// }

// function ActiveTab({ activeSession, onEndSession, onUpdateSession }: ActiveTabProps) {

//   // Handler for adding/removing items - update parent via onUpdateSession
//   const handleAddItems = (newItems: { itemId: string; quantity: number }[]) => {
//     onUpdateSession({ items: newItems });
//   };

//   // Handler for updating session details (rate, student status) - update parent via onUpdateSession
//   const handleUpdateDetails = (updates: { isStudent?: boolean; selectedTimeInterval?: string }) => {
//     onUpdateSession(updates);
//   };

//   return (
//     <div className="p-4">
//       <ActiveSession 
//         session={activeSession} 
//         onEnd={onEndSession} // Pass the main endSession handler directly
//         onAddItems={handleAddItems} // Use the new handler
//         onUpdateSessionDetails={handleUpdateDetails} // Pass the new handler
//       />
//     </div>
//   );
// }

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
  const [activeTab, setActiveTab] = useState<string>("active")
  
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
      setActiveTab("active") // Switch to the active tab
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
          ? "shadow-lg border-orange-400 dark:border-orange-600 bg-orange-50/20 dark:bg-orange-950/40"
          : "shadow-md hover:shadow-lg border-green-400 dark:border-green-600 bg-green-50/20 dark:bg-green-950/40"
      )}>
        <CardHeader className="pb-1 pt-2 px-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                activeSession 
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-400" 
                  : "bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-400"
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
                ? "bg-orange-100 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/60 dark:text-orange-300 dark:border-orange-800"
                : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/60 dark:text-green-300 dark:border-green-800"
            )}>
              {activeSession ? "In Use" : "Available"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden flex flex-col p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="bg-card rounded-md p-1.5 flex border border-border">
                <TabsList className="bg-transparent p-0 w-full flex justify-between">
                  <TabsTrigger value="upcoming" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=active]:bg-muted/80 data-[state=active]:text-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Upcoming ({upcomingSessions.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=active]:bg-muted/80 data-[state=active]:text-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Active {activeSession ? "(1)" : "(0)"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="finished" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=active]:bg-muted/80 data-[state=active]:text-foreground">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Finished ({finishedSessions.length})</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <TabsContent value="upcoming" className="space-y-4 p-4 overflow-y-auto custom-scrollbar flex-grow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-foreground">Upcoming Bookings</h3>
                <Button onClick={handleCreateBooking} size="sm" className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
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
            
            <TabsContent value="active" className="flex flex-col h-full overflow-hidden">
              {activeSession ? (
                <div className="flex flex-col h-full">
                  <div className="overflow-y-auto custom-scrollbar flex-grow px-4">
                    <ActiveSession 
                      session={activeSession} 
                      onAddItems={(items) => updateActiveSession({ items })}
                      onUpdateSessionDetails={(updates) => updateActiveSession(updates)}
                    />
                  </div>
                  <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-border mt-2">
                    <EndSessionDialog
                      session={activeSession}
                      currentCost={activeSession.cost}
                      elapsedTime={activeSession.actualDuration || 0}
                      items={activeSession.items}
                      getSessionRate={() => activeSession.hourlyRate}
                      onCompleteWithPayment={(paymentMethod) => handleEndSession(activeSession.cost, paymentMethod)}
                      onCancelWithoutPayment={() => handleEndSession(0)}
                    />
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4">
                  <EmptyState
                    message="No active session"
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="finished" className="space-y-4 p-4 overflow-y-auto custom-scrollbar flex-grow">
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