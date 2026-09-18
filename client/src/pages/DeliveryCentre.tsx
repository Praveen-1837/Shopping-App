import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Truck, MapPin, Phone, RefreshCw, AlertCircle, CheckCircle2, History, ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react';
import { Order } from '../types/cart';

export default function DeliveryCentre() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Query for Active Orders
  const { data: activeData, isLoading: activeLoading, isError: activeIsError, error: activeError } = useQuery<{ success: boolean; data: Order[] }>({
    queryKey: ['delivery-orders', 'active'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Order[] }>('/delivery/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn && activeTab === 'ACTIVE',
  });

  // Query for History Orders
  const { data: historyData, isLoading: historyLoading } = useQuery<{ success: boolean; data: Order[]; pagination: any }>({
    queryKey: ['delivery-orders', 'history', page],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get(`/delivery/orders?history=true&page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn && activeTab === 'HISTORY',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      setTransitionError(null);
      const token = await getToken();
      const res = await apiClient.patch(
        `/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    },
    onError: (err: any) => {
      setTransitionError(err.response?.data?.error?.message || 'Failed to update order status.');
    },
  });

  const activeOrders = activeData?.data || [];
  const historyOrders = historyData?.data || [];
  const totalHistory = historyData?.pagination?.total || 0;
  const totalPages = historyData?.pagination?.totalPages || 1;

  const handleAction = (order: Order) => {
    let nextStatus = '';
    if (order.status === 'PACKED') nextStatus = 'SHIPPED';
    else if (order.status === 'SHIPPED') nextStatus = 'IN_TRANSIT';
    else if (order.status === 'IN_TRANSIT') nextStatus = 'OUT_FOR_DELIVERY';
    else if (order.status === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId: order.id, status: nextStatus });
    }
  };

  const getActionLabel = (status: string) => {
    if (status === 'PACKED') return 'Pick up from Seller';
    if (status === 'SHIPPED') return 'Mark Picked Up';
    if (status === 'IN_TRANSIT') return 'Mark Out for Delivery';
    if (status === 'OUT_FOR_DELIVERY') return 'Mark Delivered';
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-text-primary">Delivery Centre</h1>
            <p className="text-xs text-text-secondary">
              Manage your active deliveries and view your history.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 bg-background-muted p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-white shadow-soft text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Active</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'HISTORY'
                ? 'bg-white shadow-soft text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {transitionError && (
        <div className="p-4 bg-error-light border border-error/30 text-error text-xs font-bold rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{transitionError}</span>
        </div>
      )}

      {activeTab === 'ACTIVE' && (
        <div>
          {activeLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-text-muted">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Loading delivery assignments...</p>
            </div>
          ) : activeIsError ? (
            <div className="p-6 bg-error-light border border-error/30 text-error rounded-2xl flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-xs font-bold">{(activeError as any)?.response?.data?.error?.message || 'Access Denied'}</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="bg-background-card rounded-3xl p-12 text-center text-xs text-text-muted border border-text-muted/15 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-success" />
              <p className="font-bold text-sm text-text-primary">No Active Deliveries</p>
              <p>You have no pending deliveries assigned at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.map((order) => {
                const itemCount = order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                const address = order.deliveryAddress as any;
                const fullAddress = address ? `${address.streetAddress}, ${address.city}, ${address.state} ${address.postalCode}` : '';
                const actionLabel = getActionLabel(order.status);
                
                return (
                  <div key={order.id} className="bg-background-card border border-text-muted/15 rounded-3xl p-6 shadow-soft flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Order ID</span>
                          <span className="block font-mono font-bold text-text-primary text-sm">#{order.id.slice(0, 8)}</span>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-lg">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-text-primary block">{address?.recipientName || 'Customer'}</span>
                            <span className="text-text-secondary">{fullAddress}</span>
                          </div>
                        </div>
                        
                        {address?.phone && (
                          <div className="flex items-center space-x-2 pl-6">
                            <Phone className="w-3.5 h-3.5 text-text-muted" />
                            <a href={`tel:${address.phone}`} className="text-secondary hover:underline font-bold">
                              {address.phone}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-text-muted/10 flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{itemCount} items</span>
                        <span className="font-bold text-text-primary">Mock Payment</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-background-muted text-text-primary hover:bg-background-muted/80 text-xs font-bold rounded-xl transition-colors border border-text-muted/10"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Navigate</span>
                      </a>
                      
                      {actionLabel && (
                        <button
                          onClick={() => handleAction(order)}
                          disabled={updateStatusMutation.isPending}
                          className="w-full px-4 py-2.5 bg-primary text-white hover:bg-primary-hover text-xs font-bold rounded-xl shadow-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateStatusMutation.isPending ? 'Updating...' : actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="bg-success/10 border border-success/20 rounded-2xl p-6 flex items-center space-x-4">
            <div className="p-4 bg-success/20 text-success rounded-xl shrink-0">
              <PackageCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-success">
                {totalHistory} <span className="text-lg sm:text-xl font-bold">Orders Delivered</span>
              </h2>
              <p className="text-success/80 text-sm font-medium">Thank you for your hard work and dedication!</p>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-text-muted">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Loading delivery history...</p>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="bg-background-card rounded-3xl p-12 text-center text-xs text-text-muted border border-text-muted/15 space-y-2">
              <History className="w-8 h-8 mx-auto text-text-muted/50" />
              <p className="font-bold text-sm text-text-primary">No Delivery History</p>
              <p>You haven't completed any deliveries yet. Your delivered orders will appear here.</p>
            </div>
          ) : (
            <div className="bg-background-card border border-text-muted/15 rounded-2xl overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-background-muted/50 text-text-secondary text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Delivered On</th>
                      <th className="px-6 py-4">Customer Area</th>
                      <th className="px-6 py-4 text-right">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-muted/10">
                    {historyOrders.map((order) => {
                      const address = order.deliveryAddress as any;
                      const area = address ? `${address.city}, ${address.state}` : 'N/A';
                      const itemCount = order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                      
                      return (
                        <tr key={order.id} className="hover:bg-background-muted/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-primary">#{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-text-secondary">
                            {(order as any).deliveredAt ? new Date((order as any).deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(order.updatedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-text-primary font-medium">{area}</td>
                          <td className="px-6 py-4 text-right font-bold text-text-primary">{itemCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-text-muted/10 flex items-center justify-between bg-background-muted/30">
                  <span className="text-xs text-text-secondary font-medium">
                    Showing page {page} of {totalPages}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-text-muted/20 text-text-primary hover:bg-white disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-text-muted/20 text-text-primary hover:bg-white disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
