import { Clock, Users } from "lucide-react" // Add required icons
import React from "react" // Import React for JSX

export interface PriceInterval {
  start: number // Start hour (0-23)
  end: number // End hour (0-23)
  isWeekend: boolean
  price: number // Fixed price in LEI
}

export interface AdditionalItem {
  id: string
  name: string
  price: number
  icon: string
  category: 'equipment' | 'refreshment' | 'other'
}

export interface CourtSession {
  items: { itemId: string; quantity: number }[]
  isStudent: boolean
  startTime: Date
}

// New Session interface to manage all session types
export interface Session {
  id: string
  courtId: string
  playerName: string
  contactInfo?: string
  startTime: Date | null
  endTime: Date | null
  scheduledStartTime?: Date
  scheduledDate?: string // Added field for date selection
  scheduledTime?: string // Added field for time selection
  scheduledDuration: number // in hours
  actualDuration?: number // in seconds
  status: 'upcoming' | 'active' | 'finished'
  cost: number
  items: { itemId: string; quantity: number }[]
  isStudent: boolean
  selectedTimeInterval: string | null
  paymentStatus?: 'paid' | 'unpaid' | 'canceled'
  paymentMethod?: 'cash' | 'card' | null
  notes?: string
  type: "squash" | "table-tennis" // The court type
  hourlyRate: number // Base hourly rate
}

// Constants
export const PRICE_INTERVALS: PriceInterval[] = [
  { start: 7, end: 17, isWeekend: false, price: 50 }, // Weekday normal hours
  { start: 17, end: 23, isWeekend: false, price: 80 }, // Weekday evening
  { start: 7, end: 23, isWeekend: true, price: 80 }, // Weekend all day
]

export const STUDENT_PRICE = 30 // Fixed price in LEI

export const ADDITIONAL_ITEMS: AdditionalItem[] = [
  {
    id: 'racket',
    name: 'Racket',
    price: 5,
    icon: 'racket',
    category: 'equipment'
  },
  {
    id: 'ball-rental',
    name: 'Ball Rental',
    price: 2,
    icon: 'ball',
    category: 'equipment'
  },
  {
    id: 'ball-purchase',
    name: 'Ball Purchase',
    price: 20,
    icon: 'ball',
    category: 'equipment'
  },
  {
    id: 'water',
    name: 'Water',
    price: 6,
    icon: 'water',
    category: 'refreshment'
  },
  {
    id: 'coca-cola',
    name: 'Coca-cola',
    price: 6,
    icon: 'drink',
    category: 'refreshment'
  },
  {
    id: 'gatorade',
    name: 'Gatorade',
    price: 10,
    icon: 'drink',
    category: 'refreshment'
  },
  {
    id: 'arc',
    name: 'Arc',
    price: 10,
    icon: 'drink',
    category: 'refreshment'
  },
  {
    id: 'magneziu',
    name: 'Magneziu',
    price: 10,
    icon: 'drink',
    category: 'refreshment'
  }
]

export const BASE_RATES = {
  squash: 0, // Will be determined by time intervals
  tableTennis: 30 // Table tennis fixed rate
}

export const CURRENCY_SYMBOL = 'lei' 

// Add Court interface for use in TabCourtCard
export interface Court {
  id: string
  name: string
  type: "squash" | "table-tennis"
  hourlyRate: number
  courtNumber?: number
  sessions: Session[]
}

// Define TimeIntervalOption interface for clarity
export interface TimeIntervalOption {
  label: string
  value: string
  price: number
  description: string
  icon: React.ReactNode // Use ReactNode for JSX elements
}

// Define and export TIME_INTERVAL_OPTIONS
export const TIME_INTERVAL_OPTIONS: TimeIntervalOption[] = [
  { 
    label: "Day (7-17)", 
    value: "day", 
    price: 50,
    description: "Standard day rate",
    icon: React.createElement(Clock, { className: "h-4 w-4" })
  },
  { 
    label: "Evening (17-23)", 
    value: "evening", 
    price: 80,
    description: "Premium evening hours",
    icon: React.createElement(Clock, { className: "h-4 w-4" })
  },
  { 
    label: "Weekend", 
    value: "weekend", 
    price: 80,
    description: "Saturday & Sunday",
    icon: React.createElement(Users, { className: "h-4 w-4" })
  },
]