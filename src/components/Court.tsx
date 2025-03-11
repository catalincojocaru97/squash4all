"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdditionalItems } from "./AdditionalItems"
import { PRICE_INTERVALS, STUDENT_PRICE, ADDITIONAL_ITEMS, CURRENCY_SYMBOL } from "@/types"

interface CourtProps {
  name: string
  type: "squash" | "table-tennis"
  hourlyRate: number
  onSessionStart?: () => void
  onSessionEnd?: (revenue: number) => void
  rentalHours: number
}

// Define time intervals for selection
const TIME_INTERVAL_OPTIONS = [
  { label: "Day (7-17)", value: "day", price: 50 },
  { label: "Evening (17-23)", value: "evening", price: 80 },
  { label: "Weekend", value: "weekend", price: 80 },
]

export function Court({ 
  name, 
  type, 
  hourlyRate,
  onSessionStart,
  onSessionEnd,
  rentalHours
}: CourtProps) {
  const [isActive, setIsActive] = useState(false)
  const [cost, setCost] = useState(0)
  const [isStudent, setIsStudent] = useState(false)
  const [items, setItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [selectedTimeInterval, setSelectedTimeInterval] = useState<string | null>(null)

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

  const getCourtRate = useCallback(() => {
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
  }, [type, hourlyRate, isStudent, canApplyStudentRate, selectedTimeInterval, sessionStartTime])

  const calculateAdditionalCost = useCallback(() => {
    return items.reduce((total, item) => {
      const itemDef = ADDITIONAL_ITEMS.find((i) => i.id === item.itemId)
      return total + (itemDef?.price || 0) * item.quantity
    }, 0)
  }, [items])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        // Calculate court cost based on rental hours, not elapsed time
        const rate = getCourtRate();
        const courtCost = rate * rentalHours;

        // Add additional items cost
        const additionalCost = calculateAdditionalCost();
        setCost(courtCost + additionalCost);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, rentalHours, getCourtRate, calculateAdditionalCost]);

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

  const handleSessionToggle = () => {
    if (isActive) {
      // End session
      setIsActive(false)
      onSessionEnd?.(cost)
      setSessionStartTime(null)
      setItems([])
      setIsStudent(false)
      setSelectedTimeInterval(null)
    } else {
      // Start new session
      setCost(0)
      setIsActive(true)
      setSessionStartTime(new Date())
      // Set default time interval based on current time
      if (type === "squash") {
        setSelectedTimeInterval(determineDefaultTimeInterval())
      }
      onSessionStart?.()
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-orange-100 text-orange-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {isActive ? "In Use" : "Available"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isActive && (
            <div className="text-sm font-medium text-gray-700 bg-gray-100 p-2 rounded">
              {displayRateInfo()}
            </div>
          )}
          <div className="text-xl font-bold">{cost.toFixed(2)} {CURRENCY_SYMBOL}</div>
          
          {isActive && (
            <>
              {type === "squash" && (
                <>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Time Interval</p>
                    <div className="grid grid-cols-1 gap-2">
                      {TIME_INTERVAL_OPTIONS.map((option) => (
                        <label 
                          key={option.value} 
                          className={`flex items-center p-2 border rounded cursor-pointer
                            ${selectedTimeInterval === option.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200'}`}
                        >
                          <input
                            type="radio"
                            name="timeInterval"
                            checked={selectedTimeInterval === option.value}
                            onChange={() => handleTimeIntervalChange(option.value)}
                            className="mr-2"
                          />
                          <span>
                            {option.label} - {option.price} {CURRENCY_SYMBOL}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 ${!canApplyStudentRate ? 'opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isStudent}
                        onChange={(e) => setIsStudent(e.target.checked)}
                        disabled={!canApplyStudentRate}
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        Student Rate (30 {CURRENCY_SYMBOL})
                        {!canApplyStudentRate && " - Only available with Day rate"}
                      </span>
                    </label>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <p className="font-medium">Additional Items</p>
                <AdditionalItems
                  items={items}
                  onItemChange={handleItemChange}
                />
              </div>
            </>
          )}

          <button
            onClick={handleSessionToggle}
            className={`w-full py-2 px-4 rounded-lg text-white transition-colors ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isActive ? "End Session" : "Start Session"}
          </button>
        </div>
      </CardContent>
    </Card>
  )
} 