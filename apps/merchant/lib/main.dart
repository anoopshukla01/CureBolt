import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final authClient = HttpAuthApiClient(
    baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000'),
  );
  final authController = AuthController(apiClient: authClient);

  runApp(MedcureMerchantApp(authController: authController));
}

class MedcureMerchantApp extends StatelessWidget {
  final AuthController authController;

  const MedcureMerchantApp({
    super.key,
    required this.authController,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Medcure Pharmacy Counter',
      theme: ThemeBuilder.merchantTheme,
      debugShowCheckedModeBanner: false,
      home: RoleGateGuard(
        controller: authController,
        appId: 'com.medcure.shop',
        appVersion: '1.0.0',
        appTitle: 'Medcure Pharmacy Counter',
        primaryColor: const Color(0xFF0284C7),
        child: MerchantHomeScreen(controller: authController),
      ),
    );
  }
}

class MerchantHomeScreen extends StatelessWidget {
  final AuthController controller;

  const MerchantHomeScreen({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    final state = controller.state;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Medcure Pharmacy Counter'),
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
              const Icon(Icons.storefront_rounded, size: 64, color: Color(0xFF0284C7)),
              const SizedBox(height: 16),
              const Text(
                'Shopkeeper Counter App Shell (com.medcure.shop)',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              const SizedBox(height: 8),
              const Text(
                'Prescription Review, Batch FEFO Allocation & Packaging',
                style: TextStyle(color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Column(
                  children: [
                    Text(
                      'Signed in Staff: ${state.userId ?? "N/A"}',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0369A1)),
                    ),
                    const SizedBox(height: 4),
                    Text('Pharmacy Role: ${state.role ?? "pharmacy_staff"}'),
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
