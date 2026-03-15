import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Category,
  useAddSaleEntry,
  useAddStockEntry,
} from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AddEntry() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Stock form
  const [category, setCategory] = useState<Category>(Category.milk);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [costAmount, setCostAmount] = useState("");

  // Sales form
  const [salesAmount, setSalesAmount] = useState("");

  const addStock = useAddStockEntry();
  const addSale = useAddSaleEntry();

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !quantity || !costAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await addStock.mutateAsync({
        category,
        itemName,
        quantity: Number.parseFloat(quantity),
        unit,
        costAmount: Number.parseFloat(costAmount),
      });
      toast.success("Stock entry added!");
      setItemName("");
      setQuantity("");
      setCostAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    }
  };

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesAmount) {
      toast.error("Please enter sales amount");
      return;
    }
    try {
      await addSale.mutateAsync(Number.parseFloat(salesAmount));
      toast.success("Sales entry recorded!");
      setSalesAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add sales");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">
          Add Entry
        </h2>
        <span className="text-xs text-muted-foreground">{today}</span>
      </div>

      <Card className="shadow-card">
        <Tabs defaultValue="stock">
          <CardContent className="pt-4">
            <TabsList className="w-full mb-4" data-ocid="add_entry.tab">
              <TabsTrigger
                value="stock"
                className="flex-1"
                data-ocid="add_entry.tab"
              >
                📦 Stock Purchase
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="flex-1"
                data-ocid="add_entry.tab"
              >
                💰 Sales
              </TabsTrigger>
            </TabsList>

            {/* STOCK PURCHASE */}
            <TabsContent value="stock">
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as Category)}
                  >
                    <SelectTrigger data-ocid="add_entry.select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Category.milk}>🥛 Milk</SelectItem>
                      <SelectItem value={Category.tea_powder}>
                        🍵 Tea Powder
                      </SelectItem>
                      <SelectItem value={Category.snacks}>🍪 Snacks</SelectItem>
                      <SelectItem value={Category.other}>📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g. Amul Milk"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    data-ocid="add_entry.input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 10"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      data-ocid="add_entry.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger data-ocid="add_entry.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="mL">mL</SelectItem>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="packets">packets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cost">Cost Amount (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    placeholder="e.g. 250"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    data-ocid="add_entry.input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full tea-gradient text-primary-foreground"
                  disabled={addStock.isPending}
                  data-ocid="add_entry.submit_button"
                >
                  {addStock.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Add Stock Entry"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SALES */}
            <TabsContent value="sales">
              <form onSubmit={handleSalesSubmit} className="space-y-4">
                <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                  Record total sales collected today. This will be compared with
                  your stock investment to calculate profit/loss.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sales-amount">Total Sales Amount (₹)</Label>
                  <Input
                    id="sales-amount"
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={salesAmount}
                    onChange={(e) => setSalesAmount(e.target.value)}
                    data-ocid="add_entry.input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={addSale.isPending}
                  data-ocid="add_entry.submit_button"
                >
                  {addSale.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Record Sales"
                  )}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
