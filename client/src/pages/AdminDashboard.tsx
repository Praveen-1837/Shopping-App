import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
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
  Truck,
  Ban,
  ClipboardCheck,
  ShieldAlert,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { Link } from 'react-router-dom';

/* ─── Type Definitions ─── */

interface Stats {
  totalRevenue: number;
  revenueTrend: number | null;
  currentMonthRevenue: number;
  totalOrders: number;
  ordersTrend: number | null;
  totalProducts: number;
  productsTrend: number | null;
  totalUsers: number;
  usersTrend: number | null;
  totalStores: number;
}

interface Analytics {
  monthlyRevenue: { month: string; revenue: number }[];
  customerStats: { name: string; value: number }[];
  topCategories: { name: string; revenue: number }[];
  bestSellingProducts: { id: string; title: string; category: string; image: string | null; totalOrders: number; revenue: number }[];
  totalItemsSold: number;
  totalShippingCost: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
  pendingRoleApplications: number;
  weeklySales: { day: string; revenue: number }[];
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

/* ─── Palette ─── */

const DONUT_COLORS = ['#2F5233', '#D9A566', '#4A7C7C', '#838E86'];
const CHART_GREEN = '#2F5233';
const CHART_GOLD = '#D9A566';

/* ─── Helper: Time-aware greeting ─── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Sub-components ─── */

function TrendBadge({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined)
    return <span className="text-[10px] text-text-muted italic">—</span>;
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${isUp ? 'text-success' : 'text-error'}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  iconBg,
  prefix = '',
}: {
  label: string;
  value: string;
  trend?: number | null;
  icon: React.ElementType;
  iconBg: string;
  prefix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-shadow">
      <div className="space-y-2 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-2xl font-extrabold font-heading text-text-primary truncate">
          {prefix}{value}
        </p>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
      <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: 'bg-success-light text-success border-success/25',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    FAILED: 'bg-error-light text-error border-error/25',
    DELIVERED: 'bg-success-light text-success border-success/25',
    CANCELLED: 'bg-error-light text-error border-error/25',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    IN_TRANSIT: 'bg-violet-50 text-violet-700 border-violet-200',
    OUT_FOR_DELIVERY: 'bg-teal-50 text-teal-700 border-teal-200',
    PACKED: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* ─── Order Detail Modal ─── */

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
              Order #{order.id.slice(0, 8)}
              <StatusBadge status={order.status} />
            </h3>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Customer</span>
            <p className="font-bold text-text-primary">{order.user?.name || 'Customer'}</p>
            <p className="text-text-secondary">{order.user?.email}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Payment</span>
            <p className="font-bold text-secondary flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> {order.paymentMethod || 'Mock Payment'}
            </p>
            <p className="text-text-secondary">
              Status: <StatusBadge status={order.paymentStatus} />
            </p>
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1 text-xs">
            <div className="flex items-center gap-1 text-primary font-bold">
              <MapPin className="w-4 h-4" /> Delivery Address
            </div>
            <p className="text-text-secondary">
              {typeof order.deliveryAddress === 'string'
                ? order.deliveryAddress
                : `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}`}
            </p>
          </div>
        )}

        {/* Line Items */}
        <div className="space-y-3">
          <h4 className="font-heading font-bold text-xs uppercase text-text-muted tracking-wider">
            Line Items
          </h4>
          <div className="space-y-2">
            {order.items.map((it) => {
              const title = it.product?.title || it.course?.title || 'Purchased Item';
              const unitPrice = Number(it.price);
              return (
                <div
                  key={it.id}
                  className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
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
                  <span className="font-bold text-secondary">₹{(unitPrice * it.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="font-bold text-text-primary">Order Total</span>
          <span className="font-black font-heading text-xl text-secondary">
            ₹{Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ══════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  /* ── Data Fetching ── */

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

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery<{ success: boolean; data: Analytics }>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Analytics }>('/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery<{
    success: boolean;
    data: { items: Order[]; total: number };
  }>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: { items: Order[]; total: number } }>(
        '/admin/orders?limit=10',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  /* ── Derived State ── */

  const stats: Stats = statsData?.data || {
    totalRevenue: 0,
    revenueTrend: null,
    currentMonthRevenue: 0,
    totalOrders: 0,
    ordersTrend: null,
    totalProducts: 0,
    productsTrend: null,
    totalUsers: 0,
    usersTrend: null,
    totalStores: 0,
  };

  const analytics: Analytics = analyticsData?.data || {
    monthlyRevenue: [],
    customerStats: [],
    topCategories: [],
    bestSellingProducts: [],
    totalItemsSold: 0,
    totalShippingCost: 0,
    pendingOrdersCount: 0,
    cancelledOrdersCount: 0,
    pendingRoleApplications: 0,
    weeklySales: [],
  };

  const orders = ordersData?.data?.items || [];
  const loading = loadingStats || loadingAnalytics;

  /* ── Computed helpers ── */

  const totalCustomersDonut = analytics.customerStats.reduce((s, c) => s + c.value, 0);

  // Best-selling products total for % calculations
  const bestProductsTotalRevenue = analytics.bestSellingProducts.reduce((s, p) => s + p.revenue, 0);

  const fmtCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  /* ══════════ RENDER ══════════ */

  return (
    <div className="w-full h-full bg-background">
      <div className="flex flex-col gap-8 items-start w-full">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

          {/* ───────────────────────────────────────────
              SECTION 1: Welcome Header + Alert Cards
              ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Greeting */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary">
                {getGreeting()}, {user?.firstName || 'Admin'}!
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Here's what's happening with your store today.
              </p>
            </div>

            {/* Quick-Action Alert Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pending Fulfillment */}
              <Link
                to="/admin/orders"
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-muted">Pending Fulfillment</p>
                  <p className="text-lg font-black font-heading text-text-primary">
                    {loading ? '—' : analytics.pendingOrdersCount}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              {/* Role Approvals */}
              <Link
                to="/admin/onboarding"
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-muted">Role Approvals</p>
                  <p className="text-lg font-black font-heading text-text-primary">
                    {loading ? '—' : analytics.pendingRoleApplications}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              {/* Cancelled Orders */}
              <Link
                to="/admin/cancellation-requests"
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-error-light text-error shrink-0">
                  <Ban className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-muted">Cancelled Orders</p>
                  <p className="text-lg font-black font-heading text-text-primary">
                    {loading ? '—' : analytics.cancelledOrdersCount}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* ───────────────────────────────────────────
              SECTION 2: KPI Metric Cards Grid
              ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <KpiCard
              label="Total Sales"
              value={loadingStats ? '...' : fmtCurrency(stats.totalRevenue)}
              trend={stats.revenueTrend}
              icon={IndianRupee}
              iconBg="bg-secondary/10 text-secondary"
              prefix=""
            />
            <KpiCard
              label="Total Orders"
              value={loadingStats ? '...' : stats.totalOrders.toLocaleString('en-IN')}
              trend={stats.ordersTrend}
              icon={ShoppingBag}
              iconBg="bg-primary/10 text-primary"
            />
            <KpiCard
              label="Items Sold"
              value={loading ? '...' : analytics.totalItemsSold?.toLocaleString('en-IN')}
              icon={Package}
              iconBg="bg-indigo-50 text-indigo-600"
            />
            <KpiCard
              label="Products"
              value={loadingStats ? '...' : stats.totalProducts.toLocaleString('en-IN')}
              trend={stats.productsTrend}
              icon={BarChart3}
              iconBg="bg-teal-50 text-teal-600"
            />
            <KpiCard
              label="Shipping Fees"
              value={loading ? '...' : fmtCurrency(analytics.totalShippingCost || 0)}
              icon={Truck}
              iconBg="bg-violet-50 text-violet-600"
            />
            <KpiCard
              label="Customers"
              value={loadingStats ? '...' : stats.totalUsers.toLocaleString('en-IN')}
              trend={stats.usersTrend}
              icon={Users}
              iconBg="bg-amber-50 text-amber-600"
            />
          </div>

          {/* ───────────────────────────────────────────
              SECTION 3: Charts Row 1
              Weekly Sales + Monthly Revenue
              ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Weekly Sales Trend - Area Chart */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-heading font-bold text-base text-text-primary">Weekly Sales</h3>
                  <p className="text-xs text-text-muted mt-0.5">Revenue over the last 7 days</p>
                </div>
                <span className="text-xs font-medium text-text-muted px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                  This Week
                </span>
              </div>
              <div className="h-[260px] w-full">
                {loadingAnalytics ? (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.weeklySales || []}>
                      <defs>
                        <linearGradient id="weeklyGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_GREEN} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={CHART_GREEN} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} dx={-5} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: '12px' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                        labelStyle={{ fontWeight: 700, color: '#1F2421', marginBottom: '2px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke={CHART_GREEN} strokeWidth={2.5} fill="url(#weeklyGreen)" dot={{ r: 3, fill: CHART_GREEN, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, fill: CHART_GOLD, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Monthly Revenue - Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-heading font-bold text-base text-text-primary">Monthly Revenue</h3>
                  <p className="text-xs text-text-muted mt-0.5">Year-to-date</p>
                </div>
              </div>
              <div className="h-[260px] w-full">
                {loadingAnalytics ? (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyRevenue || []} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} dx={-5} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: '12px' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill={CHART_GREEN} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────
              SECTION 3b: Charts Row 2
              Customer Donut + Top Categories + Conversion Metrics
              ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* New vs Returning Customer Donut */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h3 className="font-heading font-bold text-base text-text-primary">Customer Breakdown</h3>
              <p className="text-xs text-text-muted mt-0.5 mb-4">New vs. returning this month</p>

              <div className="flex-1 relative min-h-[200px]">
                {loadingAnalytics ? (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">Loading...</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.customerStats || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {(analytics.customerStats || []).map((_: any, i: number) => (
                            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black font-heading text-text-primary leading-none">
                        {totalCustomersDonut}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-text-muted mt-1">Total</span>
                    </div>
                  </>
                )}
              </div>

              {/* Legend */}
              {!loadingAnalytics && (
                <div className="flex justify-center gap-5 mt-3 pt-3 border-t border-slate-100">
                  {(analytics.customerStats || []).map((item: any, i: number) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-xs font-medium text-text-secondary">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performing Categories */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-heading font-bold text-base text-text-primary">Top Categories</h3>
              <p className="text-xs text-text-muted mt-0.5 mb-5">Revenue by product category</p>

              {loadingAnalytics ? (
                <div className="py-10 text-center text-text-muted text-xs">Loading categories...</div>
              ) : !analytics.topCategories || analytics.topCategories.length === 0 ? (
                <div className="py-10 text-center text-text-muted text-xs">No category data available.</div>
              ) : (
                <div className="space-y-4">
                  {analytics.topCategories.map((cat: any, i: number) => {
                    const maxRev = Math.max(...analytics.topCategories.map((c: any) => c.revenue));
                    const pct = maxRev > 0 ? (cat.revenue / maxRev) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-semibold text-text-primary">{cat.name}</span>
                          <span className="font-bold text-secondary">{fmtCurrency(cat.revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Conversion / Session Metrics */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="font-heading font-bold text-base text-text-primary">Platform Overview</h3>
                <p className="text-xs text-text-muted mt-0.5">Key operational metrics</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Active Stores', value: loading ? '—' : stats.totalStores.toLocaleString('en-IN'), icon: '🏪' },
                  { label: 'Revenue This Month', value: loading ? '—' : fmtCurrency(stats.currentMonthRevenue), icon: '📈' },
                  { label: 'Items Sold (Total)', value: loading ? '—' : analytics.totalItemsSold?.toLocaleString('en-IN'), icon: '📦' },
                  { label: 'Avg. Order Value', value: loading || stats.totalOrders === 0 ? '—' : fmtCurrency(Math.round(stats.totalRevenue / stats.totalOrders)), icon: '💰' },
                  { label: 'Shipping Collected', value: loading ? '—' : fmtCurrency(analytics.totalShippingCost || 0), icon: '🚚' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-medium text-text-secondary">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────
              SECTION 4: Data Tables
              Best-Selling Products + Recent Orders
              ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Best-Selling Products */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h3 className="font-heading font-bold text-base text-text-primary">Best Selling Products</h3>
                  <p className="text-xs text-text-muted mt-0.5">Top performers by order volume</p>
                </div>
                <Link
                  to="/admin/products"
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5 transition-colors"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex-1 overflow-x-auto p-6 pt-4">
                {loadingAnalytics ? (
                  <div className="py-12 flex items-center justify-center text-text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading products...
                  </div>
                ) : !analytics.bestSellingProducts || analytics.bestSellingProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-text-muted">No product sales data yet.</div>
                ) : (
                  <table className="w-full text-left text-xs min-w-[480px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Product</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Category</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Orders</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Revenue</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Rev %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analytics.bestSellingProducts.slice(0, 8).map((prod) => {
                        const revPct = bestProductsTotalRevenue > 0 ? ((prod.revenue / bestProductsTotalRevenue) * 100).toFixed(1) : '0';
                        return (
                          <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-text-muted" />
                                  )}
                                </div>
                                <span className="font-semibold text-text-primary truncate max-w-[140px]">{prod.title}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-text-secondary">{prod.category}</td>
                            <td className="py-3 px-2 text-right font-bold text-text-primary">{prod.totalOrders}</td>
                            <td className="py-3 px-2 text-right font-bold text-secondary">{fmtCurrency(prod.revenue)}</td>
                            <td className="py-3 px-2 text-right">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[10px] font-bold">
                                {revPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Recent Purchases / Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h3 className="font-heading font-bold text-base text-text-primary">Recent Purchases</h3>
                  <p className="text-xs text-text-muted mt-0.5">Latest customer transactions</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5 transition-colors"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex-1 overflow-x-auto p-6 pt-4">
                {loadingOrders ? (
                  <div className="py-12 flex items-center justify-center text-text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-text-muted">No recent orders.</div>
                ) : (
                  <table className="w-full text-left text-xs min-w-[520px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Customer</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Product</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Payment</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Amount</th>
                        <th className="py-2.5 px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.slice(0, 8).map((ord) => {
                        const firstItem = ord.items[0];
                        const productTitle = firstItem?.product?.title || firstItem?.course?.title || '—';
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-text-primary truncate max-w-[120px]">
                                  {ord.user?.name || 'Customer'}
                                </p>
                                <p className="text-[10px] text-text-muted truncate max-w-[120px]">{ord.user?.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="truncate max-w-[100px] block text-text-secondary">{productTitle}</span>
                              {ord.items.length > 1 && (
                                <span className="text-[10px] text-text-muted">+{ord.items.length - 1} more</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <StatusBadge status={ord.paymentStatus} />
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-secondary">
                              ₹{Number(ord.total).toFixed(0)}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Order Detail Modal ─── */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
