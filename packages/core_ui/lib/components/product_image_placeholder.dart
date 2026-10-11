import 'package:flutter/material.dart';
import '../theme/pharmacy_theme.dart';

class ProductImagePlaceholder extends StatelessWidget {
  final double size;
  final bool isVeterinary;

  const ProductImagePlaceholder({
    Key? key,
    this.size = 64,
    this.isVeterinary = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
        border: BorderSide(color: Colors.grey.shade200),
      ),
      child: Center(
        child: Icon(
          isVeterinary ? Icons.pets : Icons.medication_outlined,
          size: size * 0.45,
          color: isVeterinary ? const Color(0xFFD97706) : PharmacyColors.primary,
        ),
      ),
    );
  }
}
