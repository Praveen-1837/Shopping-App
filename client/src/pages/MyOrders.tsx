import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Order } from '../types/cart';
import { Package, ArrowRight, RefreshCw, AlertCircle, ShoppingBag, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

interface MyOrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function MyOrders() {
  const { getToken, isSignedIn } = useAuth();
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError, error } = useQuery<MyOrdersResponse>({
    queryKey: ['my-orders', page],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<MyOrdersResponse>('/my-world/orders', {
        params: { page, limit: 8 },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isSignedIn,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="bg-background-card rounded-2xl p-10 border border-text-muted/15 shadow-soft space-y-4">
          <Package className="w-12 h-12 mx-auto text-primary" />
          <h2 className="text-2xl font-bold font-heading text-primary">Sign in to View Order History</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Please log in to your account to view your past orders, active shipments, and fulfillment status.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-soft"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-base font-medium">Fetching your order history...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-success-light text-success border-success/30';
      case 'CANCELLED':
        return 'bg-error-light text-error border-error/30';
      case 'SHIPPED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'bg-primary-light text-primary border-primary/30';
      default:
        return 'bg-warning-light text-warning border-warning/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-text-muted/15 pb-6">
        <div className="flex items-center space-x-2 text-primary font-semibold text-sm uppercase tracking-wider mb-1">
          <Package className="w-4 h-4 text-primary" />
          <span>My World — Orders & Purchasing</span>
        </div>
        <h1 className="text-3xl font-bold font-heading text-primary">Order History & Tracking</h1>
        <p className="text-base text-text-secondary">
          Track active deliveries, view receipt summaries, and check digital course activations
        </p>
      </div>

      {isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-error flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-base font-medium">
            {(error as any)?.response?.data?.error?.message || 'Failed to load order history'}
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-4">
          <ShoppingBag className="w-14 h-14 mx-auto text-text-muted opacity-40" />
          <h3 className="text-2xl font-bold font-heading">No Orders Placed Yet</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            You haven't placed any marketplace orders or enrolled in courses yet.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={order.id}
                className={`bg-background-card rounded-2xl border p-6 shadow-soft hover:shadow-card transition-all space-y-4 ${
                  order.status === 'CANCELLED'
                    ? 'border-error/30 bg-error-light/10'
                    : 'border-text-muted/15'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-text-muted/10 pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-text-muted uppercase block">
                      Order ID: {order.id}
                    </span>
                    <span className="text-sm text-text-secondary">Placed on {dateStr}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="font-heading font-bold text-lg text-primary">
                      ₹{Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Cancellation Notice Banner */}
                {order.status === 'CANCELLED' && (
                  <div className="bg-error-light/80 border border-error/25 rounded-xl px-4 py-2.5 text-sm text-error flex items-start space-x-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Order Cancelled:</span>{' '}
                      {order.cancellationReason ? (
                        <span>
                          Reason: <span className="italic font-semibold">"{order.cancellationReason}"</span>
                        </span>
                      ) : (
                        <span>Cancelled by seller before fulfillment.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Thumbnails */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-x-auto py-1">
                    {order.items?.map((item, idx) => {
                      const imgUrl =
                        item.product?.images?.[0] ||
                        item.course?.previewVideo ||
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800';
                      const title = item.product?.title || item.course?.title || 'Item';

                      return (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 bg-background-muted/40 p-2 rounded-xl border border-text-muted/10 shrink-0"
                        >
                          <img
                            src={imgUrl}
                            alt={title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div className="text-sm max-w-[140px]">
                            <span className="font-semibold text-text-primary block truncate">
                              {title}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Qty: {item.quantity} • ₹{Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    to={`/order/${order.id}`}
                    className="flex items-center space-x-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft shrink-0 ml-4"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-text-muted/15">
              <span className="text-sm text-text-secondary">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-xl disabled:opacity-40 hover:bg-background-card transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 border rounded-xl disabled:opacity-40 hover:bg-background-card transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
