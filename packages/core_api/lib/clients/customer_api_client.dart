import '../api_client.dart';

class CustomerApiClient {
  final ApiClient client;

  CustomerApiClient({required this.client});

  Future<Map<String, dynamic>> getCatalogue({String? domain, String? query}) async {
    final queryParams = <String, String>{};
    if (domain != null) queryParams['domain'] = domain;
    if (query != null) queryParams['query'] = query;

    final queryString = queryParams.isNotEmpty
        ? '?${Uri(queryParameters: queryParams).query}'
        : '';
    final res = await client.get('/catalogue/products$queryString');
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> validateCart(List<Map<String, dynamic>> items) async {
    final res = await client.post('/cart/validate', body: {'items': items});
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getOrder(String orderId) async {
    final res = await client.get('/orders/$orderId');
    return res as Map<String, dynamic>;
  }
}
