import '../models/geo_point.dart';

class EtaCalculationResult {
  final int? estimatedMinutes;
  final double distanceKm;
  final bool isDisplayPermitted;
  final String? rejectionReason;

  const EtaCalculationResult({
    this.estimatedMinutes,
    required this.distanceKm,
    required this.isDisplayPermitted,
    this.rejectionReason,
  });

  String get formattedLabel {
    if (!isDisplayPermitted || estimatedMinutes == null) return '';
    return '$estimatedMinutes MINS';
  }
}

class EtaCalculator {
  /// Evaluates whether an ETA badge may be legally and operationally shown to the user.
  /// Rule: Never show hardcoded promises. Must be backed by observed operational telemetry
  /// and explicit administrator feature enablement.
  static EtaCalculationResult evaluateEta({
    required GeoPoint origin,
    required GeoPoint destination,
    required bool adminEtaFeatureEnabled,
    required bool hasObservedTelemetry,
    double averageUrbanSpeedKmh = 18.0,
    int dispatchPreparationMinutes = 5,
  }) {
    final distanceKm = origin.distanceTo(destination);

    if (!adminEtaFeatureEnabled) {
      return EtaCalculationResult(
        distanceKm: distanceKm,
        isDisplayPermitted: false,
        rejectionReason: 'Administrator ETA feature flag is disabled.',
      );
    }

    if (!hasObservedTelemetry) {
      return EtaCalculationResult(
        distanceKm: distanceKm,
        isDisplayPermitted: false,
        rejectionReason: 'Insufficient real-time fleet telemetry to support ETA promise.',
      );
    }

    // Realistic calculation: preparation buffer + travel time with 1.3x urban road winding factor
    final roadDistanceKm = distanceKm * 1.3;
    final travelMinutes = (roadDistanceKm / averageUrbanSpeedKmh) * 60.0;
    final totalMinutes = (dispatchPreparationMinutes + travelMinutes).ceil();

    return EtaCalculationResult(
      estimatedMinutes: totalMinutes,
      distanceKm: distanceKm,
      isDisplayPermitted: true,
    );
  }
}
