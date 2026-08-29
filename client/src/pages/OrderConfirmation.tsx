import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Order } from '../types/cart';
import { CheckCircle2, Package, Truck, Clock, MapPin, ArrowRight, ShoppingBag, RefreshCw, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
  { key: 'PACKED', label: 'Packed', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Order }>({
    queryKey: ['order', id],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Order }>(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!id,
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Fetching order confirmation details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold font-heading text-error">Order Not Found</h2>
          <p className="text-xs text-error/90">
            {(error as any)?.response?.data?.error?.message || 'Could not locate requested order.'}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Return to Shop</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === order.status)
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Order Confirmed Banner */}
      <div className="bg-success-light border border-success/30 rounded-2xl p-8 text-center space-y-3 shadow-soft">
        <CheckCircle2 className="w-14 h-14 mx-auto text-success" />
        <h1 className="text-3xl font-bold font-heading text-success">Order Successfully Placed!</h1>
        <p className="text-sm text-text-secondary">
          Thank you for supporting ethical, sustainable producers. Your order ID is{' '}
          <strong className="font-mono text-text-primary bg-background-card px-2.5 py-1 rounded border">
            {order.id}
          </strong>
        </p>
      </div>

      {/* Order Status Stepper */}
      <div className="bg-background-card rounded-2xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-6">
        <h2 className="text-base font-bold font-heading text-primary border-b border-text-muted/10 pb-3">
          Order Status Tracker
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentStepIdx;

            return (
              <div
                key={step.key}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 text-center transition-all ${
                  isCompleted
                    ? 'bg-primary-light/50 border-primary text-primary font-bold shadow-sm'
                    : 'bg-background-muted/40 border-text-muted/15 text-text-muted'
                }`}
              >
                <Icon className={`w-6 h-6 ${isCompleted ? 'text-primary' : 'text-text-muted'}`} />
                <span className="text-xs">{step.label}</span>
                {isCompleted && (
                  <span className="bg-primary text-white text-[9px] px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order & Delivery Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address */}
        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
          <div className="flex items-center space-x-2 text-primary font-bold font-heading text-sm border-b pb-2">
            <MapPin className="w-4 h-4" />
            <h3>Shipping Address</h3>
          </div>
          {order.deliveryAddress ? (
            <div className="text-xs text-text-secondary space-y-1">
              <strong className="block text-text-primary text-sm">
                {(order.deliveryAddress as any).recipientName}
              </strong>
              <p>{(order.deliveryAddress as any).streetAddress}</p>
              <p>
                {(order.deliveryAddress as any).city}, {(order.deliveryAddress as any).state} -{' '}
                {(order.deliveryAddress as any).postalCode}
              </p>
              <p className="pt-1 text-text-muted font-mono">Phone: {(order.deliveryAddress as any).phone}</p>
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">Standard Address</p>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
          <div className="flex items-center space-x-2 text-primary font-bold font-heading text-sm border-b pb-2">
            <Clock className="w-4 h-4" />
            <h3>Payment Summary</h3>
          </div>
          <div className="text-xs space-y-1.5 text-text-secondary">
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold text-success bg-success-light px-2 py-0.5 rounded">
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transaction Ref:</span>
              <span className="font-mono text-[11px] text-text-primary truncate max-w-[180px]">
                {order.paymentId || 'MOCK_TXN'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t text-sm font-bold text-text-primary">
              <span>Total Paid:</span>
              <span className="text-primary font-heading text-base">₹{Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Items Table */}
      <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-soft p-6 space-y-4">
        <h2 className="text-base font-bold font-heading text-primary border-b border-text-muted/10 pb-3">
          Purchased Items ({order.items?.length || 0})
        </h2>

        <div className="divide-y divide-text-muted/10">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <img
                  src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                  alt={item.product?.title || 'Product'}
                  className="w-12 h-12 rounded-xl object-cover border"
                />
                <div>
                  <h4 className="font-bold text-text-primary">{item.product?.title || 'Item'}</h4>
                  <span className="text-text-muted">Quantity: {item.quantity}</span>
                </div>
              </div>

              <span className="font-heading font-bold text-sm text-primary">
                ₹{(Number(item.price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <Link
          to="/shop"
          className="flex items-center space-x-2 px-5 py-2.5 bg-background-card border border-text-muted/20 hover:bg-background-muted text-xs font-semibold text-text-primary rounded-xl transition-colors"
        >
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span>Continue Shopping</span>
        </Link>

        <Link
          to="/my-account"
          className="flex items-center space-x-2 px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
        >
          <span>View All My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
