import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Order } from '../types/cart';
import {
  Package,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Truck,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

type PipelineTab = 'NEW' | 'PACKED' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED';

export default function SellerFulfillmentQueue() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PipelineTab>('NEW');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch Seller Fulfillment Queue
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Order[] }>({
    queryKey: ['seller-orders'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Order[] }>('/seller/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // Fetch Backend Allowed State Transitions Map (Derived from server source of truth)
  const { data: transitionsData } = useQuery<{ success: boolean; data: Record<string, string[]> }>({
    queryKey: ['order-transitions'],
    queryFn: async () => {
      const res = await apiClient.get('/order-transitions');
      return res.data;
    },
  });
  
  const allowedTransitions = transitionsData?.data || DEFAULT_ALLOWED_TRANSITIONS;

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      cancellationReason,
    }: {
      orderId: string;
      status: string;
      cancellationReason?: string;
    }) => {
      setTransitionError(null);
      const token = await getToken();
      const res = await apiClient.patch(
        `/orders/${orderId}/status`,
        { status, ...(cancellationReason ? { cancellationReason } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      setOrderToCancel(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (err: any) => {
      setTransitionError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to update order status. Check allowed transitions.'
      );
    },
  });

  const requestCancellationMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const token = await getToken();
      const res = await apiClient.post(
        `/orders/${orderId}/request-cancellation`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      setOrderToCancel(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    },
    onError: (err: any) => {
      setTransitionError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to request cancellation.'
      );
    },
  });

  const allOrders = data?.data || [];

  // Helper to determine the primary actionable next step per status derived from allowed transitions
  const getPrimaryNextStep = (currentStatus: string): { label: string; nextStatus: string; color: string } | null => {
    const nextStates = allowedTransitions[currentStatus] || [];
    if (currentStatus === 'PENDING' && nextStates.includes('CONFIRMED')) {
      return { label: 'Confirm Order', nextStatus: 'CONFIRMED', color: 'bg-primary hover:bg-primary-hover text-white' };
    }
    if (currentStatus === 'CONFIRMED' && nextStates.includes('PACKED')) {
      return { label: 'Mark as Packed', nextStatus: 'PACKED', color: 'bg-accent hover:bg-accent/90 text-text-primary' };
    }
    if (currentStatus === 'PACKED' && nextStates.includes('SHIPPED')) {
      return { label: 'Mark as Shipped', nextStatus: 'SHIPPED', color: 'bg-secondary hover:bg-secondary-hover text-white' };
    }
    // Sellers can no longer update SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY directly
    return null;
  };

  // Filter orders by active pipeline tab
  const filteredOrders = allOrders.filter((order) => {
    if (activeTab === 'NEW') return order.status === 'PENDING' || order.status === 'CONFIRMED';
    if (activeTab === 'PACKED') return order.status === 'PACKED';
    if (activeTab === 'TRANSIT')
      return (
        order.status === 'SHIPPED' ||
        order.status === 'IN_TRANSIT' ||
        order.status === 'OUT_FOR_DELIVERY'
      );
    if (activeTab === 'DELIVERED') return order.status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  // Download / Preview PDF Document Helper
  const downloadDocument = async (orderId: string, docType: 'packing-slip' | 'invoice') => {
    const pdfWindow = window.open('', '_blank');
    try {
      const token = await getToken();
      const response = await apiClient.get(`/orders/${orderId}/${docType}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      if (pdfWindow) {
        pdfWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (err: any) {
      if (pdfWindow) pdfWindow.close();
      alert(`Failed to preview ${docType}: ${err.message || 'Error occurred'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-base font-medium">Loading seller fulfillment queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-text-muted/15 pb-6">
        <div className="flex items-center space-x-2 text-primary font-semibold text-sm uppercase tracking-wider mb-1">
          <Truck className="w-4 h-4 text-primary" />
          <span>Seller Centre — Order Dispatch Pipeline</span>
        </div>
        <h1 className="text-3xl font-bold font-heading text-primary">Fulfillment Queue & Labels</h1>
        <p className="text-base text-text-secondary">
          Track customer orders, manage status transitions, and download tax invoices and packing slips.
        </p>
      </div>

      {transitionError && (
        <div className="bg-error-light border border-error/30 rounded-2xl p-4 text-error flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-error" />
          <div>
            <strong className="block text-sm font-bold font-heading">Status Transition Rejected</strong>
            <p className="text-sm">{transitionError}</p>
          </div>
        </div>
      )}

      {/* 5 Tabbed Pipeline Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-text-muted/20 pb-2">
        <button
          onClick={() => setActiveTab('NEW')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'NEW'
              ? 'bg-primary text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-primary'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>New Orders ({allOrders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PACKED')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'PACKED'
              ? 'bg-accent text-text-primary shadow-soft font-extrabold'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-accent'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Ready to Ship ({allOrders.filter((o) => o.status === 'PACKED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRANSIT')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'TRANSIT'
              ? 'bg-secondary text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-secondary'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>In Transit ({allOrders.filter((o) => ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DELIVERED')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'DELIVERED'
              ? 'bg-success text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-success'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered ({allOrders.filter((o) => o.status === 'DELIVERED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'CANCELLED'
              ? 'bg-error text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-error'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelled ({allOrders.filter((o) => o.status === 'CANCELLED').length})</span>
        </button>
      </div>

      {/* In Transit Tab Helper Note */}
      {activeTab === 'TRANSIT' && (
        <div className="bg-secondary-light/40 border border-secondary/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm text-text-primary">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-semibold text-secondary-dark">
              Manual status updates — automated carrier tracking coming soon.
            </span>
          </div>
          <span className="text-[11px] text-text-muted hidden md:inline">
            Advance orders sequentially: Shipped → In Transit → Out for Delivery → Delivered
          </span>
        </div>
      )}

      {isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-error flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-base font-medium">
            {(error as any)?.response?.data?.error?.message || 'Failed to load fulfillment queue'}
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-4">
          <Package className="w-14 h-14 mx-auto text-text-muted opacity-40" />
          <h3 className="text-2xl font-bold font-heading">No Orders in this Pipeline Tab</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            There are currently no customer orders under the selected pipeline status tab.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-background-card rounded-2xl border border-text-muted/15 p-6 shadow-soft space-y-6"
              >
                {/* Order Header & Customer Details */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-text-muted/10 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono font-bold text-primary">
                        Order #{order.id}
                      </span>
                      <span className="text-[11px] text-text-muted">• {dateStr}</span>
                    </div>
                    {order.deliveryAddress && (
                      <p className="text-sm text-text-secondary pt-1">
                        Recipient: <strong>{(order.deliveryAddress as any).recipientName || (order.deliveryAddress as any).name || 'Customer'}</strong> (
                        {(order.deliveryAddress as any).city}, {(order.deliveryAddress as any).state})
                      </p>
                    )}
                  </div>

                  {/* Actions & Status Control */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* PDF Download Buttons */}
                    <button
                      onClick={() => downloadDocument(order.id, 'packing-slip')}
                      className="px-3 py-1.5 bg-background-muted text-text-primary hover:bg-primary-light/50 border border-text-muted/20 rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title="Download Packing Slip PDF (No Prices)"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Packing Slip</span>
                      <Download className="w-3 h-3 text-text-muted" />
                    </button>

                    <button
                      onClick={() => downloadDocument(order.id, 'invoice')}
                      className="px-3 py-1.5 bg-background-muted text-text-primary hover:bg-secondary-light/50 border border-text-muted/20 rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title="Download Tax Invoice PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-secondary" />
                      <span>Tax Invoice</span>
                      <Download className="w-3 h-3 text-text-muted" />
                    </button>

                      {/* Status & Next-Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 bg-background-muted/60 p-1.5 rounded-xl border border-text-muted/15">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] text-text-muted font-medium pl-1">Status:</span>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-sm font-bold uppercase inline-block ${
                              order.status === 'DELIVERED'
                                ? 'bg-success/20 text-success border border-success/30'
                                : order.status === 'CANCELLED'
                                ? 'bg-error/20 text-error border border-error/30'
                                : order.status === 'CONFIRMED'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : order.status === 'PACKED'
                                ? 'bg-accent/20 text-text-primary border border-accent/30'
                                : 'bg-background-card text-text-primary border border-text-muted/20'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        {(order as any).cancellationRequested ? (
                          <div className="flex items-center pl-2 border-l border-text-muted/15">
                            <span className="px-2 py-1 bg-error/10 text-error border border-error/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              Cancellation Requested (Pending Admin)
                            </span>
                          </div>
                        ) : (
                          // Actionable Next Step Buttons for New Orders and Ready to Ship
                          (() => {
                            const primaryNext = getPrimaryNextStep(order.status);
                            const canCancel =
                              (allowedTransitions[order.status] || []).includes('CANCELLED') &&
                              ['NEW', 'PACKED'].includes(activeTab);

                            if (primaryNext && ['NEW', 'PACKED'].includes(activeTab)) {
                              return (
                                <div className="flex items-center space-x-2 pl-2 border-l border-text-muted/15">
                                  <button
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        orderId: order.id,
                                        status: primaryNext.nextStatus,
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    className={`px-3 py-1 font-bold text-sm rounded-lg shadow-soft flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 ${primaryNext.color}`}
                                  >
                                    {updateStatusMutation.isPending ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <span>{primaryNext.label}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </>
                                    )}
                                  </button>

                                  {canCancel && (
                                    <button
                                      onClick={() => {
                                        setOrderToCancel(order);
                                        setCancelReason('');
                                      }}
                                      disabled={updateStatusMutation.isPending}
                                      className="px-2 py-1 text-error hover:bg-error-light/40 border border-error/20 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                                      title="Request cancellation for this order"
                                    >
                                      Request Cancellation
                                    </button>
                                  )}
                                </div>
                              );
                            }

                            return null;
                          })()
                        )}
                      </div>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="space-y-3">
                  <span className="text-sm font-semibold text-text-muted uppercase tracking-wider block">
                    Ordered Items ({order.items?.length || 0})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items?.map((item) => {
                      const imgUrl =
                        item.product?.images?.[0] ||
                        item.course?.previewVideo ||
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800';
                      const title = item.product?.title || item.course?.title || 'Item';

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-text-muted/15 bg-background-muted/30 flex items-center space-x-3"
                        >
                          <img src={imgUrl} alt={title} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="text-sm space-y-0.5">
                            <h4 className="font-bold text-text-primary line-clamp-1">{title}</h4>
                            <p className="text-text-muted">
                              Qty: <strong>{item.quantity}</strong> • Unit: ₹
                              {Number(item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background-card border border-text-muted/20 rounded-2xl p-6 max-w-md w-full shadow-card space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-error-light text-error rounded-xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-text-primary">Request cancellation?</h3>
                <p className="text-sm font-mono text-text-muted">Order #{orderToCancel.id}</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              This action requires admin approval. The order will remain in its current state until an admin reviews your request.
            </p>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Reason for cancellation <span className="text-text-muted font-normal">(optional, visible to customer)</span>:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Out of stock, pricing discrepancy, customer requested cancellation..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-background-muted/70 border border-text-muted/20 rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-error/40 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-text-muted/10">
              <button
                type="button"
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                }}
                disabled={requestCancellationMutation.isPending}
                className="px-4 py-2.5 rounded-xl border border-text-muted/20 text-sm font-semibold text-text-secondary hover:bg-background-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to request cancellation for this order?')) {
                    requestCancellationMutation.mutate({
                      orderId: orderToCancel.id,
                      reason: cancelReason.trim(),
                    });
                  }
                }}
                disabled={requestCancellationMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-error hover:bg-error/90 text-white text-sm font-bold shadow-soft transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {requestCancellationMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <span>Request Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
