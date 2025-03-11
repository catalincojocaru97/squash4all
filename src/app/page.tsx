"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CourtCard } from "@/components/CourtCard"
import { BASE_RATES, CURRENCY_SYMBOL } from "@/types"
import { Activity, TrendingUp, Calendar } from "lucide-react"

export default function Home() {
  const [activeSessions, setActiveSessions] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
                Squash4All Facility Manager
              </h1>
              <p className="text-gray-500 text-sm">Manage court bookings and sessions</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="py-2 px-4">
                  <CardDescription className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <Activity className="h-3.5 w-3.5 mr-1" />
                      <span>Active Sessions</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">{activeSessions}</div>
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="py-2 px-4">
                  <CardDescription className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-green-600 font-medium">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Available Courts</span>
                    </div>
                    <div className="text-lg font-bold text-green-900">{6 - activeSessions}</div>
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="py-2 px-4">
                  <CardDescription className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-purple-600 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 mr-1" />
                      <span>Total Revenue</span>
                    </div>
                    <div className="text-lg font-bold text-purple-900">{totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}</div>
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
          
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
                  <CourtCard
                    name={`Squash Court ${index + 1}`}
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
                <CourtCard
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
      
      <footer className="bg-white border-t border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <div className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} Squash4All Facility Management System
          </div>
        </div>
      </footer>
      
      <Toaster />
    </div>
  )
}
