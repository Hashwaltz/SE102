import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowLeftRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { api } from "../App";
import { toast } from "sonner";

export default function StockTransactions({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    transaction_type: "in",
    quantity: "",
    notes: "",
  });

  useEffect(() => {
    fetchTransactions();
    fetchProducts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/stock/transactions");
      setTransactions(response.data);
    } catch (error) {
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      product_id: parseInt(formData.product_id),
      transaction_type: formData.transaction_type,
      quantity: parseInt(formData.quantity),
      notes: formData.notes,
    };

    try {
      await api.post("/stock/transactions", data);
      toast.success("Transaction recorded successfully!");
      setDialogOpen(false);
      resetForm();
      fetchTransactions();
      fetchProducts(); // Refresh products to show updated stock
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to record transaction");
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      transaction_type: "in",
      quantity: "",
      notes: "",
    });
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : "Unknown Product";
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="transactions-page" className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Stock Transactions
            </h1>
            <p className="text-slate-400">Track inventory movements and adjustments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-transaction-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl">
              <DialogHeader>
                <DialogTitle>Record Stock Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <select
                    id="product"
                    data-testid="transaction-product-select"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current: {product.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Transaction Type *</Label>
                  <select
                    id="transaction_type"
                    data-testid="transaction-type-select"
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                  >
                    <option value="in">Stock In (Add)</option>
                    <option value="out">Stock Out (Remove)</option>
                    <option value="adjustment">Adjustment (Set to)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    data-testid="transaction-quantity-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="Enter quantity"
                  />
                  <p className="text-xs text-slate-400">
                    {formData.transaction_type === "in" && "This will add to current stock"}
                    {formData.transaction_type === "out" && "This will remove from current stock"}
                    {formData.transaction_type === "adjustment" && "This will set stock to this exact amount"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    data-testid="transaction-notes-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md min-h-[80px]"
                    placeholder="Add transaction notes..."
                  />
                </div>
                <Button type="submit" data-testid="transaction-submit-button" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  Record Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transactions Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-blue-400" />
              Transaction History ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions yet. Record your first transaction!</p>
            ) : (
              <div className="overflow-x-auto">
                <table data-testid="transactions-table" className="w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const isStockIn = transaction.transaction_type === "in";
                      const isStockOut = transaction.transaction_type === "out";
                      return (
                        <tr key={transaction.id}>
                          <td className="text-slate-300">
                            {new Date(transaction.transaction_date).toLocaleString()}
                          </td>
                          <td className="text-white font-medium">
                            {getProductName(transaction.product_id)}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {isStockIn && (
                                <>
                                  <ArrowUpCircle className="w-4 h-4 text-green-400" />
                                  <span className="badge badge-success">Stock In</span>
                                </>
                              )}
                              {isStockOut && (
                                <>
                                  <ArrowDownCircle className="w-4 h-4 text-red-400" />
                                  <span className="badge badge-danger">Stock Out</span>
                                </>
                              )}
                              {!isStockIn && !isStockOut && (
                                <span className="badge badge-warning">Adjustment</span>
                              )}
                            </div>
                          </td>
                          <td className="text-slate-300 font-semibold">
                            {isStockIn && "+"}
                            {isStockOut && "-"}
                            {transaction.quantity}
                          </td>
                          <td className="text-slate-400 text-sm">
                            {transaction.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}