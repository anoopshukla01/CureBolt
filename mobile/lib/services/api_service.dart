import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';

class ApiService {
  // Points to local backend or production Supabase / Edge API
  static const String baseUrl = 'http://10.0.2.2:4000/api/v1'; // Android emulator localhost

  static Future<bool> checkServiceability(double lat, double lng) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/serviceability/check?lat=$lat&lng=$lng'));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        return data['is_serviceable'] ?? false;
      }
      return false;
    } catch (_) {
      return true; // Fallback during demo
    }
  }

  static Future<List<Product>> fetchProducts(String domain, {String query = ''}) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/catalogue/products?domain=$domain&query=$query'));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final List items = data['items'] ?? [];
        return items.map((i) => Product.fromJson(i)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<String?> uploadPrescriptionIntent(String userId, String fileName) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/prescriptions/upload-intent'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'fileName': fileName,
          'doctorName': 'Dr. R.K. Sharma, BRD Medical College Gorakhpur'
        }),
      );
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        return data['prescription_id'];
      }
      return null;
    } catch (_) {
      return 'rx-demo-${DateTime.now().millisecondsSinceEpoch}';
    }
  }
}
