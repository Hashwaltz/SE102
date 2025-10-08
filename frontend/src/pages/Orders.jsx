import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart, Package } from "lucide-react";
import { api } from "../App";
import { toast } from "sonner";

export default function Orders({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState([{ product_id: "", quantity: "" }]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      toast.error("Failed to fetch orders");
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

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: "" }]);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      items: orderItems.map((item) => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
      })),
      notes,
    };

    try {
      await api.post("/orders", data);
      toast.success("Order created successfully!");
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create order");
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status?status=${newStatus}`);
      toast.success("Order status updated!");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setOrderItems([{ product_id: "", quantity: "" }]);
    setNotes("");
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="orders-page" className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Orders
            </h1>
            <p className="text-slate-400">Manage customer orders and fulfillment</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="create-order-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Order Items</h3>
                    <Button type="button" size="sm" onClick={handleAddItem} data-testid="add-item-button">
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </div>
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select
                          value={item.product_id}
                          onChange={(e) => {
                            const newItems = [...orderItems];
                            newItems[index].product_id = e.target.value;
                            setOrderItems(newItems);
                          }}
                          required
                          className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md"
                          data-testid={`product-select-${index}`}
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - Stock: {product.quantity}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...orderItems];
                            newItems[index].quantity = e.target.value;
                            setOrderItems(newItems);
                          }}
                          required
                          className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md"
                          data-testid={`quantity-input-${index}`}
                        />
                      </div>
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveItem(index)}
                          className="border-red-600 text-red-400"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md min-h-[80px]"
                    placeholder="Add order notes..."
                    data-testid="order-notes-input"
                  />
                </div>
                <Button type="submit" data-testid="submit-order-button" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  Create Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Orders Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              All Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No orders yet. Create your first order!</p>
            ) : (
              <div className="overflow-x-auto">
                <table data-testid="orders-table" className="w-full">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="text-slate-300 font-mono">#{order.id}</td>
                        <td className="text-slate-300">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="text-slate-300">{order.items?.length || 0} items</td>
                        <td className="text-white font-semibold">₱{order.total_amount.toLocaleString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              order.status === "completed"
                                ? "badge-success"
                                : order.status === "pending"
                                ? "badge-warning"
                                : order.status === "cancelled"
                                ? "badge-danger"
                                : "badge-info"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {order.status !== "completed" && order.status !== "cancelled" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, "completed")}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`complete-order-${order.id}`}
                              >
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, "cancelled")}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                data-testid={`cancel-order-${order.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
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