import 'package:flutter/material.dart';
import '../theme/pharmacy_theme.dart';

class StatusChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color backgroundColor;
  final Color foregroundColor;

  const StatusChip({
    Key? key,
    required this.label,
    required this.icon,
    required this.backgroundColor,
    required this.foregroundColor,
  }) : super(key: key);

  factory StatusChip.inStock() => const StatusChip(
        label: 'In Stock',
        icon: Icons.check_circle_outline,
        backgroundColor: PharmacyColors.successBg,
        foregroundColor: PharmacyColors.success,
      );

  factory StatusChip.lowStock() => const StatusChip(
        label: 'Low Stock',
        icon: Icons.warning_amber_rounded,
        backgroundColor: PharmacyColors.warningBg,
        foregroundColor: PharmacyColors.warning,
      );

  factory StatusChip.outOfStock() => const StatusChip(
        label: 'Out of Stock',
        icon: Icons.cancel_outlined,
        backgroundColor: PharmacyColors.dangerBg,
        foregroundColor: PharmacyColors.danger,
      );

  factory StatusChip.orderState(String state) {
    switch (state.toUpperCase()) {
      case 'DELIVERED':
        return const StatusChip(
          label: 'Delivered',
          icon: Icons.task_alt,
          backgroundColor: PharmacyColors.successBg,
          foregroundColor: PharmacyColors.success,
        );
      case 'OUT_FOR_DELIVERY':
        return const StatusChip(
          label: 'Out for Delivery',
          icon: Icons.two_wheeler,
          backgroundColor: PharmacyColors.infoBg,
          foregroundColor: PharmacyColors.info,
        );
      case 'PACKING':
      case 'PACKED':
        return const StatusChip(
          label: 'Packed',
          icon: Icons.inventory_2_outlined,
          backgroundColor: PharmacyColors.primaryLight,
          foregroundColor: PharmacyColors.primary,
        );
      case 'PHARMACY_REVIEW':
        return const StatusChip(
          label: 'Pharmacy Review',
          icon: Icons.hourglass_top,
          backgroundColor: PharmacyColors.warningBg,
          foregroundColor: PharmacyColors.warning,
        );
      case 'CANCELLED':
      case 'REJECTED':
        return const StatusChip(
          label: 'Cancelled',
          icon: Icons.close,
          backgroundColor: PharmacyColors.dangerBg,
          foregroundColor: PharmacyColors.danger,
        );
      default:
        return StatusChip(
          label: state.replaceAll('_', ' '),
          icon: Icons.info_outline,
          backgroundColor: const Color(0xFFF1F5F9),
          foregroundColor: PharmacyColors.textSecondary,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: foregroundColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: foregroundColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
