import React, { useEffect, useState, useCallback } from "react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Calendar, CreditCard, Banknote, Clock, Award, ShoppingCart, Coffee, Users } from "lucide-react"
import { CURRENCY_SYMBOL, ADDITIONAL_ITEMS, Session } from "@/types"
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
  
  // Define loadReportData with useCallback
  const loadReportData = useCallback(() => {
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
            
            // Update rate breakdown - modified to handle table tennis separately
            let rateType;
            if (session.type === 'table-tennis') {
              rateType = 'table-tennis';
            } else {
              rateType = session.isStudent ? 'student' : (session.selectedTimeInterval || 'day');
            }

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
  }, [date, setReportData]);
  
  // Load and process data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, loadReportData]);
  
  // Calculate totals
  const grandTotal = reportData.cash.totalRevenue + reportData.card.totalRevenue;
  const totalSessions = reportData.cash.totalSessions + reportData.card.totalSessions;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl tracking-tight text-foreground">
            <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Daily Activity Report
            <span className="ml-2 text-sm font-normal text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(date, 'EEEE, MMMM d, yyyy')}
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="border border-border rounded-t-lg overflow-hidden mb-0">
              {/* Two column layout for payment methods */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Cash column */}
                <div className="border-r border-border flex flex-col">
                  <div className="p-3 flex items-center justify-between bg-yellow-50 dark:bg-yellow-950/30 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">Cash Payments</h3>
                    </div>
                    <div className="text-sm font-medium text-yellow-900 dark:text-yellow-300">{reportData.cash.totalSessions} Sessions</div>
                  </div>
                  
                  <div className="p-4 flex-grow overflow-y-auto">
                    {/* Rate breakdown */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Rate Breakdown
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.cash.rateBreakdown).map(([rateType, data]) => {
                          let icon;
                          let label;
                          
                          if (rateType === 'day') {
                            icon = <Clock className="h-4 w-4 text-muted-foreground" />;
                            label = "Day Rate (7-17)";
                          } else if (rateType === 'evening') {
                            icon = <Clock className="h-4 w-4 text-muted-foreground" />;
                            label = "Evening Rate (17-23)";
                          } else if (rateType === 'weekend') {
                            icon = <Users className="h-4 w-4 text-muted-foreground" />;
                            label = "Weekend Rate";
                          } else if (rateType === 'student') {
                            icon = <Award className="h-4 w-4 text-muted-foreground" />;
                            label = "Student Rate";
                          } else if (rateType === 'table-tennis') {
                            icon = <Users className="h-4 w-4 text-muted-foreground" />;
                            label = "Table Tennis";
                          } else {
                            icon = <Clock className="h-4 w-4 text-muted-foreground" />;
                            label = rateType;
                          }
                          
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={rateType} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="text-sm text-foreground">{label}</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-sm text-muted-foreground">{data.count}x</span>
                                <span className="text-sm font-medium text-foreground">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.values(reportData.cash.rateBreakdown).every(d => d.count === 0) && (
                          <div className="text-sm text-muted-foreground text-center py-2">No rate data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Equipment */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Equipment
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.cash.equipment).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
                              <span className="text-sm text-foreground">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-muted-foreground">{data.count}x</span>
                                <span className="text-sm font-medium text-foreground">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.cash.equipment).length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">No equipment data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Refreshments */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        Refreshments
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.cash.refreshments).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
                              <span className="text-sm text-foreground">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-muted-foreground">{data.count}x</span>
                                <span className="text-sm font-medium text-foreground">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.cash.refreshments).length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">No refreshment data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Cash Column Total - Fixed at the bottom of the cash column */}
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border-t border-border sticky bottom-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-yellow-900 dark:text-yellow-300">Column Total:</div>
                      <div className="flex items-center gap-2 font-semibold text-yellow-800 dark:text-yellow-300">
                        <Banknote className="h-4 w-4" />
                        {reportData.cash.totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card column */}
                <div className="flex flex-col">
                  <div className="p-3 flex items-center justify-between bg-green-50 dark:bg-green-950/30 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-700 dark:text-green-500" />
                      <h3 className="font-semibold text-green-900 dark:text-green-300">Card Payments</h3>
                    </div>
                    <div className="text-sm font-medium text-green-900 dark:text-green-300">{reportData.card.totalSessions} Sessions</div>
                  </div>
                  
                  <div className="p-4 flex-grow overflow-y-auto">
                    {/* Rate breakdown */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Rate Breakdown
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.card.rateBreakdown).map(([rateType, data]) => {
                          let icon;
                          let label;
                          
                          if (rateType === 'day') {
                            icon = <Clock className="h-4 w-4 text-muted-foreground" />;
                            label = "Day Rate (7-17)";
                          } else if (rateType === 'evening') {
                            icon = <Clock className="h-4 w-4 text-muted-foreground" />;
                            label = "Evening Rate (17-23)";
                          } else if (rateType === 'weekend') {
                            icon = <Users className="h-4 w-4 text-muted-foreground" />;
                            label = "Weekend Rate";
                          } else if (rateType === 'student') {
                            icon = <Award className="h-4 w-4 text-muted-foreground" />;
                            label = "Student Rate";
                          } else if (rateType === 'table-tennis') {
                            icon = <Users className="h-4 w-4 text-muted-foreground" />;
                            label = "Table Tennis";
                          } else {
                            icon = <Clock className="h-4 w-4 text-muted-foreground" />;
                            label = rateType;
                          }
                          
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={rateType} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="text-sm text-foreground">{label}</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-sm text-muted-foreground">{data.count}x</span>
                                <span className="text-sm font-medium text-foreground">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.values(reportData.card.rateBreakdown).every(d => d.count === 0) && (
                          <div className="text-sm text-muted-foreground text-center py-2">No rate data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Equipment */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Equipment
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.card.equipment).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
                              <span className="text-sm text-foreground">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-muted-foreground">{data.count}x</span>
                                <span className="text-sm font-medium text-foreground">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.card.equipment).length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">No equipment data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Refreshments */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        Refreshments
                      </h4>
                      
                      <div className="space-y-2">
                        {Object.entries(reportData.card.refreshments).map(([key, data]) => {
                          const item = ADDITIONAL_ITEMS.find(i => i.id === key);
                          if (data.count === 0) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
                              <span className="text-sm text-foreground">{item?.name || key}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-muted-foreground">{data.count}x</span>
                                <span className="text-sm font-medium text-foreground">{data.revenue.toFixed(2)} {CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {Object.keys(reportData.card.refreshments).length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">No refreshment data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Column Total - Fixed at the bottom of the card column */}
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border-t border-border sticky bottom-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-green-900 dark:text-green-300">Column Total:</div>
                      <div className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
                        <CreditCard className="h-4 w-4" />
                        {reportData.card.totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Summary footer - directly attached to the table above */}
            <div className="border-t-0 border border-border rounded-b-lg overflow-hidden">
              <div className="p-4 bg-muted/30 dark:bg-muted/20 flex flex-col md:flex-row justify-center items-center gap-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">{grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-sm font-medium text-foreground">{totalSessions} Sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between items-center gap-2 mt-4">
          <div className="text-sm text-muted-foreground">
            Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}
          </div>
          <div>
            <AlertDialogAction
              onClick={onClose}
              className="bg-muted hover:bg-muted/80 text-foreground"
            >
              Close
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 