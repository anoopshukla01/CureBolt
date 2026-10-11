class OrderItemModel {
  final String productId;
  final String productName;
  final String? packSize;
  final int unitPricePaise;
  final int quantity;
  final int lineTotalPaise;
  final bool requiresPrescription;
  final String? imageUrl;

  const OrderItemModel({
    required this.productId,
    required this.productName,
    this.packSize,
    required this.unitPricePaise,
    required this.quantity,
    required this.lineTotalPaise,
    this.requiresPrescription = false,
    this.imageUrl,
  });

  double get unitPrice => unitPricePaise / 100.0;
  double get lineTotal => lineTotalPaise / 100.0;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? json['product_name_snapshot'] as String? ?? '',
      packSize: json['packSizeSnapshot'] as String? ?? json['pack_size_snapshot'] as String?,
      unitPricePaise: json['unitPricePaise'] as int? ?? json['unit_price_paise'] as int? ?? ((json['unitPrice'] as num? ?? 0) * 100).round(),
      quantity: json['quantity'] as int? ?? 1,
      lineTotalPaise: json['lineTotalPaise'] as int? ?? json['line_total_paise'] as int? ?? ((json['unitPrice'] as num? ?? 0) * (json['quantity'] as num? ?? 1) * 100).round(),
      requiresPrescription: json['requiresPrescription'] as bool? ?? json['requires_prescription'] as bool? ?? false,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'productName': productName,
      'packSize': packSize,
      'unitPricePaise': unitPricePaise,
      'quantity': quantity,
      'lineTotalPaise': lineTotalPaise,
      'requiresPrescription': requiresPrescription,
    };
  }
}

class OrderModel {
  final String id;
  final String orderCode;
  final String userId;
  final String pharmacyId;
  final String pharmacyName;
  final String deliveryAddressId;
  final Map<String, dynamic>? deliveryAddressSnapshot;
  final String receiverName;
  final String receiverPhone;
  final String? deliveryNote;
  final String categoryDomain;
  final String paymentMode;
  final String state;
  final List<OrderItemModel> items;
  final String? prescriptionId;
  
  // Exact Integer Paise Amounts (Money Rule: server-calculated)
  final int itemTotalPaise;
  final int deliveryFeePaise;
  final int handlingFeePaise;
  final int discountPaise;
  final int payableAmountPaise;

  final String deliveryOtp;
  final String? idempotencyKey;
  final String createdAt;

  const OrderModel({
    required this.id,
    required this.orderCode,
    required this.userId,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.deliveryAddressId,
    this.deliveryAddressSnapshot,
    required this.receiverName,
    required this.receiverPhone,
    this.deliveryNote,
    required this.categoryDomain,
    required this.paymentMode,
    required this.state,
    required this.items,
    this.prescriptionId,
    required this.itemTotalPaise,
    required this.deliveryFeePaise,
    required this.handlingFeePaise,
    required this.discountPaise,
    required this.payableAmountPaise,
    required this.deliveryOtp,
    this.idempotencyKey,
    required this.createdAt,
  });

  // Display Formatters
  String get formattedItemTotal => '₹${(itemTotalPaise / 100.0).toStringAsFixed(2)}';
  String get formattedDeliveryFee => deliveryFeePaise == 0 ? 'FREE' : '₹${(deliveryFeePaise / 100.0).toStringAsFixed(0)}';
  String get formattedHandlingFee => '₹${(handlingFeePaise / 100.0).toStringAsFixed(0)}';
  String get formattedDiscount => '₹${(discountPaise / 100.0).toStringAsFixed(2)}';
  String get formattedGrandTotal => '₹${(payableAmountPaise / 100.0).toStringAsFixed(2)}';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String? ?? '',
      orderCode: json['orderCode'] as String? ?? json['order_code'] as String? ?? '',
      userId: json['userId'] as String? ?? json['user_id'] as String? ?? '',
      pharmacyId: json['pharmacyId'] as String? ?? json['pharmacy_id'] as String? ?? '',
      pharmacyName: json['pharmacyNameSnapshot'] as String? ?? json['pharmacy_name_snapshot'] as String? ?? 'Gorakhpur Partner Pharmacy',
      deliveryAddressId: json['deliveryAddressId'] as String? ?? json['delivery_address_id'] as String? ?? '',
      deliveryAddressSnapshot: json['deliveryAddressSnapshot'] as Map<String, dynamic>? ?? json['delivery_address_snapshot'] as Map<String, dynamic>?,
      receiverName: json['receiverName'] as String? ?? json['receiver_name'] as String? ?? 'Customer',
      receiverPhone: json['receiverPhone'] as String? ?? json['receiver_phone'] as String? ?? '',
      deliveryNote: json['deliveryNote'] as String? ?? json['delivery_note'] as String?,
      categoryDomain: json['categoryDomain'] as String? ?? json['category_domain'] as String? ?? 'human',
      paymentMode: json['paymentMode'] as String? ?? json['payment_mode'] as String? ?? 'ONLINE',
      state: json['state'] as String? ?? 'CREATED',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((item) => OrderItemModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      prescriptionId: json['prescriptionId'] as String? ?? json['prescription_id'] as String?,
      itemTotalPaise: json['itemTotalPaise'] as int? ?? json['item_total_paise'] as int? ?? (((json['totalMrp'] as num? ?? 0) * 100).round()),
      deliveryFeePaise: json['deliveryFeePaise'] as int? ?? json['delivery_fee_paise'] as int? ?? (((json['deliveryFee'] as num? ?? 0) * 100).round()),
      handlingFeePaise: json['handlingFeePaise'] as int? ?? json['handling_fee_paise'] as int? ?? 500,
      discountPaise: json['discountPaise'] as int? ?? json['discount_paise'] as int? ?? (((json['totalDiscount'] as num? ?? 0) * 100).round()),
      payableAmountPaise: json['payableAmountPaise'] as int? ?? json['payable_amount_paise'] as int? ?? (((json['payableAmount'] as num? ?? 0) * 100).round()),
      deliveryOtp: json['deliveryOtp'] as String? ?? json['delivery_otp'] as String? ?? '0000',
      idempotencyKey: json['idempotencyKey'] as String? ?? json['idempotency_key'] as String?,
      createdAt: json['createdAt'] as String? ?? json['created_at'] as String? ?? DateTime.now().toIso8601String(),
    );
  }
}
