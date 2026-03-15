import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyDashboard } from "@/hooks/useQueries";
import {
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData, SaleEntry, StockEntry } from "../backend.d";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function nanoToDate(nano: bigint): Date {
  return new Date(Number(nano / 1_000_000n));
}

function aggregateByDay(data: DashboardData) {
  const map: Record<
    number,
    { day: number; investment: number; sales: number }
  > = {};

  for (const entry of data.stockEntries as StockEntry[]) {
    const d = nanoToDate(entry.date).getDate();
    if (!map[d]) map[d] = { day: d, investment: 0, sales: 0 };
    map[d].investment += Number(entry.costAmount);
  }

  for (const entry of data.saleEntries as SaleEntry[]) {
    const d = nanoToDate(entry.date).getDate();
    if (!map[d]) map[d] = { day: d, investment: 0, sales: 0 };
    map[d].sales += Number(entry.totalSalesAmount);
  }

  return Object.values(map).sort((a, b) => a.day - b.day);
}

function formatAmount(n: bigint | number): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num}`;
}

export function Dashboard({ shopName: _shopName }: { shopName: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useMonthlyDashboard(year, month);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const chartData = data ? aggregateByDay(data) : [];
  const investment = data ? Number(data.totalInvestment) : 0;
  const sales = data ? Number(data.totalSales) : 0;
  const profitLoss = data ? Number(data.profitLoss) : 0;
  const isProfit = profitLoss >= 0;

  return (
    <div className="flex flex-col gap-4 pb-6" data-ocid="dashboard.section">
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 shadow-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          className="h-8 w-8"
          data-ocid="dashboard.tab"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-display font-semibold text-foreground text-lg">
            {MONTHS[month - 1]}
          </p>
          <p className="text-xs text-muted-foreground">{year}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="h-8 w-8"
          data-ocid="dashboard.tab"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div
          className="grid grid-cols-3 gap-4"
          data-ocid="dashboard.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-tight">
                  Investment
                </p>
              </div>
              <p className="font-display font-bold text-xl text-foreground">
                {formatAmount(investment)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-tight">
                  Sales
                </p>
              </div>
              <p className="font-display font-bold text-xl text-foreground">
                {formatAmount(sales)}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`shadow-card border-border ${isProfit ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <p className="text-xs text-muted-foreground leading-tight">
                  {isProfit ? "Profit" : "Loss"}
                </p>
              </div>
              <p
                className={`font-display font-bold text-xl ${isProfit ? "text-green-700" : "text-destructive"}`}
              >
                {formatAmount(Math.abs(profitLoss))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bar Chart */}
      <Card className="shadow-card border-border">
        <CardContent className="pt-5 px-4 pb-4">
          <p className="text-base font-semibold text-foreground mb-4">
            Daily Sales vs Investment
          </p>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : chartData.length === 0 ? (
            <div
              className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2"
              data-ocid="dashboard.empty_state"
            >
              <span className="text-4xl">📊</span>
              <span>No data for this month</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 8, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5d5c8" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#7a6658" }} />
                <YAxis tick={{ fontSize: 11, fill: "#7a6658" }} />
                <Tooltip
                  formatter={(value: number) => [`₹${value}`, ""]}
                  contentStyle={{
                    fontSize: 13,
                    borderRadius: 8,
                    border: "1px solid #e5d5c8",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="investment"
                  name="Investment"
                  fill="#8b4a2f"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#4a7c59"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
