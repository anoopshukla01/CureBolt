/// Explicit order state machine states enforced by the backend
enum OrderState {
  created,
  paymentPending,
  paymentConfirmed,
  pharmacyReview,
  prescriptionClarification,
  accepted,
  rejected,
  packing,
  packed,
  riderAssigned,
  pickedUp,
  outForDelivery,
  delivered,
  cancelled,
  deliveryFailed,
  refundPending,
  refunded;

  String toDbString() {
    switch (this) {
      case OrderState.created: return 'CREATED';
      case OrderState.paymentPending: return 'PAYMENT_PENDING';
      case OrderState.paymentConfirmed: return 'PAYMENT_CONFIRMED';
      case OrderState.pharmacyReview: return 'PHARMACY_REVIEW';
      case OrderState.prescriptionClarification: return 'PRESCRIPTION_CLARIFICATION';
      case OrderState.accepted: return 'ACCEPTED';
      case OrderState.rejected: return 'REJECTED';
      case OrderState.packing: return 'PACKING';
      case OrderState.packed: return 'PACKED';
      case OrderState.riderAssigned: return 'RIDER_ASSIGNED';
      case OrderState.pickedUp: return 'PICKED_UP';
      case OrderState.outForDelivery: return 'OUT_FOR_DELIVERY';
      case OrderState.delivered: return 'DELIVERED';
      case OrderState.cancelled: return 'CANCELLED';
      case OrderState.deliveryFailed: return 'DELIVERY_FAILED';
      case OrderState.refundPending: return 'REFUND_PENDING';
      case OrderState.refunded: return 'REFUNDED';
    }
  }

  static OrderState fromDbString(String str) {
    switch (str.toUpperCase()) {
      case 'PAYMENT_PENDING': return OrderState.paymentPending;
      case 'PAYMENT_CONFIRMED': return OrderState.paymentConfirmed;
      case 'PHARMACY_REVIEW': return OrderState.pharmacyReview;
      case 'PRESCRIPTION_CLARIFICATION': return OrderState.prescriptionClarification;
      case 'ACCEPTED': return OrderState.accepted;
      case 'REJECTED': return OrderState.rejected;
      case 'PACKING': return OrderState.packing;
      case 'PACKED': return OrderState.packed;
      case 'RIDER_ASSIGNED': return OrderState.riderAssigned;
      case 'PICKED_UP': return OrderState.pickedUp;
      case 'OUT_FOR_DELIVERY': return OrderState.outForDelivery;
      case 'DELIVERED': return OrderState.delivered;
      case 'CANCELLED': return OrderState.cancelled;
      case 'DELIVERY_FAILED': return OrderState.deliveryFailed;
      case 'REFUND_PENDING': return OrderState.refundPending;
      case 'REFUNDED': return OrderState.refunded;
      case 'CREATED':
      default:
        return OrderState.created;
    }
  }
}

/// User roles across all application surfaces
enum UserRole {
  customer,
  rider,
  deliveryPartner,
  pharmacyOwner,
  pharmacist,
  pharmacyStaff,
  platformAdmin,
  supportOperator;

  static UserRole fromString(String val) {
    switch (val.toLowerCase()) {
      case 'rider':
      case 'delivery_partner':
        return UserRole.deliveryPartner;
      case 'pharmacy_owner':
      case 'owner':
        return UserRole.pharmacyOwner;
      case 'pharmacist':
        return UserRole.pharmacist;
      case 'pharmacy_staff':
      case 'staff':
        return UserRole.pharmacyStaff;
      case 'platform_admin':
      case 'admin':
        return UserRole.platformAdmin;
      case 'support_operator':
        return UserRole.supportOperator;
      case 'customer':
      default:
        return UserRole.customer;
    }
  }
}

/// Healthcare domain divisions
enum HealthcareDomain {
  human,
  veterinary;

  static HealthcareDomain fromString(String val) {
    return val.toLowerCase() == 'veterinary' ? HealthcareDomain.veterinary : HealthcareDomain.human;
  }
}

/// Supported payment modes
enum PaymentMode {
  online,
  cod;

  static PaymentMode fromString(String val) {
    return val.toUpperCase() == 'COD' ? PaymentMode.cod : PaymentMode.online;
  }
}

/// Availability badges for products
enum StockBadge {
  inStock,
  lowStock,
  outOfStock;

  static StockBadge fromString(String val) {
    switch (val.toLowerCase()) {
      case 'low_stock': return StockBadge.lowStock;
      case 'out_of_stock': return StockBadge.outOfStock;
      case 'in_stock':
      default:
        return StockBadge.inStock;
    }
  }
}
