import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Order } from '../types/cart';
import {
  Package,
  Clock,
  MapPin,
  ArrowRight,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const [isCopied, setIsCopied] = useState(false);

  // Unconditionally declared hooks at the top level
  const { data, isLoading, isError, error, refetch } = useQuery<{ success: boolean; data: Order }>({
    queryKey: ['order', id],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Order }>(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!id && (isSignedIn ?? false),
  });

  const order = data?.data;

  const handleCopyId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-text-secondary">
        <RefreshCw className="w-9 h-9 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <h3 className="font-heading font-bold text-base text-text-primary">
            Confirming Your Order...
          </h3>
          <p className="text-sm text-text-muted">
            Retrieving payment receipt and updating fulfillment status.
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !order) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4 shadow-soft">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold font-heading text-error">Order Not Found</h2>
          <p className="text-sm text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message ||
              'We were unable to locate your order details. If your payment went through, please check your orders list or try again.'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-background-card border border-text-muted/20 hover:bg-background-muted text-sm font-semibold text-text-primary rounded-xl cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <Link
              to="/my-world/orders"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors shadow-soft"
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasCourseItems = order.items?.some(
    (i) => i.itemType === 'COURSE' || Boolean(i.courseId)
  );
  const hasPhysicalItems = order.items?.some(
    (i) => i.itemType === 'PRODUCT' || Boolean(i.productId)
  );

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Hero Section: Animated Checkmark + Confirmed Heading */}
      <div className="text-center space-y-4 pt-2">
        {/* Circular Checkmark Icon with CSS scale & draw animation */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-light flex items-center justify-center checkmark-pop shadow-soft border border-primary/20">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 text-primary"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Order successful checkmark"
              role="img"
            >
              {/* Animated outer circle stroke */}
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="checkmark-circle"
              />
              {/* Animated checkmark stem */}
              <path
                d="M26 41 L36 51 L55 31"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="checkmark-stem"
              />
            </svg>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Thank you for supporting ethical, sustainable producers and creators. Your order has been placed and payment confirmed.
          </p>
        </div>

        {/* Order Identifier & Copy Snippet */}
        <div className="inline-flex items-center space-x-2 bg-background-card border border-text-muted/20 px-3.5 py-1.5 rounded-full text-sm shadow-xs">
          <span className="text-text-muted font-medium">Order Reference:</span>
          <span className="font-mono font-bold text-text-primary">{order.id}</span>
          <button
            onClick={handleCopyId}
            title="Copy Order ID"
            aria-label="Copy Order ID"
            className="p-1 rounded hover:bg-background-muted text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Digital Masterclass Activation Banner (if order contains digital courses) */}
      {hasCourseItems && (
        <div className="bg-secondary-light/70 border border-secondary/30 rounded-2xl p-5 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-secondary/15 rounded-xl text-secondary shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5 text-secondary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Digital Masterclass Activated
                </h3>
                <span className="bg-secondary text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Instant Access
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your course enrollment is live! You can immediately start watching video lessons, download learning materials, and track your progress.
              </p>
            </div>
          </div>
          <Link
            to="/my-world/courses"
            className="shrink-0 inline-flex items-center space-x-1.5 px-4 py-2 bg-secondary hover:bg-secondary-hover text-text-primary text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <span>Go to My Learning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Order Summary & Delivery Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Delivery Address or Digital Access */}
        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-4">
          <div className="flex items-center space-x-2 text-primary font-bold font-heading text-base border-b border-text-muted/10 pb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <h3>Delivery Details</h3>
          </div>

          {hasPhysicalItems && order.deliveryAddress ? (
            <div className="text-sm text-text-secondary space-y-1.5 leading-relaxed">
              <strong className="block text-text-primary text-base font-bold">
                {(order.deliveryAddress as any).recipientName}
              </strong>
              <p>{(order.deliveryAddress as any).streetAddress}</p>
              <p>
                {(order.deliveryAddress as any).city}, {(order.deliveryAddress as any).state} —{' '}
                {(order.deliveryAddress as any).postalCode}
              </p>
              <p className="pt-1 text-text-muted font-mono">
                Phone: {(order.deliveryAddress as any).phone}
              </p>
            </div>
          ) : hasPhysicalItems ? (
            <p className="text-sm text-text-muted italic">
              Standard profile address on file.
            </p>
          ) : (
            <div className="text-sm text-text-secondary space-y-1">
              <span className="font-semibold text-text-primary block">
                Direct Digital Delivery
              </span>
              <p>
                No physical shipping required. Access granted directly to your active account.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Payment Summary */}
        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-4">
          <div className="flex items-center space-x-2 text-primary font-bold font-heading text-base border-b border-text-muted/10 pb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3>Payment Summary</h3>
          </div>

          <div className="text-sm space-y-2 text-text-secondary">
            <div className="flex justify-between items-center">
              <span>Payment Status:</span>
              <span className="font-bold text-success bg-success-light px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wide flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{order.paymentStatus || 'PAID'}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Method:</span>
              <span className="text-text-primary font-medium">
                {order.paymentMethod || 'Mock Payment (Test Mode)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Transaction Reference:</span>
              <span className="font-mono text-[11px] text-text-muted truncate max-w-[170px]">
                {order.paymentId || 'MOCK_TXN_SUCCESS'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Date Placed:</span>
              <span className="text-text-primary">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-text-muted/10 font-bold text-text-primary">
              <span className="text-base">Total Paid:</span>
              <span className="text-primary font-heading text-lg">
                ₹{Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Items Card */}
      <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
          <h2 className="text-base font-bold font-heading text-primary">
            Purchased Items ({order.items?.length || 0})
          </h2>
          <span className="text-sm text-text-muted">
            Status: <strong className="text-text-primary uppercase">{order.status}</strong>
          </span>
        </div>

        <div className="divide-y divide-text-muted/10">
          {order.items?.map((item) => {
            const isCourse = item.itemType === 'COURSE' || Boolean(item.courseId);
            const title = item.product?.title || item.course?.title || 'Item';
            const imgUrl =
              item.product?.images?.[0] ||
              item.course?.previewVideo ||
              'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600';

            return (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={imgUrl}
                    alt={title}
                    className="w-14 h-14 rounded-xl object-cover border border-text-muted/15 shrink-0 bg-background-muted"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {isCourse ? (
                        <span className="inline-flex items-center space-x-1 bg-secondary-light text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <BookOpen className="w-3 h-3" />
                          <span>Digital Masterclass</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-primary-light text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Package className="w-3 h-3" />
                          <span>Physical Product</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-base text-text-primary">
                      {title}
                    </h4>
                    <p className="text-text-muted text-[11px]">
                      Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-heading font-bold text-base text-primary block">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                  {isCourse && item.courseId && (
                    <Link
                      to={`/my-world/courses/${item.courseId}/learn`}
                      className="text-[11px] text-secondary hover:underline inline-flex items-center space-x-0.5 mt-1 font-semibold"
                    >
                      <span>Start Learning</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear Next-Step Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-text-muted/15">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-background-card border border-text-muted/20 hover:bg-background-muted text-sm font-semibold text-text-primary rounded-xl transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span>Continue Shopping</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {hasCourseItems && (
            <Link
              to="/my-world/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 bg-secondary-light border border-secondary/30 hover:bg-secondary-light/80 text-sm font-bold text-text-primary rounded-xl transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-secondary" />
              <span>Access My Learning</span>
            </Link>
          )}

          <Link
            to={`/order/${order.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all shadow-soft cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track Your Order</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
