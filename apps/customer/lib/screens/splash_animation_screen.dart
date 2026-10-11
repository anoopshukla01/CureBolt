import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';

/// Splash screen displaying the CureBolt mascot launch animation:
/// The rider enters from the right, slows down & stops at center, vibrates at idle,
/// displays the brand tagline, accelerates and exits to the left while revealing the login surface.
class SplashAnimationScreen extends StatelessWidget {
  final VoidCallback onAnimationComplete;
  final Widget? loginRevealChild;

  const SplashAnimationScreen({
    super.key,
    required this.onAnimationComplete,
    this.loginRevealChild,
  });

  @override
  Widget build(BuildContext context) {
    return BrandLaunchAnimation(
      brandName: 'CureBolt',
      skippable: true,
      onCompleted: onAnimationComplete,
      loginRevealChild: loginRevealChild,
    );
  }
}
