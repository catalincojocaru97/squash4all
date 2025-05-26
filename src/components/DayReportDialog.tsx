import React, { useEffect, useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Calendar, CreditCard, Banknote, Clock, Award, ShoppingCart, Users, Download, CupSoda } from "lucide-react"
import { CURRENCY_SYMBOL, ADDITIONAL_ITEMS, Session, TIME_INTERVAL_OPTIONS, STUDENT_PRICE, BASE_RATES } from "@/types"
import { format, isSameDay } from "date-fns"
import { unparse } from "papaparse"

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

// Type for the rows in the final CSV export
interface CsvExportRow {
  Category?: string;
  'Item/Rate Name'?: string;
  'Unit Price'?: string;
  'Cash Qty'?: number | string; // Allow string for empty placeholders
  'Cash Revenue'?: string;
  'Card Qty'?: number | string; // Allow string for empty placeholders
  'Card Revenue'?: string;
  'Total Qty'?: number | string; // Allow string for empty placeholders
  'Total Revenue'?: string;
}

// Helper to get a sortable base price for court rates
const getRateSortKey = (originalRateLabel: string): number => {
  if (originalRateLabel.toLowerCase().includes('subscription')) return 10; // Low, but above 0
  if (originalRateLabel.toLowerCase().includes('student')) return STUDENT_PRICE; // e.g., 30
  const matchedOption = TIME_INTERVAL_OPTIONS.find(opt => opt.label === originalRateLabel);
  if (matchedOption) return matchedOption.price; // e.g., 50, 80
  if (originalRateLabel.toLowerCase().includes('table tennis')) return BASE_RATES.tableTennis;
  return 0; // Default for others or if no match
};

