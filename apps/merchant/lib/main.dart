import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';
import 'config/app_environment.dart';
import 'services/pharmacy_auth_service.dart';
import 'screens/merchant_home_screen.dart';
import 'screens/login_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final authService = PharmacyAuthService();

  runApp(MedcureMerchantApp(authService: authService));
}

class MedcureMerchantApp extends StatelessWidget {
  final PharmacyAuthService authService;

  const MedcureMerchantApp({
    super.key,
    required this.authService,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CureBolt Pharmacy Counter',
      theme: ThemeBuilder.merchantTheme,
      debugShowCheckedModeBanner: false,
      home: authService.isAuthenticated
          ? MerchantHomeScreen(authService: authService)
          : LoginScreen(authService: authService),
    );
  }
}
