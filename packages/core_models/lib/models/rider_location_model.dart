class RiderLocationModel {
  final String riderId;
  final String orderId;
  final double latitude;
  final double longitude;
  final double speedMps;
  final double headingDegrees;
  final DateTime timestamp;

  const RiderLocationModel({
    required this.riderId,
    required this.orderId,
    required this.latitude,
    required this.longitude,
    this.speedMps = 5.0, // Default 18 km/h city speed in Gorakhpur
    this.headingDegrees = 0.0,
    required this.timestamp,
  });

  /// Location is considered stale if not refreshed within 60 seconds
  bool get isStale => DateTime.now().difference(timestamp).inSeconds > 60;

  factory RiderLocationModel.fromJson(Map<String, dynamic> json) {
    return RiderLocationModel(
      riderId: json['riderId'] as String? ?? '',
      orderId: json['orderId'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 26.7606,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 83.3732,
      speedMps: (json['speedMps'] as num?)?.toDouble() ?? 5.0,
      headingDegrees: (json['headingDegrees'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'riderId': riderId,
    'orderId': orderId,
    'latitude': latitude,
    'longitude': longitude,
    'speedMps': speedMps,
    'headingDegrees': headingDegrees,
    'timestamp': timestamp.toIso8601String(),
  };
}
