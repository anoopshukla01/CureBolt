import '../api_client.dart';

class RiderApiClient {
  final ApiClient client;

  RiderApiClient({required this.client});

  Future<void> sendLocationUpdate({
    required double latitude,
    required double longitude,
    double? speed,
    double? heading,
    int? batteryLevel,
  }) async {
    await client.post('/rider/location', body: {
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'heading': heading,
      'batteryLevel': batteryLevel,
    });
  }

  Future<List<dynamic>> getAvailableOrders() async {
    final res = await client.get('/rider/orders/available');
    if (res is Map<String, dynamic> && res.containsKey('orders')) {
      return res['orders'] as List<dynamic>;
    }
    return (res as List<dynamic>?) ?? [];
  }

  Future<Map<String, dynamic>> acceptOrder(String orderId) async {
    final res = await client.post('/rider/orders/$orderId/accept');
    return res as Map<String, dynamic>;
  }
}
