import { OrderState } from '../types';

export class OrderStateMachine {
  // Explicit permitted transitions map
  private static readonly transitions: Record<OrderState, OrderState[]> = {
    CREATED: ['PAYMENT_PENDING', 'PHARMACY_REVIEW', 'ACCEPTED', 'CANCELLED'],
    PAYMENT_PENDING: ['PAYMENT_CONFIRMED', 'CANCELLED'],
    PAYMENT_CONFIRMED: ['PHARMACY_REVIEW', 'PACKING', 'CANCELLED', 'REFUND_PENDING'],
    PHARMACY_REVIEW: ['ACCEPTED', 'REJECTED'],
    ACCEPTED: ['PAYMENT_PENDING', 'PACKING', 'CANCELLED'],
    REJECTED: ['REFUND_PENDING', 'CANCELLED'],
    PACKING: ['PACKED', 'CANCELLED'],
    PACKED: ['RIDER_ASSIGNED', 'CANCELLED'],
    RIDER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
    DELIVERED: [], // Terminal successful state
    CANCELLED: ['REFUND_PENDING'],
    DELIVERY_FAILED: ['REFUND_PENDING', 'OUT_FOR_DELIVERY'],
    REFUND_PENDING: ['REFUNDED'],
    REFUNDED: [] // Terminal refund state
  };

  public static canTransition(from: OrderState, to: OrderState): boolean {
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  public static validateTransition(from: OrderState, to: OrderState): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid order state transition from ${from} to ${to}.`);
    }
  }
}
