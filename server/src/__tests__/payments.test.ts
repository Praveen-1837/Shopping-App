import { processPayment } from '../modules/payments/payment.service';

describe('Payment Seam Service (Phase 4)', () => {
  it('should process payment successfully when simulateFailure is false', async () => {
    const result = await processPayment({
      orderId: 'order_123',
      amount: 450.0,
      paymentMethod: 'CARD',
      simulateFailure: false,
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^MOCK_TXN_/);
    expect(result.message).toContain('processed successfully');
  });

  it('should fail payment when simulateFailure is true', async () => {
    const result = await processPayment({
      orderId: 'order_456',
      amount: 450.0,
      paymentMethod: 'CARD',
      simulateFailure: true,
    });

    expect(result.success).toBe(false);
    expect(result.transactionId).toMatch(/^MOCK_FAIL_/);
    expect(result.message.toLowerCase()).toContain('declined');
  });
});
