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