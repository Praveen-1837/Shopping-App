export interface PaymentProcessRequest {
  orderId: string;
  amount?: number;
  paymentMethod: string; // 'CARD' | 'UPI' | 'NETBANKING'
  simulateFailure?: boolean;
}

export interface PaymentProcessResult {
  success: boolean;
  transactionId: string;
  paymentStatus: 'SUCCESS' | 'FAILED';
  message: string;
  timestamp: string;
}

/**
 * Isolated Payment Service Function per Rules.md Section 4
 * All payment processing lives strictly inside this function.
 * In Phase 4 MVP, this function simulates a short delay and returns mocked results.
 */
export async function processPayment(params: PaymentProcessRequest): Promise<PaymentProcessResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (params.simulateFailure) {
    return {
      success: false,
      transactionId: `MOCK_FAIL_${Date.now()}`,
      paymentStatus: 'FAILED',
      message: 'Simulated Payment Failure (Test Mode). Card/UPI transaction was declined by bank.',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    transactionId: `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    paymentStatus: 'SUCCESS',
    message: 'Payment processed successfully via Mock Payment Service (Test Mode).',
    timestamp: new Date().toISOString(),
  };
}
