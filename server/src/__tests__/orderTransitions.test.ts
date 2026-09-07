import { OrderStatus } from '@prisma/client';

// State Machine transition rules from orderController.ts
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  IN_TRANSIT: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

describe('Order State Machine Transition Rules (Phase 6)', () => {
  it('should allow valid transition CONFIRMED -> PACKED', () => {
    expect(isValidTransition(OrderStatus.CONFIRMED, OrderStatus.PACKED)).toBe(true);
  });

  it('should allow valid transition PACKED -> SHIPPED', () => {
    expect(isValidTransition(OrderStatus.PACKED, OrderStatus.SHIPPED)).toBe(true);
  });

  it('should reject illegal backwards transition DELIVERED -> CONFIRMED', () => {
    expect(isValidTransition(OrderStatus.DELIVERED, OrderStatus.CONFIRMED)).toBe(false);
  });

  it('should reject illegal jump transition CONFIRMED -> DELIVERED', () => {
    expect(isValidTransition(OrderStatus.CONFIRMED, OrderStatus.DELIVERED)).toBe(false);
  });

  it('should reject any transition once order is CANCELLED', () => {
    expect(isValidTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
  });
});
