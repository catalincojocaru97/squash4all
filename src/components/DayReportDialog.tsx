import React, { useEffect, useState } from "react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Calendar, ArrowDownToLine, ChevronUp, CreditCard, Banknote, Clock, Award, ShoppingCart, Coffee, DollarSign, Users } from "lucide-react"
import { CURRENCY_SYMBOL, ADDITIONAL_ITEMS, TIME_INTERVAL_OPTIONS, Session } from "@/types"
import { format, isSameDay } from "date-fns"

interface DayReportDialogProps {
  isOpen: boolean
  onClose: () => void
  date?: Date
}

interface ReportData {
  cash: {
    totalSessions: number;
    totalRevenue: number;
    rateBreakdown: Record<string, { count: number; revenue: number }>;
    equipment: Record<string, { count: number; revenue: number }>;
    refreshments: Record<string, { count: number; revenue: number }>;
  };
  card: {
    totalSessions: number;
    totalRevenue: number;
    rateBreakdown: Record<string, { count: number; revenue: number }>;
    equipment: Record<string, { count: number; revenue: number }>;
    refreshments: Record<string, { count: number; revenue: number }>;
  };
}

export function DayReportDialog({ 
  isOpen,
  onClose,
  date = new Date()
}: DayReportDialogProps) {
  const [reportData, setReportData] = useState<ReportData>({
    cash: {
      totalSessions: 0,
      totalRevenue: 0,
      rateBreakdown: { day: { count: 0, revenue: 0 }, evening: { count: 0, revenue: 0 }, weekend: { count: 0, revenue: 0 }, student: { count: 0, revenue: 0 } },
      equipment: {},
      refreshments: {}
    },
    card: {
      totalSessions: 0,
      totalRevenue: 0,
      rateBreakdown: { day: { count: 0, revenue: 0 }, evening: { count: 0, revenue: 0 }, weekend: { count: 0, revenue: 0 }, student: { count: 0, revenue: 0 } },
      equipment: {},
      refreshments: {}
    }
  });
  
  // Load and process data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, date]);
  
  const loadReportData = () => {
    try {
      // Initialize empty report structure
      const newReport: ReportData = {
        cash: {
          totalSessions: 0,
          totalRevenue: 0,
          rateBreakdown: { day: { count: 0, revenue: 0 }, evening: { count: 0, revenue: 0 }, weekend: { count: 0, revenue: 0 }, student: { count: 0, revenue: 0 } },
          equipment: {},
          refreshments: {}
        },
        card: {
          totalSessions: 0,
          totalRevenue: 0,
          rateBreakdown: { day: { count: 0, revenue: 0 }, evening: { count: 0, revenue: 0 }, weekend: { count: 0, revenue: 0 }, student: { count: 0, revenue: 0 } },
          equipment: {},
          refreshments: {}
        }
      };
      
      // Get data from localStorage
      const storedData = localStorage.getItem('squash4all_sessions');
      if (!storedData) {
        setReportData(newReport);
        return;
      }
      
      const parsedData = JSON.parse(storedData);
      const courts = parsedData.courts || {};
      
      // Iterate through all courts
      Object.keys(courts).forEach(courtId => {
        const courtData = courts[courtId];
        const finishedSessions = courtData.finished || [];
        
        // Filter for finished sessions with payment on the selected date
        finishedSessions
          .filter((session: Session) => 
            session.status === 'finished' && 
            session.paymentStatus === 'paid' && 
            session.paymentMethod && 
            session.endTime && 
            isSameDay(new Date(session.endTime), date)
          )
          .forEach((session: Session) => {
            const paymentMethod = session.paymentMethod as 'cash' | 'card';
            if (!paymentMethod) return; // Skip if no payment method
            
            // Update the report for this payment method
            const report = newReport[paymentMethod];
            
            // Increment total sessions and revenue
            report.totalSessions += 1;
            report.totalRevenue += session.cost;
            
            // Update rate breakdown
            const rateType = session.isStudent ? 'student' : (session.selectedTimeInterval || 'day');
            if (!report.rateBreakdown[rateType]) {
              report.rateBreakdown[rateType] = { count: 0, revenue: 0 };
            }
            report.rateBreakdown[rateType].count += 1;
            
            // Calculate base rate revenue (excluding items)
            let baseRevenue = session.cost;
            session.items.forEach(item => {
              const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
              if (itemDef) {
                baseRevenue -= itemDef.price * item.quantity;
              }
            });
            report.rateBreakdown[rateType].revenue += baseRevenue;
            
            // Update equipment and refreshments
            session.items.forEach(item => {
              const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
              if (!itemDef) return;
              
              const category = itemDef.category === 'refreshment' ? 'refreshments' : 'equipment';
              
              if (!report[category][item.itemId]) {
                report[category][item.itemId] = { count: 0, revenue: 0 };
              }
              
              report[category][item.itemId].count += item.quantity;
              report[category][item.itemId].revenue += itemDef.price * item.quantity;
            });
          });
      });
      
      setReportData(newReport);
    } catch (error) {
      console.error('Error loading report data:', error);
      // Show a simple error message or fallback to empty data
    }
  };
  
  // Calculate totals
  const grandTotal = reportData.cash.totalRevenue + reportData.card.totalRevenue;
  const totalSessions = reportData.cash.totalSessions + reportData.card.totalSessions;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl tracking-tight">
            <FileText className="h-5 w-5 text-blue-500" />
            Daily Activity Report
            <span className="ml-2 text-sm font-normal text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(date, 'EEEE, MMMM d, yyyy')}
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="border rounded-lg mb-4 overflow-hidden">
              {/* Summary header */}
              <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-gray-900">{grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Total Revenue</span>
                    <span className="text-sm font-medium text-gray-700">{totalSessions} Sessions</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 rounded-md text-yellow-800 font-medium">
                    <Banknote className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-xs">Cash</span>
                      <span>{reportData.cash.totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-md text-green-800 font-medium">
                    <CreditCard className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-xs">Card</span>
                      <span>{reportData.card.totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Two column layout for payment methods */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Cash column */}
                <div className="border-r">
                  <div className="p-3 flex items-center justify-between bg-yellow-50 border-b">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-yellow-700" />
                      <h3 className="font-semibold text-yellow-900">Cash Payments</h3>
                    </div>
                    <div className="text-sm font-medium text-yellow-900">{reportData.cash.totalSessions} Sessions</div>
                  </div>
                  
                  <div className="p-4">
                    {/* Rate breakdown */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Rate Breakdown
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.cash.rateBreakdown).map(([rateType, data]) => {
                          let icon;
                          let label;
                          
                          if (rateType === 'day') {
                            icon = <Clock className="h-4 w-4 text-gray-500" />;
                            label = "Day Rate (7-17)";
                          } else if (rateType === 'evening') {
                            icon = <Clock className="h-4 w-4 text-gray-500" />;
                            label = "Evening Rate (17-23)";
                          } else if (rateType === 'weekend') {
                            icon = <Users className="h-4 w-4 text-gray-500" />;
                            label = "Weekend Rate";
                          } else if (rateType === 'student') {
                            icon = <Award className="h-4 w-4 text-gray-500" />;
                            label = "Student Rate";
                          } else {
                            icon = <Clock className="h-4 w-4 text-gray-500" />;
                            label = rateType;
                          }
                          
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={rateType} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="text-sm">{label}</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-500">{data.count}x</span>
                                <span className="text-sm font-medium">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.values(reportData.cash.rateBreakdown).every(d => d.count === 0) && (
                          <div className="text-sm text-gray-500 text-center py-2">No rate data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Equipment */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                        Equipment
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.cash.equipment).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                              <span className="text-sm">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-500">{data.count}x</span>
                                <span className="text-sm font-medium">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.cash.equipment).length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-2">No equipment data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Refreshments */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-gray-400" />
                        Refreshments
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.cash.refreshments).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                              <span className="text-sm">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-500">{data.count}x</span>
                                <span className="text-sm font-medium">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.cash.refreshments).length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-2">No refreshment data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card column */}
                <div>
                  <div className="p-3 flex items-center justify-between bg-green-50 border-b">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-700" />
                      <h3 className="font-semibold text-green-900">Card Payments</h3>
                    </div>
                    <div className="text-sm font-medium text-green-900">{reportData.card.totalSessions} Sessions</div>
                  </div>
                  
                  <div className="p-4">
                    {/* Rate breakdown */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Rate Breakdown
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.card.rateBreakdown).map(([rateType, data]) => {
                          let icon;
                          let label;
                          
                          if (rateType === 'day') {
                            icon = <Clock className="h-4 w-4 text-gray-500" />;
                            label = "Day Rate (7-17)";
                          } else if (rateType === 'evening') {
                            icon = <Clock className="h-4 w-4 text-gray-500" />;
                            label = "Evening Rate (17-23)";
                          } else if (rateType === 'weekend') {
                            icon = <Users className="h-4 w-4 text-gray-500" />;
                            label = "Weekend Rate";
                          } else if (rateType === 'student') {
                            icon = <Award className="h-4 w-4 text-gray-500" />;
                            label = "Student Rate";
                          } else {
                            icon = <Clock className="h-4 w-4 text-gray-500" />;
                            label = rateType;
                          }
                          
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={rateType} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="text-sm">{label}</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-500">{data.count}x</span>
                                <span className="text-sm font-medium">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.values(reportData.card.rateBreakdown).every(d => d.count === 0) && (
                          <div className="text-sm text-gray-500 text-center py-2">No rate data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Equipment */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                        Equipment
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.card.equipment).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                              <span className="text-sm">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-500">{data.count}x</span>
                                <span className="text-sm font-medium">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.card.equipment).length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-2">No equipment data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Refreshments */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-gray-400" />
                        Refreshments
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.card.refreshments).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                              <span className="text-sm">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-500">{data.count}x</span>
                                <span className="text-sm font-medium">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.card.refreshments).length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-2">No refreshment data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between items-center gap-2">
          <div className="text-sm text-gray-500">
            Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}
          </div>
          <div className="space-x-2">
            <AlertDialogAction
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Export Report
            </AlertDialogAction>
            <AlertDialogAction
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Close
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 