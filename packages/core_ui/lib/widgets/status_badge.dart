import 'package:flutter/material.dart';
import '../theme/pharmacy_theme.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    Key? key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  }) : super(key: key);

  factory StatusBadge.fromStatus(String status) {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'active':
      case 'approved':
        return StatusBadge(
          label: status.toUpperCase(),
          backgroundColor: PharmacyColors.successBg,
          textColor: PharmacyColors.success,
          icon: Icons.check_circle_outline,
        );
      case 'submitted':
      case 'pending':
        return StatusBadge(
          label: status.toUpperCase(),
          backgroundColor: PharmacyColors.infoBg,
          textColor: PharmacyColors.info,
          icon: Icons.hourglass_top,
        );
      case 'needs_changes':
      case 'warning':
        return StatusBadge(
          label: 'NEEDS CHANGES',
          backgroundColor: PharmacyColors.warningBg,
          textColor: PharmacyColors.warning,
          icon: Icons.edit_note,
        );
      case 'suspended':
      case 'rejected':
      case 'expired':
        return StatusBadge(
          label: status.toUpperCase(),
          backgroundColor: PharmacyColors.dangerBg,
          textColor: PharmacyColors.danger,
          icon: Icons.cancel_outlined,
        );
      case 'draft':
      default:
        return StatusBadge(
          label: status.toUpperCase(),
          backgroundColor: const Color(0xFFF1F5F9),
          textColor: PharmacyColors.textSecondary,
          icon: Icons.drafts_outlined,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
