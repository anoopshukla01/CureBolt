import 'package:flutter/material.dart';
import '../theme/pharmacy_theme.dart';

class ExpiryAlertBanner extends StatelessWidget {
  final int daysUntilExpiry;
  final bool isExpired;
  final String licenceNumber;
  final VoidCallback? onRenewPressed;

  const ExpiryAlertBanner({
    Key? key,
    required this.daysUntilExpiry,
    required this.isExpired,
    required this.licenceNumber,
    this.onRenewPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!isExpired && daysUntilExpiry > 60) {
      return const SizedBox.shrink();
    }

    Color bgColor;
    Color textColor;
    Color borderColor;
    IconData icon;
    String title;
    String description;

    if (isExpired || daysUntilExpiry <= 0) {
      bgColor = PharmacyColors.dangerBg;
      textColor = PharmacyColors.danger;
      borderColor = const Color(0xFFFCA5A5);
      icon = Icons.block;
      title = 'DRUG LICENCE EXPIRED';
      description =
          'Licence #$licenceNumber is expired. Operations & customer visibility are automatically suspended by statutory regulations.';
    } else if (daysUntilExpiry <= 7) {
      bgColor = PharmacyColors.dangerBg;
      textColor = PharmacyColors.danger;
      borderColor = const Color(0xFFFCA5A5);
      icon = Icons.error_outline;
      title = 'CRITICAL: LICENCE EXPIRES IN $daysUntilExpiry DAYS';
      description =
          'Immediate renewal submission required to avoid automatic suspension of dispensing privileges.';
    } else if (daysUntilExpiry <= 30) {
      bgColor = PharmacyColors.warningBg;
      textColor = PharmacyColors.warning;
      borderColor = const Color(0xFFFDE68A);
      icon = Icons.warning_amber_rounded;
      title = 'STATUTORY WARNING: LICENCE EXPIRES IN $daysUntilExpiry DAYS';
      description =
          'Form 20/21 licence expires soon. Upload renewed certificate in onboarding settings.';
    } else {
      // 31 to 60 days
      bgColor = const Color(0xFFFFFBEB);
      textColor = const Color(0xFFB45309);
      borderColor = const Color(0xFFFCD34D);
      icon = Icons.schedule;
      title = 'LICENCE RENEWAL NOTICE ($daysUntilExpiry DAYS REMAINING)';
      description =
          'Please initiate your UP FDA renewal filing to ensure uninterrupted quick-commerce operations.';
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: BorderSide(color: borderColor, width: 1.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: textColor, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: textColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: TextStyle(
                    color: textColor.withOpacity(0.9),
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          if (onRenewPressed != null) ...[
            const SizedBox(width: 8),
            TextButton(
              onPressed: onRenewPressed,
              style: TextButton.styleFrom(
                foregroundColor: textColor,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                visualDensity: VisualDensity.compact,
              ),
              child: const Text('UPDATE', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ],
      ),
    );
  }
}
