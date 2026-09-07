import { CheckCircle2, Circle, Truck, Package, ShieldCheck, Clock, XCircle, Sparkles } from 'lucide-react';

export type OrderStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

interface OrderStatusStepperProps {
  status: OrderStatusType;
  hasCourseOnly?: boolean;
  cancellationReason?: string;
}

const STEPS: { key: OrderStatusType; label: string; icon: any }[] = [
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: ShieldCheck },
  { key: 'PACKED', label: 'Packed', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Clock },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderStatusStepper({ status, hasCourseOnly = false, cancellationReason }: OrderStatusStepperProps) {
  if (hasCourseOnly) {
    return (
      <div className="bg-secondary-light/40 border border-secondary/30 rounded-2xl p-5 flex items-center space-x-3 text-secondary">
        <Sparkles className="w-6 h-6 shrink-0 text-secondary animate-pulse" />
        <div>
          <h4 className="font-heading font-bold text-sm">Instant Digital Access Activated</h4>
          <p className="text-xs text-text-secondary">
            No physical shipping required. All course modules are unlocked in your <strong>My Learning</strong> workspace.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className="bg-error-light border border-error/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start gap-4 text-error shadow-soft">
        <div className="p-3 bg-white/70 rounded-xl w-fit shrink-0 text-error">
          <XCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="font-heading font-bold text-base text-text-primary">Order Cancelled</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            {cancellationReason ? (
              <span>
                This order was cancelled by the seller.{' '}
                <span className="font-semibold text-text-primary">Reason:</span>{' '}
                <span className="italic bg-background-card px-2.5 py-1 rounded-md border border-text-muted/15 font-medium text-error inline-block mt-0.5">
                  "{cancellationReason}"
                </span>
              </span>
            ) : (
              'This order was cancelled by the seller before fulfillment.'
            )}
          </p>
          <p className="text-[11px] text-text-muted pt-1">
            If payment was deducted, a full refund has been automatically credited to your original payment method.
          </p>
        </div>
      </div>
    );
  }

  // Find index of current status in stepper
  let currentIdx = STEPS.findIndex((s) => s.key === status);
  if (status === 'PENDING') currentIdx = 0; // Show confirmed as pending step 0

  return (
    <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-4">
      <h4 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider">
        Shipment Delivery Progress
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-2 transition-all ${
                isCurrent
                  ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20 shadow-soft'
                  : isCompleted
                  ? 'border-success/30 bg-success-light/30 text-success'
                  : 'border-text-muted/15 bg-background-muted/30 text-text-muted opacity-60'
              }`}
            >
              <div className="relative">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : isCurrent ? (
                  <Icon className="w-5 h-5 text-primary animate-bounce" />
                ) : (
                  <Circle className="w-5 h-5 text-text-muted" />
                )}
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  isCurrent
                    ? 'text-primary font-bold'
                    : isCompleted
                    ? 'text-success font-semibold'
                    : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
