import 'package:flutter/material.dart';
import 'rider/screens/rider_application_status_screen.dart';
import 'rider/screens/rider_home_screen.dart';
import 'rider/screens/rider_login_screen.dart';
import 'rider/services/rider_auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authService = RiderAuthService();
  await authService.initialize();

  runApp(MedcureRiderApp(authService: authService));
}

class MedcureRiderApp extends StatelessWidget {
  final RiderAuthService authService;

  const MedcureRiderApp({super.key, required this.authService});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Medcure Partner | Delivery Fleet',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669), // Emerald safety green
          primary: const Color(0xFF059669),
          secondary: const Color(0xFF0B192C),
          surface: Colors.white,
          background: const Color(0xFFF8FAFC),
        ),
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0B192C),
          elevation: 0.5,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: Color(0xFF0B192C),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      home: _getInitialScreen(),
    );
  }

  Widget _getInitialScreen() {
    if (!authService.isAuthenticated) {
      return RiderLoginScreen(authService: authService);
    }

    final profile = authService.currentProfile;
    if (profile != null && profile.isApproved) {
      return RiderHomeScreen(authService: authService);
    }

    return RiderApplicationStatusScreen(authService: authService);
  }
}
