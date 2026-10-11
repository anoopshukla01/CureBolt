import 'dart:math';
import 'package:flutter/material.dart';

class LaunchAnimationConfig {
  final Duration totalDuration;
  final double arriveStartFraction;
  final double arriveEndFraction;
  final double brakeEndFraction;
  final double pauseEndFraction;
  final double leaveEndFraction;
  final double revealStartFraction;

  final double scooterDisplayWidthRatio; // ~62% on phone
  final double maxDisplayWidth; // capped at 420 dp
  final double groundLineHeightRatio; // ~62% of screen height
  final double frontWheelRadiusDp;
  final double rearWheelRadiusDp;

  const LaunchAnimationConfig({
    this.totalDuration = const Duration(milliseconds: 3300),
    this.arriveStartFraction = 0.075, // 0.25s / 3.3s
    this.arriveEndFraction = 0.44,   // 1.45s / 3.3s
    this.brakeEndFraction = 0.53,    // 1.75s / 3.3s
    this.pauseEndFraction = 0.71,    // 2.35s / 3.3s
    this.leaveEndFraction = 0.95,    // 3.15s / 3.3s
    this.revealStartFraction = 0.78, // 2.60s / 3.3s
    this.scooterDisplayWidthRatio = 0.62,
    this.maxDisplayWidth = 420.0,
    this.groundLineHeightRatio = 0.62,
    this.frontWheelRadiusDp = 49.0, // 120px / 1024px * 420dp ~ 49dp
    this.rearWheelRadiusDp = 45.0,  // 110px / 1024px * 420dp ~ 45dp
  });

  static const workAppConfig = LaunchAnimationConfig(
    totalDuration: Duration(milliseconds: 1200),
    arriveStartFraction: 0.05,
    arriveEndFraction: 0.40,
    brakeEndFraction: 0.55,
    pauseEndFraction: 0.75,
    leaveEndFraction: 1.0,
    revealStartFraction: 0.70,
  );
}

class BrandLaunchAnimation extends StatefulWidget {
  final VoidCallback? onLeaveStarted;
  final VoidCallback onCompleted;
  final bool skippable;
  final bool reducedMotion;
  final LaunchAnimationConfig config;
  final Widget? loginRevealChild;
  final String brandName;

  const BrandLaunchAnimation({
    super.key,
    this.onLeaveStarted,
    required this.onCompleted,
    this.skippable = true,
    this.reducedMotion = false,
    this.config = const LaunchAnimationConfig(),
    this.loginRevealChild,
    this.brandName = 'CureBolt',
  });

  @override
  State<BrandLaunchAnimation> createState() => _BrandLaunchAnimationState();
}

