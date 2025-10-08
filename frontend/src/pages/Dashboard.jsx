import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { api } from "../App";
import { toast } from "sonner";

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.total_products || 0,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Low Stock Items",
      value: stats?.low_stock_count || 0,
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
    },
    {
      title: "Inventory Value",
      value: `₱${stats?.inventory_value?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
    },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="dashboard-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-slate-400 text-lg">Welcome back, {user?.username}! Here's your inventory overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-slate-800/50 border-slate-700 backdrop-blur-lg card-hover overflow-hidden relative"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`}></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                    <Icon className={`w-5 h-5 text-transparent bg-gradient-to-br ${stat.color} bg-clip-text`} style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'none' }} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Orders */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg" data-testid="recent-orders-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_orders && stats.recent_orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Order ID</th>
                      <th className="text-left">Date</th>
                      <th className="text-left">Status</th>
                      <th className="text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map((order) => (
                      <tr key={order.id}>
                        <td className="text-slate-300">#{order.id}</td>
                        <td className="text-slate-300">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
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
                        <td className="text-right text-white font-semibold">
                          ₱{order.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders Alert */}
        {stats?.pending_orders > 0 && (
          <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/30 backdrop-blur-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-orange-500/20 p-3 rounded-lg border border-orange-500/30">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Pending Orders</h3>
                <p className="text-slate-300">
                  You have {stats.pending_orders} pending order{stats.pending_orders > 1 ? 's' : ''} waiting for processing.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}