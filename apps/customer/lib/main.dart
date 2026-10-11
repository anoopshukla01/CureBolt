import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';
import 'config/app_environment.dart';
import 'services/customer_profile_service.dart';
import 'screens/splash_animation_screen.dart';
import 'screens/customer_auth_screen.dart';
import 'screens/profile_setup_screen.dart';

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

class CustomerHomeScreen extends StatelessWidget {
  final AuthController controller;
  final CustomerProfile? profile;

  const CustomerHomeScreen({
    super.key,
    required this.controller,
    this.profile,
  });

  @override
  Widget build(BuildContext context) {
    final state = controller.state;
    final displayName = profile?.fullName.isNotEmpty == true
        ? profile!.fullName
        : 'Medcure Customer';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Medcure Quick Delivery',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              'Gorakhpur, Uttar Pradesh',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.85)),
            ),
          ],
        ),
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
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDFA),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF99F6E4), width: 2),
                ),
                child: const Icon(Icons.check_circle_rounded, size: 56, color: Color(0xFF0D9488)),
              ),
              const SizedBox(height: 20),
              Text(
                'Welcome, $displayName!',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Profile Verified (18+ Statutory Compliance Approved)',
                style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    Text('Phone: ${state.phone ?? profile?.phone ?? "Verified"}'),
                    const SizedBox(height: 4),
                    Text('Role: ${state.role ?? "customer"}'),
                    if (profile?.dateOfBirth != null) ...[
                      const SizedBox(height: 4),
                      Text('DOB: ${profile!.dateOfBirth!} (Protected Data)'),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),
              OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Delivery Location Picker loading in Milestone 2...')),
                  );
                },
                icon: const Icon(Icons.location_on_rounded, color: Color(0xFF0D9488)),
                label: const Text('Set Delivery Location (Milestone 2)'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF0D9488),
                  side: const BorderSide(color: Color(0xFF0D9488)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