class _BrandLaunchAnimationState extends State<BrandLaunchAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _leaveTriggered = false;
  bool _skipButtonVisible = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.config.totalDuration,
    );

    _controller.addListener(_onTick);
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onCompleted();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final osReducedMotion = MediaQuery.of(context).disableAnimations;
      if (widget.reducedMotion || osReducedMotion) {
        // Fast static reveal
        widget.onLeaveStarted?.call();
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) widget.onCompleted();
        });
      } else {
        _controller.forward();
        // Show skip button after 500ms
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) setState(() => _skipButtonVisible = true);
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.removeListener(_onTick);
    _controller.dispose();
    super.dispose();
  }

  void _onTick() {
    final t = _controller.value;
    if (!_leaveTriggered && t >= widget.config.revealStartFraction) {
      _leaveTriggered = true;
      widget.onLeaveStarted?.call();
    }
  }

  void _skipAnimation() {
    if (_controller.isAnimating) {
      _controller.stop();
      if (!_leaveTriggered) {
        widget.onLeaveStarted?.call();
      }
      widget.onCompleted();
    }
  }

  /// Calculates horizontal position `x(t)` where:
  /// 0.0 = center of screen,
  /// +1.4 = off-screen right (start),
  /// -1.5 = off-screen left (exit).
  double _calculatePosition(double t) {
    final cfg = widget.config;

    // 1. Initial wait
    if (t < cfg.arriveStartFraction) {
      return 1.4;
    }

    // 2. Arrive: from right (+1.4) to center (0.0) with smooth deceleration
    if (t < cfg.arriveEndFraction) {
      final p = (t - cfg.arriveStartFraction) /
          (cfg.arriveEndFraction - cfg.arriveStartFraction);
      final eased = Curves.easeOutCubic.transform(p);
      return 1.4 * (1.0 - eased);
    }

    // 3. Brake & Pause: held at center (0.0)
    if (t < cfg.pauseEndFraction) {
      return 0.0;
    }

    // 4. Leave: from center (0.0) accelerating to off-screen left (-1.5)
    final p = (t - cfg.pauseEndFraction) /
        (cfg.leaveEndFraction - cfg.pauseEndFraction);
    final clamped = p.clamp(0.0, 1.0);
    final eased = Curves.easeInCubic.transform(clamped);
    return -1.5 * eased;
  }

  /// Cumulative distance travelled in display units for rolling wheel angle
  double _calculateDistanceTravelled(double t) {
    final cfg = widget.config;
    // Normalized distance: 1.4 in arrival + 1.5 in departure
    if (t < cfg.arriveStartFraction) return 0.0;
    if (t < cfg.arriveEndFraction) {
      final p = (t - cfg.arriveStartFraction) /
          (cfg.arriveEndFraction - cfg.arriveStartFraction);
      final eased = Curves.easeOutCubic.transform(p);
      return 1.4 * eased;
    }
    if (t < cfg.pauseEndFraction) {
      return 1.4;
    }
    final p = (t - cfg.pauseEndFraction) /
        (cfg.leaveEndFraction - cfg.pauseEndFraction);
    final eased = Curves.easeInCubic.transform(p.clamp(0.0, 1.0));
    return 1.4 + (1.5 * eased);
  }

  /// Pitch angle (radians): nose dip on braking, lean back on launch
  double _calculatePitch(double t) {
    final cfg = widget.config;

    // Brake dip (between arriveEnd and brakeEnd): nose dips forward ~2 deg = ~0.035 rad
    if (t >= cfg.arriveEndFraction && t < cfg.brakeEndFraction) {
      final p = (t - cfg.arriveEndFraction) /
          (cfg.brakeEndFraction - cfg.arriveEndFraction);
      // Damped harmonic oscillation dip and return
      final dip = sin(p * pi) * 0.04;
      return dip; // positive pitch = front down
    }

    // Launch lean-back (between pauseEnd and leaveEnd): rear squats ~3 deg = -0.05 rad
    if (t >= cfg.pauseEndFraction && t < cfg.leaveEndFraction) {
      final p = (t - cfg.pauseEndFraction) /
          (cfg.leaveEndFraction - cfg.pauseEndFraction);
      if (p < 0.3) {
        return -0.05 * sin((p / 0.3) * pi);
      }
    }

    return 0.0;
  }

  /// Idle vibration (dp) during pause
  double _calculateIdleBob(double t) {
    final cfg = widget.config;
    if (t >= cfg.brakeEndFraction && t < cfg.pauseEndFraction) {
      // 14 Hz vibration
      final elapsedSec = t * (widget.config.totalDuration.inMilliseconds / 1000.0);
      return sin(elapsedSec * 14.0 * 2 * pi) * 1.0;
    }
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final displayWidth = min(
      screenSize.width * widget.config.scooterDisplayWidthRatio,
      widget.config.maxDisplayWidth,
    );
    final displayHeight = displayWidth * (975.0 / 1024.0);
    final groundY = screenSize.height * widget.config.groundLineHeightRatio;

    return Semantics(
      label: 'Welcome to ${widget.brandName}',
      container: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.skippable ? _skipAnimation : null,
        child: Scaffold(
          backgroundColor: const Color(0xFF0F172A),
          body: Stack(
            children: [
              // 1. Underlying Login Screen Reveal Layer
              if (widget.loginRevealChild != null)
                Positioned.fill(
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, _) {
                      final t = _controller.value;
                      final revealProgress = (t - widget.config.revealStartFraction) /
                          (1.0 - widget.config.revealStartFraction);
                      final opacity = revealProgress.clamp(0.0, 1.0);
                      return Opacity(
                        opacity: opacity,
                        child: widget.loginRevealChild!,
                      );
                    },
                  ),
                ),

              // 2. Animated Scooter Stage
              AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  final t = _controller.value;
                  final xNorm = _calculatePosition(t);
                  final distanceNorm = _calculateDistanceTravelled(t);
                  final pitchRad = _calculatePitch(t);
                  final idleBob = _calculateIdleBob(t);

                  // Pixel displacement from center
                  final xPixels = xNorm * (screenSize.width * 0.5 + displayWidth * 0.6);

                  // Continuous wheel rotation angle: negative for counter-clockwise leftward motion
                  // Angle = -distance / radius
                  final wheelRotation = -distanceNorm * 22.0;

                  // Tagline opacity during pause
                  double taglineOpacity = 0.0;
                  if (t >= widget.config.brakeEndFraction && t <= widget.config.leaveEndFraction) {
                    final p = (t - widget.config.brakeEndFraction) /
                        (widget.config.pauseEndFraction - widget.config.brakeEndFraction);
                    taglineOpacity = p.clamp(0.0, 1.0);
                    if (t > widget.config.pauseEndFraction) {
                      taglineOpacity = 1.0 -
                          ((t - widget.config.pauseEndFraction) / 0.1).clamp(0.0, 1.0);
                    }
                  }

                  return RepaintBoundary(
                    child: Stack(
                      children: [
                        // Ground line & road dashes painter
                        Positioned.fill(
                          child: CustomPaint(
                            painter: _GroundAndRoadPainter(
                              groundY: groundY,
                              scrollOffset: -distanceNorm * 400.0,
                              speedIntensity: (t < widget.config.arriveEndFraction ||
                                      t > widget.config.pauseEndFraction)
                                  ? 1.0
                                  : 0.0,
                            ),
                          ),
                        ),

                        // Scooter Body + Rotating Wheels
                        Positioned(
                          left: (screenSize.width - displayWidth) / 2 + xPixels,
                          top: groundY - displayHeight + 20 + idleBob,
                          width: displayWidth,
                          height: displayHeight,
                          child: Transform(
                            alignment: const Alignment(-0.5, 0.75), // pivot near front wheel contact
                            transform: Matrix4.identity()..rotateZ(pitchRad),
                            child: Stack(
                              alignment: Alignment.topLeft,
                              children: [
                                // Full Artwork Body
                                Image.asset(
                                  'packages/core_ui/assets/launch/curebolt_full.png',
                                  width: displayWidth,
                                  height: displayHeight,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) =>
                                      _buildFallbackArt(displayWidth, displayHeight),
                                ),

                                // Front Wheel Rotating Overlay
                                Positioned(
                                  left: (242.0 / 1024.0) * displayWidth -
                                      (120.0 / 1024.0) * displayWidth,
                                  top: (845.0 / 975.0) * displayHeight -
                                      (120.0 / 1024.0) * displayWidth,
                                  width: (240.0 / 1024.0) * displayWidth,
                                  height: (240.0 / 1024.0) * displayWidth,
                                  child: Transform.rotate(
                                    angle: wheelRotation,
                                    child: Image.asset(
                                      'packages/core_ui/assets/launch/wheel_front.png',
                                      fit: BoxFit.contain,
                                      errorBuilder: (_, __, ___) =>
                                          _buildRotatingSpokeWheel(
                                            (240.0 / 1024.0) * displayWidth,
                                          ),
                                    ),
                                  ),
                                ),

                                // Rear Wheel Rotating Overlay
                                Positioned(
                                  left: (730.0 / 1024.0) * displayWidth -
                                      (110.0 / 1024.0) * displayWidth,
                                  top: (835.0 / 975.0) * displayHeight -
                                      (110.0 / 1024.0) * displayWidth,
                                  width: (220.0 / 1024.0) * displayWidth,
                                  height: (220.0 / 1024.0) * displayWidth,
                                  child: Transform.rotate(
                                    angle: wheelRotation * 1.09, // slightly smaller radius rotates faster
                                    child: Image.asset(
                                      'packages/core_ui/assets/launch/wheel_rear.png',
                                      fit: BoxFit.contain,
                                      errorBuilder: (_, __, ___) =>
                                          _buildRotatingSpokeWheel(
                                            (220.0 / 1024.0) * displayWidth,
                                          ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Tagline beneath scooter during pause
                        if (taglineOpacity > 0.0)
                          Positioned(
                            top: groundY + 28,
                            left: 24,
                            right: 24,
                            child: Opacity(
                              opacity: taglineOpacity,
                              child: Column(
                                children: [
                                  Text(
                                    widget.brandName,
                                    style: const TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF10B981),
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Medicines at your doorstep • For Humans & Animals',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF94A3B8),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),

              // 3. Accessible Skip Control
              if (widget.skippable && _skipButtonVisible)
                Positioned(
                  top: MediaQuery.of(context).padding.top + 12,
                  right: 16,
                  child: Semantics(
                    button: true,
                    label: 'Skip launch animation',
                    child: TextButton(
                      onPressed: _skipAnimation,
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFF94A3B8),
                        backgroundColor: const Color(0xFF1E293B).withOpacity(0.7),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      ),
                      child: const Text('Skip >', style: TextStyle(fontSize: 13)),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFallbackArt(double w, double h) {
    return Container(
      width: w,
      height: h,
      alignment: Alignment.center,
      child: const Icon(Icons.two_wheeler_rounded, size: 80, color: Color(0xFF10B981)),
    );
  }

  Widget _buildRotatingSpokeWheel(double size) {
    return CustomPaint(
      size: Size(size, size),
      painter: _SpokeWheelPainter(),
    );
  }
}

class _GroundAndRoadPainter extends CustomPainter {
  final double groundY;
  final double scrollOffset;
  final double speedIntensity;

  _GroundAndRoadPainter({
    required this.groundY,
    required this.scrollOffset,
    required this.speedIntensity,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Ground base line
    final linePaint = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 2.0;
    canvas.drawLine(Offset(0, groundY), Offset(size.width, groundY), linePaint);

    // Faint road dashes
    final dashPaint = Paint()
      ..color = const Color(0xFF475569)
      ..strokeWidth = 2.0;

    const dashWidth = 24.0;
    const dashGap = 20.0;
    const totalPeriod = dashWidth + dashGap;
    final effectiveOffset = scrollOffset % totalPeriod;

    for (double x = -totalPeriod + effectiveOffset; x < size.width + totalPeriod; x += totalPeriod) {
      canvas.drawLine(
        Offset(x, groundY + 8),
        Offset(x + dashWidth, groundY + 8),
        dashPaint,
      );
    }

    // Speed lines when moving fast
    if (speedIntensity > 0.0) {
      final speedPaint = Paint()
        ..color = const Color(0xFF38BDF8).withOpacity(0.35 * speedIntensity)
        ..strokeWidth = 1.5;

      canvas.drawLine(
        Offset(size.width * 0.7 + (scrollOffset % 80), groundY - 60),
        Offset(size.width * 0.7 + (scrollOffset % 80) + 40, groundY - 60),
        speedPaint,
      );
      canvas.drawLine(
        Offset(size.width * 0.4 + (scrollOffset % 120), groundY - 110),
        Offset(size.width * 0.4 + (scrollOffset % 120) + 55, groundY - 110),
        speedPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _GroundAndRoadPainter oldDelegate) {
    return oldDelegate.scrollOffset != scrollOffset ||
        oldDelegate.speedIntensity != speedIntensity;
  }
}

class _SpokeWheelPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final rimPaint = Paint()
      ..color = const Color(0xFF94A3B8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;
    canvas.drawCircle(center, radius - 2, rimPaint);

    final spokePaint = Paint()
      ..color = const Color(0xFF64748B)
      ..strokeWidth = 1.5;

    for (int i = 0; i < 6; i++) {
      final angle = (i * pi / 3);
      final p1 = Offset(center.dx + cos(angle) * (radius - 4), center.dy + sin(angle) * (radius - 4));
      final p2 = Offset(center.dx - cos(angle) * (radius - 4), center.dy - sin(angle) * (radius - 4));
      canvas.drawLine(p1, p2, spokePaint);
    }

    final hubPaint = Paint()..color = const Color(0xFFCBD5E1);
    canvas.drawCircle(center, 4, hubPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
