import 'enums.dart';

class OrderItemModel {
  final String productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final String? batchNumber;
  final String? expiryDate;
  final String? imageUrl;

  const OrderItemModel({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    this.batchNumber,
    this.expiryDate,
    this.imageUrl,
  });

  double get lineTotal => quantity * unitPrice;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? json['name'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? (json['price'] as num?)?.toDouble() ?? 0.0,
      batchNumber: json['batchNumber'] as String?,
      expiryDate: json['expiryDate'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'productName': productName,
    'quantity': quantity,
    'unitPrice': unitPrice,
    'batchNumber': batchNumber,
    'expiryDate': expiryDate,
    'imageUrl': imageUrl,
  };
}

class OrderModel {
  final String id;
  final String orderNumber;
  final OrderState state;
  final PaymentMode paymentMode;
  final List<OrderItemModel> items;
  final double subtotal;
  final double deliveryFee;
  final double taxes;
  final double total;
  final String pharmacyId;
  final String pharmacyName;
  final String deliveryAddress;
  final String? riderId;
  final String? riderName;
  final String? deliveryOtp;
  final String? handoverOtp;
  final DateTime createdAt;

  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.state,
    required this.paymentMode,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.taxes,
    required this.total,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.deliveryAddress,
    this.riderId,
    this.riderName,
    this.deliveryOtp,
    this.handoverOtp,
    required this.createdAt,
  });

  bool get isCod => paymentMode == PaymentMode.cod;
  bool get isCompleted => state == OrderState.delivered;
  bool get isCancelled => state == OrderState.cancelled;
  bool get isActiveDelivery => state == OrderState.outForDelivery || state == OrderState.pickedUp;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String? ?? '',
      orderNumber: json['orderNumber'] as String? ?? json['id'] as String? ?? '',
      state: OrderState.fromDbString(json['state'] as String? ?? json['status'] as String? ?? 'CREATED'),
      paymentMode: PaymentMode.fromString(json['paymentMode'] as String? ?? 'ONLINE'),
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => OrderItemModel.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 25.0,
      taxes: (json['taxes'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      pharmacyId: json['pharmacyId'] as String? ?? '',
      pharmacyName: json['pharmacyName'] as String? ?? 'Medcure Partner Pharmacy',
      deliveryAddress: json['deliveryAddress'] as String? ?? 'Gorakhpur, UP',
      riderId: json['riderId'] as String?,
      riderName: json['riderName'] as String?,
      deliveryOtp: json['deliveryOtp'] as String?,
      handoverOtp: json['handoverOtp'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'orderNumber': orderNumber,
    'state': state.toDbString(),
    'paymentMode': paymentMode.name.toUpperCase(),
    'items': items.map((i) => i.toJson()).toList(),
    'subtotal': subtotal,
    'deliveryFee': deliveryFee,
    'taxes': taxes,
    'total': total,
    'pharmacyId': pharmacyId,
    'pharmacyName': pharmacyName,
    'deliveryAddress': deliveryAddress,
    'riderId': riderId,
    'riderName': riderName,
    'deliveryOtp': deliveryOtp,
    'handoverOtp': handoverOtp,
    'createdAt': createdAt.toIso8601String(),
  };
}
