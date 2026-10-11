import 'dart:math';

class GeoPoint {
  final double latitude;
  final double longitude;
  final double? accuracyMeters;

  const GeoPoint({
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
  });

  bool get isAccurate => (accuracyMeters ?? 10.0) <= 100.0;

  double distanceTo(GeoPoint other) {
    const earthRadiusKm = 6371.0;
    final dLat = _deg2rad(other.latitude - latitude);
    final dLon = _deg2rad(other.longitude - longitude);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_deg2rad(latitude)) *
            cos(_deg2rad(other.latitude)) *
            sin(dLon / 2) *
            sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadiusKm * c;
  }

  static double _deg2rad(double deg) => deg * (pi / 180.0);

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    'accuracyMeters': accuracyMeters,
  };

  factory GeoPoint.fromJson(Map<String, dynamic> json) => GeoPoint(
    latitude: (json['latitude'] as num).toDouble(),
    longitude: (json['longitude'] as num).toDouble(),
    accuracyMeters: (json['accuracyMeters'] as num?)?.toDouble(),
  );

  @override
  String toString() => 'GeoPoint($latitude, $longitude, ±${accuracyMeters ?? "N/A"}m)';
}
