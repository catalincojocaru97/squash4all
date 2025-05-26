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
import { CURRENCY_SYMBOL, ADDITIONAL_ITEMS, Session, STUDENT_PRICE, DISCOUNT_CARD_AMOUNT, TIME_INTERVAL_OPTIONS } from "@/types"
import { format, isSameDay } from "date-fns"

interface DayReportDialogProps {
  isOpen: boolean
  onClose: () => void
  date?: Date
}

interface RateBreakdownItem {
  count: number;
  revenue: number;
  originalRateLabel: string;
  numDiscountCards: number;
}

interface PaymentMethodReport {
  totalSessions: number;
  totalRevenue: number;
  rateBreakdown: Record<string, RateBreakdownItem>;
  equipment: Record<string, { count: number; revenue: number }>;
  refreshments: Record<string, { count: number; revenue: number }>;
}

interface ReportData {
  cash: PaymentMethodReport;
  card: PaymentMethodReport;
}

export function DayReportDialog({
  isOpen,
  onClose,
  date = new Date()
}: DayReportDialogProps) {
  const [reportData, setReportData] = useState<ReportData>(() => ({
    cash: {
      totalSessions: 0,
      totalRevenue: 0,
      rateBreakdown: {},
      equipment: {},
      refreshments: {}
    },
    card: {
      totalSessions: 0,
      totalRevenue: 0,
      rateBreakdown: {},
      equipment: {},
      refreshments: {}
    }
  }));

  const loadReportData = useCallback(() => {
    try {
      const newReport: ReportData = {
        cash: { totalSessions: 0, totalRevenue: 0, rateBreakdown: {}, equipment: {}, refreshments: {} },
        card: { totalSessions: 0, totalRevenue: 0, rateBreakdown: {}, equipment: {}, refreshments: {} }
      };

      const storedData = localStorage.getItem('squash4all_sessions');
      if (!storedData) {
        setReportData(newReport);
        return;
      }

      const parsedData = JSON.parse(storedData);
      const courts = parsedData.courts || {};

      Object.keys(courts).forEach(courtId => {
        const courtData = courts[courtId];
        const finishedSessions: Session[] = courtData.finished || [];

        finishedSessions
          .filter(session =>
            session.status === 'finished' &&
            session.paymentStatus === 'paid' &&
            session.paymentMethod &&
            session.endTime &&
            isSameDay(new Date(session.endTime), date)
          )
          .forEach(session => {
            const paymentMethod = session.paymentMethod as 'cash' | 'card';
            const report = newReport[paymentMethod];

            report.totalSessions += 1;
            report.totalRevenue += session.cost;

            let rateKeyPart: string = session.type;
            let originalRateLabel = "";

            if (session.type === 'squash') {
              if (session.hasSubscription) {
                rateKeyPart = 'squash-subscription';
                originalRateLabel = 'Subscription';
              } else if (session.isStudent) {
                rateKeyPart = 'squash-student';
                originalRateLabel = 'Student Rate';
              } else {
                const timeIntervalValue = session.selectedTimeInterval || 'day';
                rateKeyPart = `squash-${timeIntervalValue}`;
                const rateOption = TIME_INTERVAL_OPTIONS.find(opt => opt.value === timeIntervalValue);
                originalRateLabel = rateOption ? rateOption.label : 'Squash Rate';
              }
            } else { // table-tennis
              rateKeyPart = 'table-tennis-fixed';
              originalRateLabel = 'Table Tennis Rate';
            }

            const discountKeyPart = session.discountCards || 0;
            const finalRateKey = `${rateKeyPart}-${discountKeyPart}`;

            if (!report.rateBreakdown[finalRateKey]) {
              report.rateBreakdown[finalRateKey] = {
                count: 0,
                revenue: 0,
                originalRateLabel: originalRateLabel,
                numDiscountCards: discountKeyPart
              };
            }
            report.rateBreakdown[finalRateKey].count += 1;

            let itemsTotalCost = 0;
            session.items.forEach(item => {
              const itemDef = ADDITIONAL_ITEMS.find(i => i.id === item.itemId);
              if (itemDef) {
                itemsTotalCost += itemDef.price * item.quantity;
              }
            });

            const courtRevenueForSession = session.cost - itemsTotalCost;
            report.rateBreakdown[finalRateKey].revenue += courtRevenueForSession;

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
    }
  }, [date]);

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, loadReportData]);

  const grandTotal = reportData.cash.totalRevenue + reportData.card.totalRevenue;
  const totalSessions = reportData.cash.totalSessions + reportData.card.totalSessions;

  const getRateDisplayLabel = (item: RateBreakdownItem): string => {
    let label = item.originalRateLabel;
    if (item.originalRateLabel === 'Subscription') {
      label = 'Subscription (No Court Fee)';
    }

    if (item.numDiscountCards > 0) {
      label += ` - ${item.numDiscountCards} Discount Card${item.numDiscountCards > 1 ? 's' : ''}`;
    }
    return label;
  };

  const renderRateBreakdown = (breakdown: Record<string, RateBreakdownItem>) => {
    const entries = Object.entries(breakdown)
      .filter(([, data]) => data.count > 0)
      .sort(([, a], [, b]) => {
        const effectiveRateA = a.count > 0 ? a.revenue / a.count : 0;
        const effectiveRateB = b.count > 0 ? b.revenue / b.count : 0;
        return effectiveRateB - effectiveRateA;
      });

    if (entries.length === 0) {
      return <div className="text-sm text-muted-foreground text-center py-2">No court revenue data available</div>;
    }

    return entries.map(([key, data]) => {
      let icon = <Clock className="h-4 w-4 text-muted-foreground" />;
      if (key.includes('student')) icon = <Award className="h-4 w-4 text-muted-foreground" />;
      else if (key.includes('weekend')) icon = <Users className="h-4 w-4 text-muted-foreground" />;
      else if (key.includes('subscription')) icon = <Award className="h-4 w-4 text-purple-500" />;
      else if (key.includes('table-tennis')) icon = <Users className="h-4 w-4 text-muted-foreground" />;
      
      const effectiveRate = data.count > 0 ? data.revenue / data.count : 0;

      return (
        <div key={key} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
          <div className="flex items-center gap-2 flex-grow-[2] basis-0">
            {icon}
            <span className="text-sm text-foreground truncate">{getRateDisplayLabel(data)}</span>
          </div>
          <div className="flex gap-1 items-center justify-end flex-grow-[1] basis-0">
            <span className="text-sm text-muted-foreground">{data.count}x</span>
            <span className="text-sm font-medium text-foreground min-w-[50px] text-right">{effectiveRate.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-0.5">{CURRENCY_SYMBOL}</span>
            <span className="text-sm text-muted-foreground mx-1 ml-6">=</span>
            <span className="text-sm font-medium text-foreground min-w-[60px] text-right">{data.revenue.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-0.5">{CURRENCY_SYMBOL}</span>
          </div>
        </div>
      );
    });
  };

  const renderItemsBreakdown = (itemsData: Record<string, { count: number; revenue: number }>, categoryName: string) => {
    const entries = Object.entries(itemsData);
    if (entries.length === 0 || entries.every(([, data]) => data.count === 0)) {
      return <div className="text-sm text-muted-foreground text-center py-2">No {categoryName.toLowerCase()} data available</div>;
    }
    return entries.map(([key, data]) => {
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
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl tracking-tight text-foreground">
            <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Daily Activity Report
            <span className="ml-2 text-sm font-normal text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(date, 'EEEE, MMMM d, yyyy')}
            </span>
          </AlertDialogTitle>
        </AlertDialogHeader>
        {/* 
          AlertDialogDescription is typically used for short descriptions.
          For complex content like this report, it's better to structure it within the main content area
          or ensure AlertDialogContent itself is scrollable and handles the layout.
          The following div acts as the main content body for the report.
        */}
        <div className="mt-4 space-y-6 text-sm text-muted-foreground">
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Cash column */}
                <div className="border-r-0 md:border-r border-border flex flex-col">
                  <div className="p-3 flex items-center justify-between bg-yellow-50 dark:bg-yellow-950/30 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">Cash Payments</h3>
                    </div>
                    <div className="text-sm font-medium text-yellow-900 dark:text-yellow-300">{reportData.cash.totalSessions} Sessions</div>
                  </div>
                  <div className="p-4 flex-grow space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Court Revenue Breakdown
                      </h4>
                      <div className="space-y-2">
                        {renderRateBreakdown(reportData.cash.rateBreakdown)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Equipment
                      </h4>
                      <div className="space-y-2">
                        {renderItemsBreakdown(reportData.cash.equipment, 'Equipment')}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        Refreshments
                      </h4>
                      <div className="space-y-2">
                        {renderItemsBreakdown(reportData.cash.refreshments, 'Refreshments')}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border-t border-border sticky bottom-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-yellow-900 dark:text-yellow-300">Cash Total:</div>
                      <div className="flex items-center gap-2 font-semibold text-yellow-800 dark:text-yellow-300">
                        <Banknote className="h-4 w-4" />
                        {reportData.cash.totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card column */}
                <div className="border-t md:border-t-0 border-border flex flex-col">
                  <div className="p-3 flex items-center justify-between bg-green-50 dark:bg-green-950/30 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-700 dark:text-green-500" />
                      <h3 className="font-semibold text-green-900 dark:text-green-300">Card Payments</h3>
                    </div>
                    <div className="text-sm font-medium text-green-900 dark:text-green-300">{reportData.card.totalSessions} Sessions</div>
                  </div>
                  <div className="p-4 flex-grow space-y-5">
                  <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Court Revenue Breakdown
                      </h4>
                      <div className="space-y-2">
                        {renderRateBreakdown(reportData.card.rateBreakdown)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Equipment
                      </h4>
                      <div className="space-y-2">
                        {renderItemsBreakdown(reportData.card.equipment, 'Equipment')}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        Refreshments
                      </h4>
                      <div className="space-y-2">
                        {renderItemsBreakdown(reportData.card.refreshments, 'Refreshments')}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border-t border-border sticky bottom-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-green-900 dark:text-green-300">Card Total:</div>
                      <div className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
                        <CreditCard className="h-4 w-4" />
                        {reportData.card.totalRevenue.toFixed(2)} {CURRENCY_SYMBOL}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/30 dark:bg-muted/20 flex flex-col md:flex-row justify-center items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">{grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-sm font-medium text-foreground">{totalSessions} Sessions</span>
                  </div>
                </div>
              </div>
            </div>
        </div>
        <AlertDialogFooter className="flex justify-between items-center gap-2 mt-4">
          <div className="text-sm text-muted-foreground">
            Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}
          </div>
          <div>
            <AlertDialogAction
              onClick={onClose}
              className="bg-muted hover:bg-muted/80 text-foreground" // Adjusted for better theming
            >
              Close
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 