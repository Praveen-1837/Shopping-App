import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Truck, MapPin, Phone, RefreshCw, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import { Order } from '../types/cart';

export default function DeliveryCentre() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Order[] }>({
    queryKey: ['delivery-orders'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Order[] }>('/delivery/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
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

  const orders = data?.data || [];

  const handleAction = (order: Order) => {
    let nextStatus = '';
    if (order.status === 'SHIPPED') nextStatus = 'IN_TRANSIT';
    else if (order.status === 'IN_TRANSIT') nextStatus = 'OUT_FOR_DELIVERY';
    else if (order.status === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId: order.id, status: nextStatus });
    }
  };

  const getActionLabel = (status: string) => {
    if (status === 'SHIPPED') return 'Mark Picked Up';
    if (status === 'IN_TRANSIT') return 'Mark Out for Delivery';
    if (status === 'OUT_FOR_DELIVERY') return 'Mark Delivered';
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">Delivery Centre</h1>
          <p className="text-xs text-text-secondary">
            Manage your active deliveries and route assignments.
          </p>
        </div>
      </div>

      {transitionError && (
        <div className="p-4 bg-error-light border border-error/30 text-error text-xs font-bold rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{transitionError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-text-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs">Loading delivery assignments...</p>
        </div>
      ) : isError ? (
        <div className="p-6 bg-error-light border border-error/30 text-error rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-xs font-bold">{(error as any)?.response?.data?.error?.message || 'Access Denied'}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-background-card rounded-3xl p-12 text-center text-xs text-text-muted border border-text-muted/15 space-y-2">
          <CheckCircle2 className="w-8 h-8 mx-auto text-success" />
          <p className="font-bold text-sm text-text-primary">No Active Deliveries</p>
          <p>You have no pending deliveries assigned at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
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
                    className="w-full py-2.5 bg-background-muted hover:bg-background-muted/80 text-text-primary text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigate</span>
                  </a>

                  {actionLabel && (
                    <button
                      onClick={() => handleAction(order)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {updateStatusMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{actionLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
