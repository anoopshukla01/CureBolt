import '../api_client.dart';

class PharmacyApiClient {
  final ApiClient client;

  PharmacyApiClient({required this.client});

  Future<Map<String, dynamic>> getOrders({String? status}) async {
    final path = status != null ? '/pharmacy/orders?status=$status' : '/pharmacy/orders';
    final res = await client.get(path);
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> markPacked(String orderId, {String? notes}) async {
    final res = await client.post('/pharmacy/orders/$orderId/pack', body: {
      if (notes != null) 'notes': notes,
    });
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getInventory() async {
    final res = await client.get('/pharmacy/inventory');
    return res as Map<String, dynamic>;
  }
}
