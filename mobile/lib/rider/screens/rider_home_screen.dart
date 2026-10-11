import 'package:flutter/material.dart';
import '../services/rider_auth_service.dart';
import 'rider_login_screen.dart';

class RiderHomeScreen extends StatefulWidget {
  final RiderAuthService authService;

  const RiderHomeScreen({super.key, required this.authService});

  @override
  State<RiderHomeScreen> createState() => _RiderHomeScreenState();
}

class _RiderHomeScreenState extends State<RiderHomeScreen> {
  bool _isToggling = false;

  Future<void> _handleToggleOnline(bool targetState) async {
    setState(() => _isToggling = true);
    final res = await widget.authService.toggleAvailability(targetState);
    setState(() => _isToggling = false);

    if (res['success'] != true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['error'] ?? 'Could not toggle availability'),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final rider = widget.authService.currentProfile;
    final user = widget.authService.currentUser;
    final isOnline = rider?.isAvailable ?? false;
    final cashInHand = rider?.currentCashInHand ?? 0;
    const maxCashLimit = 5000;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Partner Dashboard'),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF64748B)),
            tooltip: 'Sign Out',
            onPressed: () async {
              await widget.authService.signOut();
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => RiderLoginScreen(authService: widget.authService)),
                );
              }
            },
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Online / Offline Toggle Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                decoration: BoxDecoration(
                  color: isOnline ? const Color(0xFFECFDF5) : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isOnline ? const Color(0xFF10B981) : const Color(0xFFCBD5E1),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFF059669) : const Color(0xFF94A3B8),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isOnline ? Icons.power_settings_new : Icons.power_settings_new_outlined,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                              color: isOnline ? const Color(0xFF065F46) : const Color(0xFF475569),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isOnline
                                ? 'Ready to receive pharmacy medicine dispatches'
                                : 'Switch on to start receiving delivery assignments',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    _isToggling
                        ? const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2))
                        : Switch.adaptive(
                            value: isOnline,
                            activeColor: const Color(0xFF059669),
                            onChanged: _handleToggleOnline,
                          ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Cash In Hand Metric Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Cash in Hand (COD)',
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: cashInHand >= maxCashLimit
                                ? const Color(0xFFFEE2E2)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Limit: ₹$maxCashLimit',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: cashInHand >= maxCashLimit
                                  ? const Color(0xFFDC2626)
                                  : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '₹$cashInHand',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0B192C),
                      ),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: (cashInHand / maxCashLimit).clamp(0.0, 1.0),
                      backgroundColor: const Color(0xFFF1F5F9),
                      color: cashInHand >= maxCashLimit
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF059669),
                    ),
                    if (cashInHand >= maxCashLimit) ...[
                      const SizedBox(height: 8),
                      const Text(
                        'Cash threshold reached. Please deposit collections before taking new orders.',
                        style: TextStyle(color: Color(0xFFDC2626), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Current Assignments Area
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.inbox_outlined, size: 48, color: Color(0xFF94A3B8)),
                    const SizedBox(height: 10),
                    const Text(
                      'No Active Deliveries',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'New pharmacy dispatches in Gorakhpur will appear here with pickup code and sealed package count.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Bound Device Security Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.phone_android, size: 18, color: Color(0xFF0F766E)),
                        SizedBox(width: 8),
                        Text(
                          'Authorized Device Binding',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Partner: ${user?.fullName ?? "Vikas Yadav"} (${user?.phone ?? ""})',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                    ),
                    Text(
                      'Vehicle: ${rider?.vehicleType ?? "Hero Splendor"} • ${rider?.vehicleRegistrationNumber ?? "UP53-AB-1234"}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                    ),
                    const Text(
                      'Session bound with platform audit fingerprinting & automatic token renewal.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
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
}
