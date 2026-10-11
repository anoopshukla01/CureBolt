import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final authClient = HttpAuthApiClient(
    baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000'),
  );
  final authController = AuthController(apiClient: authClient);

  runApp(MedcureRiderApp(authController: authController));
}

class MedcureRiderApp extends StatelessWidget {
  final AuthController authController;

  const MedcureRiderApp({
    super.key,
    required this.authController,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Medcure Delivery Partner',
      theme: ThemeBuilder.riderTheme,
      debugShowCheckedModeBanner: false,
      home: RoleGateGuard(
        controller: authController,
        appId: 'com.medcure.rider',
        appVersion: '1.0.0',
        appTitle: 'Medcure Delivery Partner',
        primaryColor: const Color(0xFFEA580C),
        child: RiderHomeScreen(controller: authController),
      ),
    );
  }
}

class RiderHomeScreen extends StatelessWidget {
  final AuthController controller;

  const RiderHomeScreen({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    final state = controller.state;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Medcure Delivery Partner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
            onPressed: () => controller.logout(),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.two_wheeler_rounded, size: 64, color: Color(0xFFEA580C)),
              const SizedBox(height: 16),
              const Text(
                'Rider Fleet App Shell (com.medcure.rider)',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              const SizedBox(height: 8),
              const Text(
                'Live Telemetry, Dispatch & Proof-of-Delivery',
                style: TextStyle(color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFED7AA)),
                ),
                child: Column(
                  children: [
                    Text(
                      'Signed in Rider: ${state.userId ?? "N/A"}',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF9A3412)),
                    ),
                    const SizedBox(height: 4),
                    Text('Fleet Role: ${state.role ?? "delivery_partner"}'),
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
