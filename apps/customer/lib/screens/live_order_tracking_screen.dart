import 'dart:async';
import 'package:flutter/material.dart';
import 'package:core_models/core_models.dart';
import 'location_picker_screen.dart';

class LiveOrderTrackingScreen extends StatefulWidget {
  final OrderModel order;
  final DeliveryLocation location;

  const LiveOrderTrackingScreen({
    super.key,
    required this.order,
    required this.location,
  });

  @override
  State<LiveOrderTrackingScreen> createState() => _LiveOrderTrackingScreenState();
}

class _LiveOrderTrackingScreenState extends State<LiveOrderTrackingScreen> {
  late int _stepIndex;
  late int _etaSeconds;
  Timer? _timer;

  final List<Map<String, String>> _statusSteps = [
    {
      'title': 'Order Placed & Sent to Counter',
      'subtitle': 'Transmitted to Apollo Pharmacy, Golghar',
    },
    {
      'title': 'Pharmacist Review & Batch Allocation',
      'subtitle': 'Verified by Registered Pharmacist (FEFO checked)',
    },
    {
      'title': 'Tamper-Evident Bag Sealed',
      'subtitle': 'Handover QR ready for CureBolt Rider',
    },
    {
      'title': 'Rider Ramesh Verma Picked Up',
      'subtitle': 'On green scooter • Cold chain temperature safe',
    },
    {
      'title': 'Delivered at Doorstep',
      'subtitle': 'Handover complete with OTP verification',
    },
  ];

  @override
  void initState() {
    super.initState();
    _stepIndex = 1; // Pharmacist reviewing
    _etaSeconds = 660; // 11 mins

    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted) return;
      setState(() {
        if (_etaSeconds > 60) _etaSeconds -= 15;
        if (_stepIndex < 3 && timer.tick > 2) {
          _stepIndex = 3; // Rider picked up & on the way
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _formattedEta {
    final mins = _etaSeconds ~/ 60;
    return '$mins mins';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order #${widget.order.orderNumber}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Gorakhpur Fast-Track Express', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.85))),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ETA Hero Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF10B981)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.delivery_dining_rounded, color: Color(0xFF10B981), size: 18),
                        const SizedBox(width: 6),
                        Text(
                          'ARRIVING IN $_formattedEta',
                          style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your medicines are on the way!',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Delivering to: ${widget.location.label}',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  ),
                ],
              ),
            ),

            // OTP Handover Card
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.pin_rounded, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Delivery Verification Code',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF92400E)),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Share only when package is physically handed over:',
                          style: TextStyle(fontSize: 11, color: Color(0xFFB45309)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFF59E0B)),
                    ),
                    child: Text(
                      widget.order.deliveryOtp ?? '4829',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 4, color: Color(0xFFB45309)),
                    ),
                  ),
                ],
              ),
            ),

            // Rider Contact & Vehicle Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: const Color(0xFF10B981).withOpacity(0.15),
                      child: const Icon(Icons.two_wheeler_rounded, color: Color(0xFF10B981), size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Ramesh Verma', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          SizedBox(height: 2),
                          Text('CureBolt Green Partner • UP-53-BK-8821', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          SizedBox(height: 2),
                          Text('⭐ 4.95 (1,240 Deliveries in Gorakhpur)', style: TextStyle(fontSize: 11, color: Color(0xFF0D9488), fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.phone_rounded, color: Color(0xFF0D9488)),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Calling rider Ramesh Verma via masked relay...')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Stepper timeline
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Live Fulfillment Journey', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 14),
                    ...List.generate(_statusSteps.length, (index) {
                      final isDone = index <= _stepIndex;
                      final isCurrent = index == _stepIndex;

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  color: isDone ? const Color(0xFF0D9488) : const Color(0xFFCBD5E1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  isDone ? Icons.check : Icons.circle,
                                  size: 12,
                                  color: Colors.white,
                                ),
                              ),
                              if (index < _statusSteps.length - 1)
                                Container(
                                  width: 2,
                                  height: 36,
                                  color: isDone ? const Color(0xFF0D9488) : const Color(0xFFE2E8F0),
                                ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _statusSteps[index]['title']!,
                                    style: TextStyle(
                                      fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                                      fontSize: 13,
                                      color: isDone ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _statusSteps[index]['subtitle']!,
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Back to Store button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFF0D9488)),
                    foregroundColor: const Color(0xFF0D9488),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Return to Home Store'),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
