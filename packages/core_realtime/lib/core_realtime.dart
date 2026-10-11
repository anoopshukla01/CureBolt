library core_realtime;

import 'dart:async';
import 'package:flutter/foundation.dart';

enum RealtimeConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
}

class MedcureRealtimeClient extends ChangeNotifier {
  RealtimeConnectionState _state = RealtimeConnectionState.disconnected;
  final Map<String, StreamController<Map<String, dynamic>>> _channelControllers = {};

  RealtimeConnectionState get state => _state;

  void connect({required String endpoint, required String authToken}) {
    _state = RealtimeConnectionState.connected;
    notifyListeners();
  }

  void disconnect() {
    _state = RealtimeConnectionState.disconnected;
    notifyListeners();
  }

  Stream<Map<String, dynamic>> subscribe(String channel) {
    if (!_channelControllers.containsKey(channel) || _channelControllers[channel]!.isClosed) {
      _channelControllers[channel] = StreamController<Map<String, dynamic>>.broadcast();
    }
    return _channelControllers[channel]!.stream;
  }

  // App-specific convenience streams
  Stream<Map<String, dynamic>> subscribeToCustomerOrder(String orderId) {
    return subscribe('customer_order:$orderId');
  }

  Stream<Map<String, dynamic>> subscribeToRiderDispatch(String riderId) {
    return subscribe('rider_dispatch:$riderId');
  }

  Stream<Map<String, dynamic>> subscribeToPharmacyOrders(String pharmacyId) {
    return subscribe('pharmacy_orders:$pharmacyId');
  }

  void emitMockEvent({required String channel, required Map<String, dynamic> event}) {
    if (!_channelControllers.containsKey(channel)) {
      _channelControllers[channel] = StreamController<Map<String, dynamic>>.broadcast();
    }
    _channelControllers[channel]!.add(event);
  }

  @override
  void dispose() {
    for (final controller in _channelControllers.values) {
      controller.close();
    }
    _channelControllers.clear();
    super.dispose();
  }
}

// Backwards compatibility alias for merchant app
class PharmacyRealtimeClient extends MedcureRealtimeClient {
  Stream<Map<String, dynamic>> get orderEvents => subscribe('pharmacy_orders:default');

  void emitMockOrderEvent(Map<String, dynamic> event) {
    emitMockEvent(channel: 'pharmacy_orders:default', event: event);
  }
}
