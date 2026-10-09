import 'package:flutter/material.dart';

class OrderTrackingScreen extends StatelessWidget {
  final String orderCode;
  final String state;
  final String deliveryOtp;
  final double payableAmount;

  const OrderTrackingScreen({
    super.key,
    required this.orderCode,
    required this.state,
    required this.deliveryOtp,
    required this.payableAmount,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Track Order: $orderCode'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handshake OTP Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0B192C), Color(0xFF1E3E62)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const Text(
                      'DELIVERY HANDSHAKE OTP',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      deliveryOtp,
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 4,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Share this OTP with rider only after receiving sealed package',
                      style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              const Text(
                'Live Fulfilment Progress',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0B192C)),
              ),
              const SizedBox(height: 16),

              // State Milestones
              Expanded(
                child: ListView(
                  children: [
                    _buildStep(
                      title: 'Prescription Verified',
                      subtitle: 'Approved by Registered Pharmacist (UP-PCR-78421)',
                      isDone: true,
                    ),
                    _buildStep(
                      title: 'Stock Reserved & Payment Settled',
                      subtitle: 'Transaction verified with Razorpay (₹${payableAmount.toStringAsFixed(2)})',
                      isDone: true,
                    ),
                    _buildStep(
                      title: 'Tamper-Evident Bag Sealed',
                      subtitle: 'Physical batch number & expiry matched at Golghar Pharmacy',
                      isDone: true,
                    ),
                    _buildStep(
                      title: 'Rider Out for Delivery',
                      subtitle: 'Assigned rider on way to Golghar / Park Road address',
                      isDone: state == 'OUT_FOR_DELIVERY' || state == 'DELIVERED',
                      isCurrent: state == 'OUT_FOR_DELIVERY',
                    ),
                    _buildStep(
                      title: 'Order Delivered',
                      subtitle: 'Package handed over with OTP verification',
                      isDone: state == 'DELIVERED',
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep({
    required String title,
    required String subtitle,
    required bool isDone,
    bool isCurrent = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDone ? const Color(0xFF10B981) : isCurrent ? const Color(0xFF028391) : const Color(0xFFE2E8F0),
            ),
            child: Icon(
              isDone ? Icons.check : Icons.circle,
              size: 16,
              color: isDone || isCurrent ? Colors.white : const Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isCurrent ? const Color(0xFF028391) : const Color(0xFF0B192C),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
