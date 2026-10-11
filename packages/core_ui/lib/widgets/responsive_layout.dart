import 'package:flutter/material.dart';

/// Responsive helper for pharmacy counter Android devices (Phone vs 10"+ Tablets)
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;

  const ResponsiveLayout({
    Key? key,
    required this.mobile,
    this.tablet,
  }) : super(key: key);

  static bool isTablet(BuildContext context) {
    return MediaQuery.of(context).size.shortestSide >= 600;
  }

  static bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    if (isTablet(context) && tablet != null) {
      return tablet!;
    }
    return mobile;
  }
}
