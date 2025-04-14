"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { motion } from "framer-motion"
import { Card, CardHeader, CardDescription } from "@/components/ui/card"
import { TabCourtCard } from "@/components/TabCourtCard"
import { BASE_RATES, CURRENCY_SYMBOL } from "@/types"
import { Activity, TrendingUp, Calendar, FileText, History, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DayReportDialog } from "@/components/DayReportDialog"
import { ResetHistoryDialog } from "@/components/ResetHistoryDialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { isBefore, startOfDay, subDays, subWeeks, subMonths } from "date-fns"

export default function Home() {
  const [activeSessions, setActiveSessions] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)

  const handleSessionStart = () => {
    setActiveSessions((prev) => prev + 1)
    toast.success("Session started", {
      description: "The court is now in use",
      position: "bottom-right",
    })
  }

  const handleSessionEnd = (revenue: number | null) => {
    setActiveSessions((prev) => prev - 1)
    if (revenue !== null) {
      setTotalRevenue((prev) => prev + revenue)
      toast.success(`Session completed: ${revenue.toFixed(2)} ${CURRENCY_SYMBOL}`, {
        description: "Revenue has been added to the total",
        position: "bottom-right",
      })
    } else {
      toast.info("Session cancelled", {
        description: "No revenue was recorded for this session",
        position: "bottom-right",
      })
    }
  }

  const handleResetHistory = (timeframe: 'yesterday' | 'week' | 'month' | 'all') => {
    try {
      // Get the current data from localStorage
      const storedData = localStorage.getItem('squash4all_sessions')
      if (!storedData) return

      const parsedData = JSON.parse(storedData)
      const courts = parsedData.courts || {}
      let totalRemoved = 0

      // Set cutoff date based on timeframe
      const today = startOfDay(new Date())
      let cutoffDate: Date

      switch (timeframe) {
        case 'yesterday':
          cutoffDate = subDays(today, 1)
          break
        case 'week':
          cutoffDate = subWeeks(today, 1)
          break
        case 'month':
          cutoffDate = subMonths(today, 1)
          break
        case 'all':
          cutoffDate = new Date(8640000000000000) // Far future date to include all
          break
      }

      // Process each court
      Object.keys(courts).forEach(courtId => {
        const courtData = courts[courtId]
        const finishedSessions = courtData.finished || []

        // Filter out sessions before the cutoff date
        const filteredSessions = finishedSessions.filter((session: any) => {
          if (!session.endTime) return true
          const sessionDate = new Date(session.endTime)
          // Keep sessions that ended after the cutoff date
          return !isBefore(sessionDate, cutoffDate)
        })

        totalRemoved += finishedSessions.length - filteredSessions.length

        // Update the court data with filtered sessions
        courts[courtId].finished = filteredSessions
      })

      // Save the updated data back to localStorage
      localStorage.setItem('squash4all_sessions', JSON.stringify(parsedData))

      // Reset the total revenue since we can't accurately know what was from today
      if (timeframe === 'all') {
        setTotalRevenue(0)
      }

      // Show success message
      toast.success(`History reset complete`, {
        description: `Removed ${totalRemoved} historical session${totalRemoved !== 1 ? 's' : ''}.`,
        position: "bottom-right",
      })

    } catch (error) {
      console.error('Error resetting history:', error)
      toast.error('Failed to reset history', {
        description: 'An error occurred while trying to reset historical data.',
        position: "bottom-right",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text dark:from-blue-400 dark:to-indigo-400">
                  Squash4All
                </h1>
                <p className="text-muted-foreground text-xs">Facility Manager</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-1.5 text-xs"
                onClick={() => setIsReportOpen(true)}
              >
                <FileText className="h-3.5 w-3.5" />
                Day Report
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-900"
                onClick={() => setIsResetOpen(true)}
              >
                <History className="h-3.5 w-3.5" />
                Reset History
              </Button>

              <ThemeToggle />

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <h2 className="text-xl font-bold mb-4">Court Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Squash Courts */}
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={`squash-${index + 1}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <TabCourtCard
                    id={`squash-${index + 1}`}
                    name={`Squash Court`}
                    type="squash"
                    courtNumber={index + 1}
                    hourlyRate={BASE_RATES.squash}
                    onSessionStart={handleSessionStart}
                    onSessionEnd={handleSessionEnd}
                  />
                </motion.div>
              ))}

              {/* Table Tennis Court */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <TabCourtCard
                  id="table-tennis-1"
                  name="Table Tennis"
                  type="table-tennis"
                  hourlyRate={BASE_RATES.tableTennis}
                  onSessionStart={handleSessionStart}
                  onSessionEnd={handleSessionEnd}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border py-3">
        <div className="container mx-auto px-4">
          <div className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Squash4All Facility Management System
          </div>
        </div>
      </footer>

      <Toaster />

      {/* Day Report Dialog */}
      <DayReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        date={new Date()}
      />

      {/* Reset History Dialog */}
      <ResetHistoryDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetHistory}
      />
    </div>
  )
}
