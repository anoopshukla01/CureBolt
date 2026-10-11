library core_notifications;

import 'package:flutter/foundation.dart';

class MedcureNotificationChannel {
  final String id;
  final String name;
  final String description;
  final bool isHighImportance;

  const MedcureNotificationChannel({
    required this.id,
    required this.name,
    required this.description,
    this.isHighImportance = false,
  });
}

class MedcureNotificationService extends ChangeNotifier {
  static const customerChannel = MedcureNotificationChannel(
    id: 'com.medcure.customer.updates',
    name: 'Customer Order Updates',
    description: 'Notifications for delivery ETA and medicine status changes',
  );

  static const riderChannel = MedcureNotificationChannel(
    id: 'com.medcure.rider.alerts',
    name: 'Delivery Partner Order Alerts',
    description: 'High-priority sound and vibration alerts for nearby delivery orders',
    isHighImportance: true,
  );

  static const pharmacyChannel = MedcureNotificationChannel(
    id: 'com.medcure.shop.orders',
    name: 'Pharmacy Order Dispatch Alerts',
    description: 'High-priority looping alarm for newly placed prescription orders',
    isHighImportance: true,
  );

  bool _isAlarmPlaying = false;
  String? _activeAlarmOrderId;

  bool get isAlarmPlaying => _isAlarmPlaying;
  String? get activeAlarmOrderId => _activeAlarmOrderId;

  Future<void> initialize({required String appId}) async {
    debugPrint('Initializing MedcureNotificationService for app: $appId');
  }

  void showNotification({
    required String title,
    required String body,
    String? payload,
    MedcureNotificationChannel? channel,
  }) {
    debugPrint('NOTIFICATION: [$title] $body (Payload: $payload, Channel: ${channel?.id})');
  }

  void startLoopingOrderAlarm({required String orderId}) {
    _isAlarmPlaying = true;
    _activeAlarmOrderId = orderId;
    debugPrint('CRITICAL LOOPING IN-APP ALARM STARTED for Order #$orderId');
    notifyListeners();
  }

  void stopAlarm() {
    if (_isAlarmPlaying) {
      _isAlarmPlaying = false;
      _activeAlarmOrderId = null;
      debugPrint('LOOPING IN-APP ALARM STOPPED');
      notifyListeners();
    }
  }
}

// Backwards compatibility alias for merchant app
class PharmacyNotificationService extends MedcureNotificationService {
  static const String channelId = 'in.medcure.merchant.orders';
  static const String channelName = 'Pharmacy Order Dispatch Alerts';
  static const String channelDescription =
      'High priority sound notifications for new quick-commerce medicine delivery orders';
}
