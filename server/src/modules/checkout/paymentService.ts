export interface PaymentRequest {
  orderId?: string;
  amount: number;
  paymentMethod: string; // 'CARD' | 'UPI' | 'NETBANKING'
  simulateFailure?: boolean;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentStatus: 'SUCCESS' | 'FAILED';
  message: string;
  timestamp: string;
}

/**
 * Isolated Payment Seam Function
 * In MVP (Phase 4), this function simulates mock payment processing.
 * Post-MVP (Razorpay / Stripe integration), ONLY this file needs to be updated.
 */
export async function processPayment(params: PaymentRequest): Promise<PaymentResponse> {
  // Simulate 800ms network delay for realistic gateway experience
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (params.simulateFailure) {
    return {
      success: false,
      transactionId: `MOCK_FAIL_${Date.now()}`,
      paymentStatus: 'FAILED',
      message: 'Simulated payment failure (Test Mode). Card declined by issuing bank.',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    transactionId: `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    paymentStatus: 'SUCCESS',
    message: 'Payment processed successfully via Mock Payment Gateway (Test Mode).',
    timestamp: new Date().toISOString(),
  };
}
