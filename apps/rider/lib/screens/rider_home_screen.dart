import 'dart:async';
import 'package:flutter/material.dart';
import 'package:core_auth/core_auth.dart';
import 'package:core_models/core_models.dart';
import 'rider_pickup_screen.dart';

class RiderHomeScreen extends StatefulWidget {
  final AuthController controller;

  const RiderHomeScreen({
    super.key,
    required this.controller,
  });

  @override
  State<RiderHomeScreen> createState() => _RiderHomeScreenState();
}

class _RiderHomeScreenState extends State<RiderHomeScreen> {
  bool _isOnline = true;
  bool _hasIncomingOrder = true;
  int _countdown = 28;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        if (_countdown > 0) {
          _countdown--;
        } else {
          _hasIncomingOrder = false;
          timer.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _acceptOrder() {
    _countdownTimer?.cancel();

    final order = OrderModel(
      id: 'ord-r1-demo',
      orderNumber: 'MED-99214',
      state: OrderState.packing,
      paymentMode: PaymentMode.online,
      items: const [
        OrderItemModel(productId: 'prod-h-1', productName: 'Dolo 650 Tablets', quantity: 1, unitPrice: 30),
        OrderItemModel(productId: 'prod-h-2', productName: 'Azee 500 Tablets (Rx)', quantity: 1, unitPrice: 119),
      ],
      subtotal: 149.0,
      deliveryFee: 15.0,
      taxes: 0.0,
      total: 169.0,
      pharmacyId: 'pharma-gkp-1',
      pharmacyName: 'Apollo Pharmacy — Golghar Hub',
      deliveryAddress: 'H.No 412, Rapti Nagar Phase 4, Gorakhpur (PIN: 273004)',
      deliveryOtp: '4829',
      handoverOtp: '9182',
      createdAt: DateTime.now(),
    );

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => RiderPickupScreen(order: order),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFEA580C),
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('CureBolt Rider Partner', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              _isOnline ? '🟢 Online in Gorakhpur Central Zone' : '⚪ Offline (Duty Paused)',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.9)),
            ),
          ],
        ),
        actions: [
          Switch(
            value: _isOnline,
            activeColor: Colors.white,
            activeTrackColor: const Color(0xFFC2410C),
            onChanged: (val) {
              setState(() {
                _isOnline = val;
                if (!_isOnline) _hasIncomingOrder = false;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
            onPressed: () => widget.controller.logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Daily Performance & Earnings Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Today’s Earnings', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                          SizedBox(height: 4),
                          Text('₹840.00', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 26)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEA580C),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text('14 TRIPS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFF334155)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _metricCol('Login Hours', '5.4 hrs'),
                      _metricCol('On-Time SLA', '98.5%'),
                      _metricCol('Partner Rating', '⭐ 4.95'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Incoming Dispatch Alert (Simulated active order)
            if (_isOnline && _hasIncomingOrder) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFEA580C), width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEA580C).withOpacity(0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEA580C),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'NEW DISPATCH ALERT',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.timer_outlined, color: Color(0xFFEA580C), size: 16),
                            const SizedBox(width: 4),
                            Text(
                              '${_countdown}s left',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEA580C), fontSize: 13),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    const Text(
                      'Medicine Fast-Track Delivery',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 8),

                    // Pickup & Drop
                    _tripRow(Icons.storefront_rounded, 'Pickup: Apollo Pharmacy, Golghar (0.8 km)', const Color(0xFF0D9488)),
                    const SizedBox(height: 6),
                    _tripRow(Icons.location_on_rounded, 'Drop: Rapti Nagar Phase 4 (2.4 km)', const Color(0xFFEA580C)),
                    const SizedBox(height: 12),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Earning for this trip:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          Text('₹60.00 (Base + Speed Incentive)', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF16A34A), fontSize: 14)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setState(() => _hasIncomingOrder = false),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF64748B),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Decline'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: _acceptOrder,
                            icon: const Icon(Icons.check_circle_rounded),
                            label: const Text('Accept Delivery'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFEA580C),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ] else if (_isOnline) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.radar_rounded, size: 48, color: Color(0xFF0D9488)),
                    const SizedBox(height: 12),
                    const Text('Scanning for New Orders in Gorakhpur...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 4),
                    const Text('Stay near Golghar, Medical College or Taramandal hubs for instant dispatches.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B)), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _hasIncomingOrder = true;
                          _countdown = 30;
                          _startCountdown();
                        });
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEA580C), foregroundColor: Colors.white),
                      child: const Text('Simulate Incoming Dispatch'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Gorakhpur Demand Zones
            const Text('High-Demand Zones in Gorakhpur', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 10),
            _zoneTile('Golghar Market Hub', '🔥 Very High Demand (Avg 9 min fulfillment)', '₹20 extra incentive'),
            _zoneTile('BRD Medical Road', '🔥 High Demand (Hospital emergency runs)', '₹15 extra incentive'),
            _zoneTile('Taramandal Lake Area', '⚡ Moderate Demand', 'Standard fares'),
          ],
        ),
      ),
    );
  }

  static Widget _metricCol(String title, String val) {
    return Column(
      children: [
        Text(val, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 2),
        Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
      ],
    );
  }

  static Widget _tripRow(IconData icon, String text, Color iconColor) {
    return Row(
      children: [
        Icon(icon, size: 16, color: iconColor),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF334155)))),
      ],
    );
  }

  Widget _zoneTile(String title, String subtitle, String tag) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(6)),
            child: Text(tag, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFEA580C))),
          ),
        ],
      ),
    );
  }
}
