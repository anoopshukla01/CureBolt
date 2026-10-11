import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/order.dart';
import 'auth_service.dart';

class OrderCreationResult {
  final bool success;
  final OrderModel? order;
  final String? error;
  final List<Map<String, dynamic>>? itemErrors;

  const OrderCreationResult({
    required this.success,
    this.order,
    this.error,
    this.itemErrors,
  });
}

class OrderService {
  final AuthService authService;

  OrderService({required this.authService});

  String get _baseUrl => AuthService.baseUrl;

  /// Creates order with mandatory Idempotency-Key header to prevent duplicate charges
  Future<OrderCreationResult> placeOrder({
    required String pharmacyId,
    required String deliveryAddressId,
    required String categoryDomain,
    required String paymentMode,
    required List<Map<String, dynamic>> items,
    String? prescriptionId,
    String? deliveryNote,
    String? receiverName,
    String? receiverPhone,
    String? idempotencyKey,
  }) async {
    final userId = authService.currentUser?.id ?? 'usr-cust-1';
    final token = authService.authToken;

    final key = idempotencyKey ?? 'idemp-$userId-${DateTime.now().millisecondsSinceEpoch}';

    final payload = {
      'userId': userId,
      'pharmacyId': pharmacyId,
      'deliveryAddressId': deliveryAddressId,
      'categoryDomain': categoryDomain,
      'paymentMode': paymentMode,
      'items': items,
      if (prescriptionId != null) 'prescriptionId': prescriptionId,
      if (deliveryNote != null && deliveryNote.isNotEmpty) 'deliveryNote': deliveryNote,
      if (receiverName != null) 'receiverName': receiverName,
      if (receiverPhone != null) 'receiverPhone': receiverPhone,
    };

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['order'] != null) {
        final order = OrderModel.fromJson(data['order']);
        return OrderCreationResult(
          success: true,
          order: order,
        );
      } else {
        return OrderCreationResult(
          success: false,
          error: data['error'] ?? 'Order placement was rejected by server.',
          itemErrors: data['itemErrors'] != null
              ? List<Map<String, dynamic>>.from(data['itemErrors'])
              : null,
        );
      }
    } catch (e) {
      debugPrint('Error placing order: $e');
      return OrderCreationResult(
        success: false,
        error: 'Network connectivity failure. Please try again.',
      );
    }
  }

  /// Fetches an order by ID
  Future<OrderModel?> getOrder(String orderId) async {
    final token = authService.authToken;
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/orders/$orderId'),
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return OrderModel.fromJson(data['order']);
      }
    } catch (e) {
      debugPrint('Error fetching order: $e');
    }
    return null;
  }
}
