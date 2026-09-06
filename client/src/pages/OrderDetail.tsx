import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Order } from '../types/cart';
import OrderStatusStepper, { OrderStatusType } from '../components/OrderStatusStepper';
import { ArrowLeft, RefreshCw, AlertCircle, Package, MapPin, CreditCard, ShieldCheck, BookOpen, Download } from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async (orderId: string) => {
    const pdfWindow = window.open('', '_blank');
    try {
      setIsDownloading(true);
      const token = await getToken();
      const response = await apiClient.get(`/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      if (pdfWindow) {
        pdfWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (_err) {
      if (pdfWindow) pdfWindow.close();
      alert('Failed to preview invoice PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Order }>({
    queryKey: ['order', id],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Order }>(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isSignedIn && !!id,
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Fetching order receipt details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold font-heading text-error">Order Not Found</h2>
          <p className="text-xs text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || 'The requested order details could not be loaded.'}
          </p>
          <Link
            to="/my-world/orders"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const hasCourseOnly = order.items?.every(
    (i) => i.itemType === 'COURSE' || Boolean(i.courseId)
  );

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Order Summary & Delivery Tracking</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary">
            Order #{order.id.slice(0, 13)}
          </h1>
          <p className="text-xs text-text-secondary">Placed on {dateStr}</p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => handleDownloadInvoice(order.id)}
            disabled={isDownloading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-background-card border border-text-muted/20 hover:bg-background-muted disabled:opacity-50 text-xs font-semibold text-text-primary rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            {isDownloading ? (
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{isDownloading ? 'Generating...' : 'Download Invoice'}</span>
          </button>
          <Link
            to="/my-world/orders"
            className="flex items-center space-x-1 text-xs text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </Link>
        </div>
      </div>

      {/* Delivery Stepper Component */}
      <OrderStatusStepper
        status={order.status as OrderStatusType}
        hasCourseOnly={hasCourseOnly}
      />

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Items List */}
        <div className="md:col-span-2 bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-lg text-primary border-b border-text-muted/10 pb-3">
            Itemized Purchase ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-text-muted/10 space-y-3">
            {order.items?.map((item) => {
              const isCourse = item.itemType === 'COURSE' || Boolean(item.courseId);
              const imgUrl =
                item.product?.images?.[0] ||
                item.course?.previewVideo ||
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800';
              const title = item.product?.title || item.course?.title || 'Item';

              return (
                <div key={item.id} className="pt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={imgUrl}
                      alt={title}
                      className="w-14 h-14 rounded-xl object-cover border border-text-muted/15"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {isCourse ? (
                          <span className="inline-flex items-center space-x-1 bg-secondary-light text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <BookOpen className="w-3 h-3" />
                            <span>Digital Masterclass</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <Package className="w-3 h-3" />
                            <span>Physical Product</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading font-bold text-sm text-text-primary">
                        {title}
                      </h4>
                      <p className="text-xs text-text-muted">
                        Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <span className="font-heading font-bold text-sm text-primary">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 col): Address & Payment Receipt */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-primary uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Delivery Address</span>
            </div>
            {order.deliveryAddress ? (
              <div className="text-xs text-text-secondary leading-relaxed space-y-0.5">
                <strong className="block text-text-primary text-sm font-semibold">
                  {(order.deliveryAddress as any).recipientName}
                </strong>
                <p>{(order.deliveryAddress as any).streetAddress}</p>
                <p>
                  {(order.deliveryAddress as any).city}, {(order.deliveryAddress as any).state} —{' '}
                  {(order.deliveryAddress as any).postalCode}
                </p>
                <p className="pt-1 text-text-muted">Ph: {(order.deliveryAddress as any).phone}</p>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Digital delivery / Default profile address</p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-primary uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              <span>Payment Details</span>
            </div>

            <div className="space-y-2 text-xs text-text-secondary border-t border-text-muted/10 pt-3">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-success uppercase">{order.paymentStatus}</span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between text-[11px]">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-text-muted">{order.paymentId.slice(0, 16)}...</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-text-muted/10 font-bold text-sm text-text-primary">
                <span>Total Amount Paid:</span>
                <span className="text-primary font-heading text-lg">₹{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
