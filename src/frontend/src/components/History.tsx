import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllHistory } from "@/hooks/useQueries";
import type { SaleEntry, StockEntry } from "../backend.d";
import { Category } from "../backend.d";

function nanoToDate(nano: bigint): Date {
  return new Date(Number(nano / 1_000_000n));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.milk]: "🥛 Milk",
  [Category.tea_powder]: "🍵 Tea Powder",
  [Category.snacks]: "🍪 Snacks",
  [Category.other]: "📦 Other",
};

const CATEGORY_COLORS: Record<Category, string> = {
  [Category.milk]: "bg-blue-100 text-blue-700 border-blue-200",
  [Category.tea_powder]: "bg-amber-100 text-amber-700 border-amber-200",
  [Category.snacks]: "bg-orange-100 text-orange-700 border-orange-200",
  [Category.other]: "bg-muted text-muted-foreground",
};

type UnifiedEntry =
  | { type: "stock"; data: StockEntry; date: Date }
  | { type: "sale"; data: SaleEntry; date: Date };

export function History() {
  const { data, isLoading } = useAllHistory();

  const allEntries: UnifiedEntry[] = [];

  if (data) {
    for (const entry of data.stockEntries as StockEntry[]) {
      allEntries.push({
        type: "stock",
        data: entry,
        date: nanoToDate(entry.date),
      });
    }
    for (const entry of data.saleEntries as SaleEntry[]) {
      allEntries.push({
        type: "sale",
        data: entry,
        date: nanoToDate(entry.date),
      });
    }
  }

  allEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

  const grouped: Record<string, { label: string; entries: UnifiedEntry[] }> =
    {};
  for (const entry of allEntries) {
    const key = formatDateKey(entry.date);
    if (!grouped[key]) {
      grouped[key] = { label: formatDate(entry.date), entries: [] };
    }
    grouped[key].entries.push(entry);
  }

  const groups = Object.entries(grouped);
  let globalIndex = 1;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h2 className="text-lg font-display font-bold text-foreground">
        Transaction History
      </h2>

      {isLoading ? (
        <div className="space-y-3" data-ocid="history.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="shadow-card" data-ocid="history.empty_state">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">📋</span>
            <p className="font-semibold text-foreground">No entries yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first stock purchase or sales entry to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5" data-ocid="history.list">
          {groups.map(([key, group]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground px-2">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                {group.entries.map((entry) => {
                  const idx = globalIndex++;
                  const ocid =
                    idx <= 10 ? `history.item.${idx}` : "history.item.1";
                  if (entry.type === "stock") {
                    const s = entry.data as StockEntry;
                    return (
                      <Card
                        key={`stock-${key}-${s.itemName}-${idx}`}
                        className="shadow-xs border-border"
                        data-ocid={ocid}
                      >
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 ${CATEGORY_COLORS[s.category]}`}
                              >
                                {CATEGORY_LABELS[s.category]}
                              </Badge>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {s.itemName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Number(s.quantity)} {s.unit}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-foreground flex-shrink-0 ml-2">
                            −₹{Number(s.costAmount)}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }
                  const s = entry.data as SaleEntry;
                  return (
                    <Card
                      key={`sale-${key}-${idx}`}
                      className="shadow-xs border-green-200 bg-green-50"
                      data-ocid={ocid}
                    >
                      <CardContent className="py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 bg-green-100 text-green-700 border-green-200"
                          >
                            💰 Sales
                          </Badge>
                          <p className="text-sm font-medium text-foreground">
                            Total Sales
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-green-700 flex-shrink-0 ml-2">
                          +₹{Number(s.totalSalesAmount)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
