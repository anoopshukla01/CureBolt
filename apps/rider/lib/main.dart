import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';
import 'config/app_environment.dart';
import 'screens/rider_auth_screen.dart';
import 'screens/rider_home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final env = RiderEnvironment.currentConfig();
  final authClient = HttpAuthApiClient(baseUrl: env.apiBaseUrl);
  final authController = AuthController(apiClient: authClient);

  runApp(MedcureRiderApp(authController: authController));
}

class MedcureRiderApp extends StatefulWidget {
  final AuthController authController;

  const MedcureRiderApp({
    super.key,
    required this.authController,
  });

  @override
  State<MedcureRiderApp> createState() => _MedcureRiderAppState();
}

class _MedcureRiderAppState extends State<MedcureRiderApp> {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CureBolt Delivery Partner',
      theme: ThemeBuilder.riderTheme,
      debugShowCheckedModeBanner: false,
      home: AnimatedBuilder(
        animation: widget.authController,
        builder: (context, _) {
          final state = widget.authController.state;

          if (state.isAuthenticated && (state.role == 'delivery_partner' || state.role == 'rider')) {
            return RiderHomeScreen(controller: widget.authController);
          }

          return RiderAuthScreen(
            authController: widget.authController,
            onAuthSuccess: () {
              setState(() {});
            },
          );
        },
      ),
    );
  }
}
