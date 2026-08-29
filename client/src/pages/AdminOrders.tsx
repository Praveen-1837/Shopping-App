import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import {
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  MapPin,
  Phone,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ORDER_STATUSES = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrders() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch admin orders list
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminOrders', page, statusFilter],
    queryFn: async () => {
      const token = await getToken();
      const params: any = { page, limit: 10 };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await apiClient.get('/admin/orders', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const ordersData = data?.data;
  const orders = ordersData?.items || [];
  const totalPages = ordersData?.totalPages || 1;
  const total = ordersData?.total || 0;

  // Fetch single order detail modal data
  const { data: orderDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminOrderDetail', selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const token = await getToken();
      const res = await apiClient.get(`/admin/orders/${selectedOrderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
    enabled: !!selectedOrderId && !!isSignedIn,
  });

  // Order status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      await apiClient.patch(
        `/admin/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetail', selectedOrderId] });
    },
  });

  const errorMessage =
    (error as any)?.response?.data?.error?.message ||
    (error as any)?.message ||
    'Failed to load platform orders';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-text-primary">Platform Orders Management</h1>
            <p className="text-xs text-text-secondary">
              View customer orders platform-wide, inspect item details & delivery addresses, and update status.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3.5 py-2 bg-background-card border border-text-muted/20 rounded-xl text-text-secondary shrink-0">
          Total Orders: <strong className="text-primary">{total}</strong>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between bg-background-card p-4 rounded-2xl border border-text-muted/15 shadow-soft">
        <div className="flex items-center space-x-2 text-xs font-semibold text-text-secondary">
          <span>Filter by Order Status:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer min-w-[200px]"
        >
          {ORDER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st === 'ALL' ? 'All Order Statuses' : st.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="py-20 text-center text-text-secondary space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium">Loading platform orders...</p>
        </div>
      ) : isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-error" />
          <p className="text-sm font-bold text-error">Failed to load platform orders</p>
          <p className="text-xs text-error/80 font-mono max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-text-muted opacity-50" />
          <h3 className="text-lg font-bold font-heading">No Orders Found</h3>
          <p className="text-xs text-text-secondary">No customer orders match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background-muted/60 text-text-secondary border-b border-text-muted/15 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10 font-medium">
                {orders.map((order: any) => {
                  const createdDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-background-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-text-primary">{order.id.slice(0, 8)}...</p>
                        <p className="text-[11px] text-text-muted">{createdDate}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-primary">{order.user?.name || 'Customer'}</p>
                        <p className="text-[11px] text-text-muted">{order.user?.email}</p>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-primary text-sm">
                        ₹{Number(order.total).toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            order.paymentStatus === 'SUCCESS'
                              ? 'bg-success-light text-success'
                              : 'bg-warning-light text-warning'
                          }`}
                        >
                          {order.paymentStatus === 'SUCCESS' ? 'SUCCESS (Mock Payment)' : order.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={order.orderStatus || order.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({ id: order.id, status: e.target.value })
                          }
                          className="px-2.5 py-1 bg-background-muted border border-text-muted/20 rounded-lg text-[11px] font-bold focus:outline-none cursor-pointer"
                        >
                          {ORDER_STATUSES.filter((s) => s !== 'ALL').map((st) => (
                            <option key={st} value={st}>
                              {st.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="px-3 py-1.5 bg-primary-light text-primary hover:bg-primary hover:text-white rounded-xl font-semibold transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-text-muted/15 flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Page <strong className="text-text-primary">{page}</strong> of{' '}
                <strong className="text-text-primary">{totalPages}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-text-muted/20 hover:bg-background-muted text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 inline" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-text-muted/20 hover:bg-background-muted text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background-card rounded-3xl p-6 max-w-2xl w-full space-y-5 border border-text-muted/20 shadow-card max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-text-muted/15 pb-4">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-text-primary flex items-center space-x-2">
                  <span>Order Details</span>
                  <span className="font-mono text-xs text-text-muted">({selectedOrderId})</span>
                </h2>
                <p className="text-xs text-text-secondary">Inspection & status controls platform-wide.</p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-1.5 rounded-xl hover:bg-background-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {isDetailLoading || !orderDetailData ? (
              <div className="py-12 text-center text-text-secondary space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-xs font-medium">Fetching order details...</p>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* Customer & Address Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background-muted/40 p-4 rounded-2xl border border-text-muted/15">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-text-primary flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>Customer Details</span>
                    </h4>
                    <p className="font-semibold text-text-primary">{orderDetailData.user?.name || 'N/A'}</p>
                    <p className="text-text-secondary">{orderDetailData.user?.email}</p>
                    <p className="text-text-secondary flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-text-muted" />
                      <span>{orderDetailData.user?.phone || orderDetailData.deliveryAddress?.phone || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-text-primary flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-secondary" />
                      <span>Delivery Address</span>
                    </h4>
                    {orderDetailData.deliveryAddress ? (
                      <div className="text-text-secondary leading-relaxed">
                        <p className="font-semibold text-text-primary">{orderDetailData.deliveryAddress.recipientName}</p>
                        <p>{orderDetailData.deliveryAddress.streetAddress}</p>
                        <p>
                          {orderDetailData.deliveryAddress.city}, {orderDetailData.deliveryAddress.state} -{' '}
                          {orderDetailData.deliveryAddress.postalCode}
                        </p>
                      </div>
                    ) : (
                      <p className="text-text-muted italic">Standard customer address attached.</p>
                    )}
                  </div>
                </div>

                {/* Status & Payment Overview */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary-light/50 border border-primary/20 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>
                      Payment: <strong className="text-text-primary">Mock Payment ({orderDetailData.paymentStatus})</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Order Status:</span>
                    <select
                      value={orderDetailData.orderStatus || orderDetailData.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: orderDetailData.id,
                          status: e.target.value,
                        })
                      }
                      className="px-2.5 py-1 bg-background-card border border-primary/40 rounded-lg font-bold text-primary focus:outline-none cursor-pointer"
                    >
                      {ORDER_STATUSES.filter((s) => s !== 'ALL').map((st) => (
                        <option key={st} value={st}>
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-text-primary">Order Items</h4>
                  <div className="divide-y divide-text-muted/15 border border-text-muted/15 rounded-2xl overflow-hidden">
                    {orderDetailData.items?.map((item: any) => {
                      const title = item.product?.title || item.course?.title || 'Order Item';
                      const img = item.product?.images?.[0] || 'https://via.placeholder.com/80';

                      return (
                        <div key={item.id} className="p-3 bg-background-card flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <img src={img} alt={title} className="w-10 h-10 object-cover rounded-xl border border-text-muted/20" />
                            <div>
                              <p className="font-bold text-text-primary">{title}</p>
                              <p className="text-[11px] text-text-muted">
                                Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-text-primary">
                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary Total */}
                <div className="border-t border-text-muted/15 pt-3 flex items-center justify-between text-sm font-bold text-text-primary">
                  <span>Grand Total</span>
                  <span className="text-base text-primary">₹{Number(orderDetailData.total).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
