"use client"

import { motion } from "framer-motion"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { ADDITIONAL_ITEMS, CURRENCY_SYMBOL } from "@/types"
import { cn } from "@/lib/utils"

interface AdditionalItemsProps {
  items: { itemId: string; quantity: number }[]
  onItemChange: (itemId: string, quantity: number) => void
}

// Custom category icons
const CATEGORY_ICONS = {
  'equipment': <ShoppingCart className="h-3 w-3" />,
  'refreshment': <ShoppingCart className="h-3 w-3" />,
  'other': <ShoppingCart className="h-3 w-3" />
}

export function AdditionalItems({ items, onItemChange }: AdditionalItemsProps) {
  const getQuantity = (itemId: string) => {
    const item = items.find((i) => i.itemId === itemId)
    return item?.quantity || 0
  }

  // Group items by category
  const groupedItems = ADDITIONAL_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof ADDITIONAL_ITEMS>)

  const categories = Object.keys(groupedItems) as ('equipment' | 'refreshment' | 'other')[]

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category} className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1">
            {CATEGORY_ICONS[category]}
            <span>{category}</span>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 gap-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {groupedItems[category].map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className={cn(
                  "flex items-center justify-between p-2 border rounded-lg transition-all",
                  getQuantity(item.id) > 0 
                    ? "border-blue-300 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.price.toFixed(2)} {CURRENCY_SYMBOL}</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const currentQty = getQuantity(item.id)
                      if (currentQty > 0) {
                        onItemChange(item.id, currentQty - 1)
                      }
                    }}
                    className={cn(
                      "p-1 rounded-full transition-colors",
                      getQuantity(item.id) > 0
                        ? "text-red-500 hover:bg-red-100"
                        : "text-gray-300"
                    )}
                    disabled={getQuantity(item.id) === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className={cn(
                    "w-6 text-center font-medium transition-colors",
                    getQuantity(item.id) > 0 ? "text-blue-600" : "text-gray-400"
                  )}>
                    {getQuantity(item.id)}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const currentQty = getQuantity(item.id)
                      onItemChange(item.id, currentQty + 1)
                    }}
                    className="p-1 rounded-full text-green-500 hover:bg-green-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  )
} 