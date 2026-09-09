import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import {
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Store,
  AlertCircle,
} from 'lucide-react';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalStores: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  itemType: string;
  product?: { title: string; images: string[]; price: number };
  course?: { title: string; price: number };
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; phone?: string };
  deliveryAddress?: any;
  items: OrderItem[];
}

export default function AdminDashboard() {
  const { getToken, isSignedIn } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Stats Query
  const { data: statsData, isLoading: loadingStats } = useQuery<{ success: boolean; data: Stats }>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Stats }>('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // Recent Orders Query
  const { data: ordersData, isLoading: loadingOrders } = useQuery<{
    success: boolean;
    data: { items: Order[]; total: number };
  }>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: { items: Order[]; total: number } }>(
        '/admin/orders?limit=20',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const stats = statsData?.data || { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, totalStores: 0 };
  const orders = ordersData?.data?.items || [];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Admin Dashboard Header */}
      <div className="flex items-center justify-between border-b border-text-muted/15 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-ai-light text-ai px-3 py-1 rounded-full text-xs font-bold border border-ai/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Overview</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-primary">
            Admin Operations Dashboard
          </h1>
          <p className="text-xs text-text-secondary">
            Monitor real-time revenue, order fulfillment, marketplace items, active stores, and platform users.
          </p>
        </div>
      </div>

      {/* Top Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-background-card border border-secondary/30 rounded-3xl p-5 shadow-soft space-y-3">
          <div className="p-2.5 bg-secondary-light text-secondary rounded-2xl w-fit">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl font-black font-heading text-secondary">
              ₹{loadingStats ? '...' : stats.totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-background-card border border-primary/30 rounded-3xl p-5 shadow-soft space-y-3">
          <div className="p-2.5 bg-primary-light text-primary rounded-2xl w-fit">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="text-xl font-black font-heading text-primary">
              {loadingStats ? '...' : stats.totalOrders}
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-background-card border border-accent/40 rounded-3xl p-5 shadow-soft space-y-3">
          <div className="p-2.5 bg-accent/20 text-text-primary rounded-2xl w-fit">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Catalog Products
            </span>
            <span className="text-xl font-black font-heading text-text-primary">
              {loadingStats ? '...' : stats.totalProducts}
            </span>
          </div>
        </div>

        {/* Total Stores */}
        <div className="bg-background-card border border-primary/30 rounded-3xl p-5 shadow-soft space-y-3">
          <div className="p-2.5 bg-primary-light text-primary rounded-2xl w-fit">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Total Stores
            </span>
            <span className="text-xl font-black font-heading text-primary">
              {loadingStats ? '...' : stats.totalStores}
            </span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-background-card border border-ai/30 rounded-3xl p-5 shadow-soft space-y-3">
          <div className="p-2.5 bg-ai-light text-ai rounded-2xl w-fit">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Registered Users
            </span>
            <span className="text-xl font-black font-heading text-ai">
              {loadingStats ? '...' : stats.totalUsers}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <a
          href="/admin/products"
          className="p-4 bg-background-card hover:bg-primary-light/50 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <Package className="w-5 h-5 mx-auto text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Products</span>
        </a>
        <a
          href="/admin/orders"
          className="p-4 bg-background-card hover:bg-secondary-light/50 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <ShoppingBag className="w-5 h-5 mx-auto text-secondary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Orders</span>
        </a>
        <a
          href="/admin/banners"
          className="p-4 bg-background-card hover:bg-primary-light/50 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <Store className="w-5 h-5 mx-auto text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Banners</span>
        </a>
        <a
          href="/admin/categories"
          className="p-4 bg-background-card hover:bg-accent/20 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <ShieldCheck className="w-5 h-5 mx-auto text-accent group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Categories</span>
        </a>
        <a
          href="/admin/users"
          className="p-4 bg-background-card hover:bg-ai-light/50 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <Users className="w-5 h-5 mx-auto text-ai group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Users</span>
        </a>
        <a
          href="/admin/onboarding"
          className="p-4 bg-background-card hover:bg-success-light/50 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <CheckCircle2 className="w-5 h-5 mx-auto text-success group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Approvals</span>
        </a>
        <a
          href="/admin/cancellation-requests"
          className="p-4 bg-background-card hover:bg-error-light/50 border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <AlertCircle className="w-5 h-5 mx-auto text-error group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Cancellations</span>
        </a>
        <a
          href="/admin/settings"
          className="p-4 bg-background-card hover:bg-background-muted border border-text-muted/15 rounded-2xl transition-all text-center space-y-1.5 group"
        >
          <CreditCard className="w-5 h-5 mx-auto text-text-secondary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-text-primary block">Settings</span>
        </a>
      </div>

      {/* Orders List Table */}
      <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
          <h2 className="font-heading font-bold text-xl text-text-primary">
            Recent Platform Orders
          </h2>
          <span className="text-xs text-text-muted font-medium">
            Showing latest {orders.length} orders
          </span>
        </div>

        {loadingOrders ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No orders found in the platform.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-background-muted/60 text-text-muted uppercase tracking-wider border-b border-text-muted/10 font-bold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10 font-medium text-text-primary">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-background-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      #{ord.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold block">{ord.user?.name || 'Customer'}</span>
                        <span className="text-[11px] text-text-muted">{ord.user?.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{ord.items?.length || 0} Items</td>
                    <td className="py-3.5 px-4 font-bold text-secondary">
                      ₹{Number(ord.total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-background-muted text-text-primary border border-text-muted/20">
                        <CreditCard className="w-3 h-3 text-primary" />
                        <span>{ord.paymentMethod || 'Mock Payment'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success border border-success/30">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-hover transition-colors inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-background-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-text-muted/20 p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-text-muted/15 pb-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-text-primary flex items-center space-x-2">
                  <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success border border-success/30">
                    {selectedOrder.status}
                  </span>
                </h3>
                <p className="text-xs text-text-muted flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-text-muted hover:bg-background-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Payment Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-background-muted/60 p-4 rounded-2xl border border-text-muted/10 space-y-1">
                <span className="text-[10px] font-bold uppercase text-text-muted block">Customer Details</span>
                <p className="font-bold text-text-primary">{selectedOrder.user?.name || 'Customer'}</p>
                <p className="text-text-secondary">{selectedOrder.user?.email}</p>
                {selectedOrder.user?.phone && <p className="text-text-secondary">Phone: {selectedOrder.user.phone}</p>}
              </div>

              <div className="bg-background-muted/60 p-4 rounded-2xl border border-text-muted/10 space-y-1">
                <span className="text-[10px] font-bold uppercase text-text-muted block">Payment Method</span>
                <div className="flex items-center space-x-1.5 font-bold text-secondary">
                  <CreditCard className="w-4 h-4" />
                  <span>{selectedOrder.paymentMethod || 'Mock Payment'}</span>
                </div>
                <p className="text-text-secondary">Payment Status: <strong className="text-success">{selectedOrder.paymentStatus}</strong></p>
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <div className="bg-background-muted/40 p-4 rounded-2xl border border-text-muted/10 space-y-1 text-xs">
                <div className="flex items-center space-x-1 text-primary font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-text-secondary">
                  {typeof selectedOrder.deliveryAddress === 'string'
                    ? selectedOrder.deliveryAddress
                    : `${selectedOrder.deliveryAddress.street || ''}, ${selectedOrder.deliveryAddress.city || ''}, ${selectedOrder.deliveryAddress.state || ''} ${selectedOrder.deliveryAddress.zipCode || ''}`}
                </p>
              </div>
            )}

            {/* Purchased Items Breakdown */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase text-text-muted tracking-wider">
                Purchased Line Items
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((it) => {
                  const title = it.product?.title || it.course?.title || 'Purchased Item';
                  const unitPrice = Number(it.price);
                  const lineTotal = unitPrice * it.quantity;

                  return (
                    <div
                      key={it.id}
                      className="flex items-center justify-between bg-background-card p-3 rounded-xl border border-text-muted/15 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-background-muted overflow-hidden shrink-0 border border-text-muted/10 flex items-center justify-center">
                          {it.product?.images?.[0] ? (
                            <img src={it.product.images[0]} alt={title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-text-muted" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{title}</p>
                          <p className="text-[11px] text-text-muted">
                            Qty: {it.quantity} × ₹{unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-secondary">₹{lineTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Footer */}
            <div className="pt-4 border-t border-text-muted/15 flex items-center justify-between text-sm">
              <span className="font-bold text-text-primary">Order Total</span>
              <span className="font-black font-heading text-xl text-secondary">
                ₹{Number(selectedOrder.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
