import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';
import 'config/app_environment.dart';
import 'services/customer_profile_service.dart';
import 'screens/splash_animation_screen.dart';
import 'screens/customer_auth_screen.dart';
import 'screens/profile_setup_screen.dart';
import 'screens/customer_home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final env = CustomerEnvironment.currentConfig();
  final authClient = HttpAuthApiClient(baseUrl: env.apiBaseUrl);
  final authController = AuthController(apiClient: authClient);
  final profileService = CustomerProfileService(baseUrl: env.apiBaseUrl);

  runApp(MedcureCustomerApp(
    authController: authController,
    profileService: profileService,
  ));
}

class MedcureCustomerApp extends StatefulWidget {
  final AuthController authController;
  final CustomerProfileService profileService;

  const MedcureCustomerApp({
    super.key,
    required this.authController,
    required this.profileService,
  });

  @override
  State<MedcureCustomerApp> createState() => _MedcureCustomerAppState();
}

class _MedcureCustomerAppState extends State<MedcureCustomerApp> {
  bool _splashCompleted = false;
  bool _needsProfileSetup = false;
  String? _setupToken;
  String? _setupUserId;
  String _setupPhone = '';
  CustomerProfile? _activeProfile;

  @override
  void initState() {
    super.initState();
    // Pre-check existing session
    widget.authController.initialize(
      appId: CustomerEnvironment.appId,
      appVersion: '1.0.0',
    );
  }

  void _onAnimationComplete() {
    setState(() => _splashCompleted = true);
  }

  void _onNeedsProfileSetup(String token, String? userId, String phone) {
    setState(() {
      _needsProfileSetup = true;
      _setupToken = token;
      _setupUserId = userId;
      _setupPhone = phone;
    });
  }

  void _onProfileSaved(CustomerProfile profile) {
    setState(() {
      _needsProfileSetup = false;
      _activeProfile = profile;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Medcure — Medicine Delivery (Gorakhpur)',
      theme: ThemeBuilder.customerTheme,
      debugShowCheckedModeBanner: false,
      home: AnimatedBuilder(
        animation: widget.authController,
        builder: (context, _) {
          final authState = widget.authController.state;

          // 1. Initial splash animation for logged-out users on cold start
          if (!_splashCompleted && !authState.isAuthenticated) {
            return SplashAnimationScreen(
              onAnimationComplete: _onAnimationComplete,
              loginRevealChild: CustomerAuthScreen(
                authController: widget.authController,
                profileService: widget.profileService,
                onNeedsProfileSetup: _onNeedsProfileSetup,
                onAuthComplete: (profile) {
                  setState(() {
                    _activeProfile = profile;
                    _needsProfileSetup = false;
                  });
                },
              ),
            );
          }

          // 2. Role rejection view if user signed into wrong app surface
          if (authState.isRoleRejected) {
            return PhoneOtpView(
              controller: widget.authController,
              appId: CustomerEnvironment.appId,
              appVersion: '1.0.0',
              appTitle: CustomerEnvironment.appName,
              primaryColor: const Color(0xFF0D9488),
            );
          }

          // 3. New User Profile Setup Step (Name, DOB & 18+ Age Gating)
          if (authState.isAuthenticated && _needsProfileSetup && _setupToken != null) {
            return ProfileSetupScreen(
              token: _setupToken!,
              userId: _setupUserId,
              phone: _setupPhone,
              profileService: widget.profileService,
              onProfileSaved: _onProfileSaved,
              onCancel: () {
                widget.authController.logout();
                setState(() => _needsProfileSetup = false);
              },
            );
          }

          // 4. Authenticated Home Screen (Ready for Location & Catalogue)
          if (authState.isAuthenticated) {
            return CustomerHomeScreen(
              controller: widget.authController,
              profile: _activeProfile,
              apiBaseUrl: CustomerEnvironment.currentConfig().apiBaseUrl,
            );
          }

          // 5. Auth Screen (Phone Entry + 6-digit OTP)
          return CustomerAuthScreen(
            authController: widget.authController,
            profileService: widget.profileService,
            onNeedsProfileSetup: _onNeedsProfileSetup,
            onAuthComplete: (profile) {
              setState(() {
                _activeProfile = profile;
                _needsProfileSetup = false;
              });
            },
          );
        },
      ),
    );
  }
}