// Helper to get a unit price string for court rates
const getRateUnitPrice = (originalRateLabel: string): string => {
  if (originalRateLabel.toLowerCase().includes('subscription')) return `0 ${CURRENCY_SYMBOL} (Subscription)`;
  if (originalRateLabel.toLowerCase().includes('student')) return `${STUDENT_PRICE} ${CURRENCY_SYMBOL}`;
  const matchedOption = TIME_INTERVAL_OPTIONS.find(opt => opt.label === originalRateLabel);
  if (matchedOption) return `${matchedOption.price} ${CURRENCY_SYMBOL}`;
  if (originalRateLabel.toLowerCase().includes('table tennis')) return `${BASE_RATES.tableTennis} ${CURRENCY_SYMBOL}`;
  return 'N/A';
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
      const itemDef = ADDITIONAL_ITEMS.find(i => i.id === key);
      if (data.count === 0 || !itemDef) return null; 

      const unitPrice = itemDef.price;

      // Determine icon based on category
      let icon = <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
      if (categoryName === 'Refreshments') {
        icon = <CupSoda className="h-4 w-4 text-muted-foreground" />;
      }

      return (
        <div key={key} className="flex justify-between items-center p-2 bg-muted/50 dark:bg-muted/30 rounded-md">
          <div className="flex items-center gap-2 flex-grow-[2] basis-0">
            {icon} 
            <span className="text-sm text-foreground truncate">{itemDef.name}</span>
          </div>
          <div className="flex gap-1 items-center justify-end flex-grow-[1] basis-0">
            <span className="text-sm text-muted-foreground">{data.count}x</span>
            <span className="text-sm font-medium text-foreground min-w-[50px] text-right">{unitPrice.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-0.5">{CURRENCY_SYMBOL}</span>
            <span className="text-sm text-muted-foreground mx-1 ml-6">=</span>
            <span className="text-sm font-medium text-foreground min-w-[60px] text-right">{data.revenue.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-0.5">{CURRENCY_SYMBOL}</span>
          </div>
        </div>
      );
    });
  };

  const handleExportToCSV = () => {
    const reportDateStr = format(date, 'yyyy-MM-dd');
    
    type AggregatedItem = {
      category: string;
      itemName: string;
      unitPrice: string;
      cashQty: number;
      cashRevenue: number;
      cardQty: number;
      cardRevenue: number;
      totalQty: number;
      totalRevenue: number;
      sortKey?: number; 
      originalRateLabel?: string; 
    };
    const aggregatedData: Record<string, AggregatedItem> = {};

    const updateAggregatedItem = (
      key: string,
      category: string,
      itemName: string,
      unitPrice: string,
      qty: number,
      revenue: number,
      paymentMethod: 'cash' | 'card',
      sortKey?: number,
      originalRateLabel?: string
    ) => {
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          category,
          itemName,
          unitPrice,
          cashQty: 0, cashRevenue: 0,
          cardQty: 0, cardRevenue: 0,
          totalQty: 0, totalRevenue: 0,
          sortKey: category === 'Court Revenue' ? sortKey : undefined,
          originalRateLabel: category === 'Court Revenue' ? originalRateLabel : undefined,
        };
      }
      if (paymentMethod === 'cash') {
        aggregatedData[key].cashQty += qty;
        aggregatedData[key].cashRevenue += revenue;
      } else { 
        aggregatedData[key].cardQty += qty;
        aggregatedData[key].cardRevenue += revenue;
      }
      aggregatedData[key].totalQty += qty;
      aggregatedData[key].totalRevenue += revenue;
    };
    
    Object.values(reportData.cash.rateBreakdown).forEach((data) => {
      if (data.count > 0) {
        const itemName = data.originalRateLabel;
        const displayLabel = getRateDisplayLabel(data);
        updateAggregatedItem(`court-${itemName}`, 'Court Revenue', displayLabel, getRateUnitPrice(data.originalRateLabel), data.count, data.revenue, 'cash', getRateSortKey(data.originalRateLabel), data.originalRateLabel);
      }
    });
    Object.entries(reportData.cash.equipment).forEach(([itemId, data]) => {
      if (data.count > 0) {
        const itemDef = ADDITIONAL_ITEMS.find(i => i.id === itemId);
        updateAggregatedItem(`equip-${itemId}`, 'Equipment', itemDef?.name || itemId, `${itemDef?.price.toFixed(2)} ${CURRENCY_SYMBOL}` || 'N/A', data.count, data.revenue, 'cash');
      }
    });
    Object.entries(reportData.cash.refreshments).forEach(([itemId, data]) => {
      if (data.count > 0) {
        const itemDef = ADDITIONAL_ITEMS.find(i => i.id === itemId);
        updateAggregatedItem(`refresh-${itemId}`, 'Refreshments', itemDef?.name || itemId, `${itemDef?.price.toFixed(2)} ${CURRENCY_SYMBOL}` || 'N/A', data.count, data.revenue, 'cash');
      }
    });

    Object.values(reportData.card.rateBreakdown).forEach((data) => {
      if (data.count > 0) {
        const itemName = data.originalRateLabel;
        const displayLabel = getRateDisplayLabel(data);
        updateAggregatedItem(`court-${itemName}`, 'Court Revenue', displayLabel, getRateUnitPrice(data.originalRateLabel), data.count, data.revenue, 'card', getRateSortKey(data.originalRateLabel), data.originalRateLabel);
      }
    });
    Object.entries(reportData.card.equipment).forEach(([itemId, data]) => {
      if (data.count > 0) {
        const itemDef = ADDITIONAL_ITEMS.find(i => i.id === itemId);
        updateAggregatedItem(`equip-${itemId}`, 'Equipment', itemDef?.name || itemId, `${itemDef?.price.toFixed(2)} ${CURRENCY_SYMBOL}` || 'N/A', data.count, data.revenue, 'card');
      }
    });
    Object.entries(reportData.card.refreshments).forEach(([itemId, data]) => {
      if (data.count > 0) {
        const itemDef = ADDITIONAL_ITEMS.find(i => i.id === itemId);
        updateAggregatedItem(`refresh-${itemId}`, 'Refreshments', itemDef?.name || itemId, `${itemDef?.price.toFixed(2)} ${CURRENCY_SYMBOL}` || 'N/A', data.count, data.revenue, 'card');
      }
    });
    
    const csvRowsToExport = Object.values(aggregatedData);

    csvRowsToExport.sort((a, b) => {
      const categoryOrder = { 'Court Revenue': 1, 'Equipment': 2, 'Refreshments': 3 } as const;
      const categoryA = a.category as keyof typeof categoryOrder;
      const categoryB = b.category as keyof typeof categoryOrder;

      if (categoryOrder[categoryA] !== categoryOrder[categoryB]) {
        return categoryOrder[categoryA] - categoryOrder[categoryB];
      }
      if (a.category === 'Court Revenue') {
        const priceA = a.sortKey !== undefined ? a.sortKey : 0;
        const priceB = b.sortKey !== undefined ? b.sortKey : 0;
        if (priceB !== priceA) return priceB - priceA; 
      }
      return a.itemName.localeCompare(b.itemName);
    });

    const csvRowsWithSeparators: (AggregatedItem | Record<string, never>)[] = [];
    let previousCategory = "";
    for (const row of csvRowsToExport) {
        const currentCategory = row.category;
        if (previousCategory) { 
            if (currentCategory === 'Equipment' && previousCategory === 'Court Revenue') {
                csvRowsWithSeparators.push({}); 
            } else if (currentCategory === 'Refreshments' && previousCategory === 'Equipment') {
                csvRowsWithSeparators.push({}); 
            }
        }
        csvRowsWithSeparators.push(row);
        previousCategory = currentCategory;
    }

    const finalCsvData: CsvExportRow[] = csvRowsWithSeparators.map(row => {
      if (!('category' in row)) { 
          return {};
      }
      return {
        Category: row.category,
        'Item/Rate Name': row.itemName, 
        'Unit Price': row.unitPrice,
        'Cash Qty': row.cashQty,
        'Cash Revenue': `${row.cashRevenue.toFixed(2)} ${CURRENCY_SYMBOL}`,
        'Card Qty': row.cardQty,
        'Card Revenue': `${row.cardRevenue.toFixed(2)} ${CURRENCY_SYMBOL}`,
        'Total Qty': row.totalQty,
        'Total Revenue': `${row.totalRevenue.toFixed(2)} ${CURRENCY_SYMBOL}`
      };
    });
    
    const hasActualData = finalCsvData.some(row => row.Category && row.Category !== 'SUMMARY TOTALS' && (row['Total Revenue'] || row['Total Qty']));
    if (!hasActualData && finalCsvData.filter(r => Object.keys(r).length > 0).length <= 4 ) { 
         console.log("No data to export."); 
         return; 
    }

    const emptyRowForSummary: CsvExportRow = {
        Category: '', 'Item/Rate Name': '', 'Unit Price': '',
        'Cash Qty': '', 'Cash Revenue': '', 'Card Qty': '',
        'Card Revenue': '', 'Total Qty': '', 'Total Revenue': ''
    };

    finalCsvData.push({});
    finalCsvData.push({ ...emptyRowForSummary, Category: 'SUMMARY TOTALS' });
    finalCsvData.push({ ...emptyRowForSummary, Category: 'Total Cash Revenue', 'Total Revenue': `${reportData.cash.totalRevenue.toFixed(2)} ${CURRENCY_SYMBOL}` });
    finalCsvData.push({ ...emptyRowForSummary, Category: 'Total Card Revenue', 'Total Revenue': `${reportData.card.totalRevenue.toFixed(2)} ${CURRENCY_SYMBOL}` });
    finalCsvData.push({ ...emptyRowForSummary, Category: 'Grand Total Revenue', 'Total Revenue': `${grandTotal.toFixed(2)} ${CURRENCY_SYMBOL}` });

    const csv = unparse(finalCsvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_report_${reportDateStr}_structured.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-7xl bg-background flex flex-col max-h-[90vh]">
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
        
        <div className="mt-4 space-y-6 text-sm text-muted-foreground flex-grow overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Cash column */}
                <div className="border-r-0 md:border-r border-border flex flex-col">
                  <div className="p-3 flex items-center justify-between bg-yellow-50 dark:bg-yellow-950/30 border-b border-border sticky top-0 z-10">
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
                        <CupSoda className="h-4 w-4 text-muted-foreground" />
                        Refreshments
                      </h4>
                      <div className="space-y-2">
                        {renderItemsBreakdown(reportData.cash.refreshments, 'Refreshments')}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border-t border-border sticky bottom-0 z-10">
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
                  <div className="p-3 flex items-center justify-between bg-green-50 dark:bg-green-950/30 border-b border-border sticky top-0 z-10">
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
                        <CupSoda className="h-4 w-4 text-muted-foreground" />
                        Refreshments
                      </h4>
                      <div className="space-y-2">
                        {renderItemsBreakdown(reportData.card.refreshments, 'Refreshments')}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border-t border-border sticky bottom-0 z-10">
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
            
            <div className="border border-border rounded-lg overflow-hidden mt-6">
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
        <AlertDialogFooter className="flex justify-between items-center gap-2 mt-auto pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}
          </div>
          <div className="flex gap-2"> 
            <AlertDialogAction
              onClick={onClose}
              className="bg-muted hover:bg-muted/80 text-foreground px-4"
            >
              Close
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleExportToCSV}
              className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-1.5 px-4"
              type="button"
            >
              <Download className="h-4 w-4" />
              <span className="whitespace-nowrap">Export to CSV</span>
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 