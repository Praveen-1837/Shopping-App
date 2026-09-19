import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Cart as CartType, Order } from '../types/cart';
import { ShieldCheck, CreditCard, QrCode, Building2, AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Lock } from 'lucide-react';

export default function Payment() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Retrieve delivery address saved in step 1
  const deliveryAddress = JSON.parse(
    sessionStorage.getItem('deliveryAddress') ||
      JSON.stringify({
        recipientName: 'Praveen Shinde',
        streetAddress: '12 Blooming Meadows, MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        phone: '+919876543210',
      })
  );

  // Fetch active cart details
  const { data: cartData } = useQuery<{ success: boolean; data: CartType }>({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: CartType }>('/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Step 1: Create Order in PENDING status
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await apiClient.post(
        '/checkout',
        { deliveryAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data) => {
      setActiveOrder(data.data);
    },
  });

  useEffect(() => {
    if (!activeOrder && cartData?.data?.items?.length) {
      createOrderMutation.mutate();
    }
  }, [cartData]);

  // Step 2: Call POST /api/v1/payments/process
  const processPaymentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const token = await getToken();
      const res = await apiClient.post(
        '/payments/process',
        {
          orderId,
          paymentMethod,
          simulateFailure,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/order/${resData.data.id}/confirmation`);
    },
    onError: (err: any) => {
      setPaymentError(
        err.response?.data?.error?.message ||
          err.message ||
          'Simulated payment failure (Test Mode). Please try again or switch simulation mode.'
      );
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-clicks strictly and synchronously
    if (isSubmitting || processPaymentMutation.isPending || createOrderMutation.isPending) return;
    
    setIsSubmitting(true);
    setPaymentError(null);

    if (activeOrder) {
      processPaymentMutation.mutate(activeOrder.id, {
        onSettled: () => setIsSubmitting(false),
      });
    } else {
      createOrderMutation.mutate(undefined, {
        onSuccess: (data) => {
          // Instead of requiring a second click, process payment immediately after order creates
          processPaymentMutation.mutate(data.data.id, {
            onSettled: () => setIsSubmitting(false),
          });
        },
        onError: () => setIsSubmitting(false),
      });
    }
  };

  const totalAmount = activeOrder ? Number(activeOrder.total) : 0;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-text-muted/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-secondary font-semibold text-sm uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4 text-secondary" />
            <span>Step 2 of 2 — Secure Checkout</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary">Payment Portal</h1>
          <p className="text-base text-text-secondary">Select your preferred mock payment channel</p>
        </div>

        <Link
          to="/checkout"
          className="flex items-center space-x-1 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Address</span>
        </Link>
      </div>

      {/* Mandatory TEST MODE Banner per Rules.md Section 4 */}
      <div className="bg-warning-light/90 border-2 border-warning/40 rounded-2xl p-4 text-warning font-semibold flex items-center justify-between shadow-soft">
        <div className="flex items-center space-x-3 text-sm sm:text-base">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
          <div>
            <strong className="block font-heading text-base uppercase tracking-wide">
              Test Mode — No Real Payment Will Be Processed
            </strong>
            <span>All transaction outcomes are simulated via an isolated payment service. No real money will be charged.</span>
          </div>
        </div>
      </div>

      {/* Payment Error Alert */}
      {paymentError && (
        <div className="bg-error-light border border-error/30 rounded-2xl p-5 text-error space-y-2">
          <div className="flex items-center space-x-3">
            <XCircle className="w-6 h-6 shrink-0 text-error" />
            <div>
              <h4 className="font-bold text-base font-heading">Payment Failed</h4>
              <p className="text-sm">{paymentError}</p>
            </div>
          </div>
          <p className="text-[11px] text-error/80 pt-1 border-t border-error/20">
            Note: Your cart items have been preserved. Select "Simulate Successful Payment" below to retry.
          </p>
        </div>
      )}

      {/* Main Payment Container */}
      <form onSubmit={handlePayNow} className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-8">
        {/* Payment Method Selector Tabs */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text-primary uppercase tracking-wider">
            Select Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-4 rounded-xl border-2 text-left flex items-center space-x-3 transition-all cursor-pointer ${
                paymentMethod === 'CARD'
                  ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20'
                  : 'border-text-muted/20 hover:border-primary/40 bg-background-muted/40'
              }`}
            >
              <CreditCard className="w-5 h-5 text-primary" />
              <div>
                <span className="block font-bold text-sm text-text-primary">Card Payment</span>
                <span className="text-[10px] text-text-muted">Visa, Mastercard, RuPay</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-4 rounded-xl border-2 text-left flex items-center space-x-3 transition-all cursor-pointer ${
                paymentMethod === 'UPI'
                  ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20'
                  : 'border-text-muted/20 hover:border-primary/40 bg-background-muted/40'
              }`}
            >
              <QrCode className="w-5 h-5 text-primary" />
              <div>
                <span className="block font-bold text-sm text-text-primary">UPI QR / VPA</span>
                <span className="text-[10px] text-text-muted">GPay, PhonePe, Paytm</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('NETBANKING')}
              className={`p-4 rounded-xl border-2 text-left flex items-center space-x-3 transition-all cursor-pointer ${
                paymentMethod === 'NETBANKING'
                  ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20'
                  : 'border-text-muted/20 hover:border-primary/40 bg-background-muted/40'
              }`}
            >
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <span className="block font-bold text-sm text-text-primary">Net Banking</span>
                <span className="text-[10px] text-text-muted">HDFC, SBI, ICICI</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Specific Mock Input Details */}
        <div className="bg-background-muted/50 rounded-xl p-5 border border-text-muted/10 space-y-3">
          {paymentMethod === 'CARD' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-text-secondary">Simulated Test Card Details:</div>
              <input
                type="text"
                disabled
                value="4242 •••• •••• 4242 (Test Card)"
                className="w-full px-4 py-2 bg-background-card border border-text-muted/20 rounded-lg text-sm font-mono"
              />
            </div>
          )}

          {paymentMethod === 'UPI' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-text-secondary">Simulated Virtual Payment Address:</div>
              <input
                type="text"
                disabled
                value="user@okhdfcbank (Test UPI ID)"
                className="w-full px-4 py-2 bg-background-card border border-text-muted/20 rounded-lg text-sm font-mono"
              />
            </div>
          )}

          {paymentMethod === 'NETBANKING' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-text-secondary">Simulated Bank Selection:</div>
              <input
                type="text"
                disabled
                value="HDFC Bank — NetBanking Gateway"
                className="w-full px-4 py-2 bg-background-card border border-text-muted/20 rounded-lg text-sm font-mono"
              />
            </div>
          )}
        </div>

        {/* Developer Simulation Toggle Controls */}
        <div className="bg-background-muted/80 rounded-xl p-4 border border-text-muted/15 space-y-2">
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider block">
            🧪 Test Simulation Mode:
          </span>
          <div className="flex items-center space-x-6 text-sm text-text-secondary">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="simMode"
                checked={!simulateFailure}
                onChange={() => setSimulateFailure(false)}
                className="accent-primary"
              />
              <span className="font-semibold text-success flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Successful Payment</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="simMode"
                checked={simulateFailure}
                onChange={() => setSimulateFailure(true)}
                className="accent-error"
              />
              <span className="font-semibold text-error flex items-center space-x-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Simulate Declined / Failed Payment</span>
              </span>
            </label>
          </div>
        </div>

        {/* Submit Payment CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-text-muted/10">
          <div>
            <span className="text-sm text-text-muted block">Total Payable Amount</span>
            <span className="text-2xl font-bold font-heading text-primary">₹{totalAmount.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || processPaymentMutation.isPending || createOrderMutation.isPending}
            className="px-8 py-3.5 bg-primary text-white hover:bg-primary-hover font-semibold text-base rounded-xl transition-all shadow-soft flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting || processPaymentMutation.isPending || createOrderMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Pay Now (Test Mode)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
