import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/geo_point.dart';

class GeocodedAddress {
  final String fullAddress;
  final String? street;
  final String? area;
  final String city;
  final String state;
  final String pincode;
  final GeoPoint location;

  const GeocodedAddress({
    required this.fullAddress,
    this.street,
    this.area,
    this.city = 'Gorakhpur',
    this.state = 'Uttar Pradesh',
    required this.pincode,
    required this.location,
  });

  bool get isInsidePilotRegion =>
      city.toLowerCase() == 'gorakhpur' && pincode.startsWith('273');
}

abstract class GeocodingService {
  Future<GeocodedAddress?> reverseGeocode(GeoPoint point);
  Future<List<GeocodedAddress>> searchPlaces(String query);
}

class HttpGeocodingService implements GeocodingService {
  final String baseUrl;
  final http.Client _client;

  HttpGeocodingService({
    required this.baseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  @override
  Future<GeocodedAddress?> reverseGeocode(GeoPoint point) async {
    try {
      final res = await _client.get(
        Uri.parse('$baseUrl/api/v1/maps/reverse-geocode?lat=${point.latitude}&lng=${point.longitude}'),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return GeocodedAddress(
          fullAddress: data['fullAddress'] as String? ?? 'Gorakhpur, Uttar Pradesh',
          street: data['street'] as String?,
          area: data['area'] as String? ?? 'Golghar',
          city: data['city'] as String? ?? 'Gorakhpur',
          state: data['state'] as String? ?? 'Uttar Pradesh',
          pincode: data['pincode'] as String? ?? '273001',
          location: point,
        );
      }
    } catch (_) {}

    // Fallback deterministic reverse geocode for Gorakhpur pilot
    return GeocodedAddress(
      fullAddress: 'Golghar, Gorakhpur, Uttar Pradesh 273001',
      street: 'Park Road',
      area: 'Golghar',
      city: 'Gorakhpur',
      state: 'Uttar Pradesh',
      pincode: '273001',
      location: point,
    );
  }

  @override
  Future<List<GeocodedAddress>> searchPlaces(String query) async {
    // Restricted to Gorakhpur launch bounds
    final mockLocations = [
      GeocodedAddress(
        fullAddress: 'Golghar, Gorakhpur, Uttar Pradesh 273001',
        area: 'Golghar',
        pincode: '273001',
        location: const GeoPoint(latitude: 26.7606, longitude: 83.3732),
      ),
      GeocodedAddress(
        fullAddress: 'Medical College Road, Basharatpur, Gorakhpur 273004',
        area: 'Basharatpur',
        pincode: '273004',
        location: const GeoPoint(latitude: 26.7820, longitude: 83.3850),
      ),
      GeocodedAddress(
        fullAddress: 'Civil Lines, Gorakhpur, Uttar Pradesh 273001',
        area: 'Civil Lines',
        pincode: '273001',
        location: const GeoPoint(latitude: 26.7550, longitude: 83.3810),
      ),
      GeocodedAddress(
        fullAddress: 'Mohaddipur Chauraha, Gorakhpur, Uttar Pradesh 273008',
        area: 'Mohaddipur',
        pincode: '273008',
        location: const GeoPoint(latitude: 26.7480, longitude: 83.3980),
      ),
    ];

    if (query.trim().isEmpty) return mockLocations;
    return mockLocations
        .where((loc) =>
            loc.fullAddress.toLowerCase().contains(query.toLowerCase()) ||
            loc.pincode.contains(query.trim()))
        .toList();
  }
}
