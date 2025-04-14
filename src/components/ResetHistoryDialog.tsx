import React, { useState } from "react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, AlertTriangle } from "lucide-react"
import { format, subDays, subWeeks, subMonths } from "date-fns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type ResetTimeframe = 'yesterday' | 'week' | 'month' | 'all';

interface ResetHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (timeframe: ResetTimeframe) => void
}

export function ResetHistoryDialog({ 
  isOpen,
  onClose,
  onConfirm
}: ResetHistoryDialogProps) {
  const [timeframe, setTimeframe] = useState<ResetTimeframe>('yesterday');
  
  const getTimeframeDescription = () => {
    const today = new Date();
    
    switch(timeframe) {
      case 'yesterday':
        return `before ${format(subDays(today, 1), 'MMMM d, yyyy')}`;
      case 'week':
        return `before ${format(subWeeks(today, 1), 'MMMM d, yyyy')}`;
      case 'month':
        return `before ${format(subMonths(today, 1), 'MMMM d, yyyy')}`;
      case 'all':
        return 'all historical data';
      default:
        return '';
    }
  };
  
  const handleConfirm = () => {
    onConfirm(timeframe);
    onClose();
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Reset Historical Data
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Warning: This action cannot be undone</p>
                  <p className="text-sm text-amber-700">
                    You are about to delete completed sessions {getTimeframeDescription()}.
                    This will permanently remove all historical booking records, payment data, and revenue information.
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="mb-3 font-medium">Select timeframe to reset:</div>
                
                <RadioGroup value={timeframe} onValueChange={(value) => setTimeframe(value as ResetTimeframe)} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yesterday" id="yesterday" />
                    <Label htmlFor="yesterday" className="cursor-pointer">Yesterday and before</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week" className="cursor-pointer">Last week and before</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month" className="cursor-pointer">Last month and before</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer">All historical data</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-gray-300">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Reset Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 