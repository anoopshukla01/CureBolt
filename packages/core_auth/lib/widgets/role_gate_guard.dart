import 'package:flutter/material.dart';
import '../models/auth_state.dart';
import '../services/auth_controller.dart';
import 'phone_otp_view.dart';

class RoleGateGuard extends StatefulWidget {
  final AuthController controller;
  final String appId;
  final String appVersion;
  final String appTitle;
  final Color primaryColor;
  final Widget child;

  const RoleGateGuard({
    super.key,
    required this.controller,
    required this.appId,
    required this.appVersion,
    required this.appTitle,
    required this.child,
    this.primaryColor = const Color(0xFF0D9488),
  });

  @override
  State<RoleGateGuard> createState() => _RoleGateGuardState();
}

class _RoleGateGuardState extends State<RoleGateGuard> {
  @override
  void initState() {
    super.initState();
    // Initialize session checking on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.controller.initialize(
        appId: widget.appId,
        appVersion: widget.appVersion,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final state = widget.controller.state;

        if (state.status == AuthStatus.verifyingSession) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(widget.primaryColor),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Verifying app session & permissions...',
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                  ),
                ],
              ),
            ),
          );
        }

        if (state.isAuthenticated) {
          return widget.child;
        }

        return PhoneOtpView(
          controller: widget.controller,
          appId: widget.appId,
          appVersion: widget.appVersion,
          appTitle: widget.appTitle,
          primaryColor: widget.primaryColor,
        );
      },
    );
  }
}
