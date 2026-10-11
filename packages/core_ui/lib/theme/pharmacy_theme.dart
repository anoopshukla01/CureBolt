import 'package:flutter/material.dart';

class PharmacyColors {
  // Brand & Counter Medical Greens
  static const Color primary = Color(0xFF0F766E); // Teal 700
  static const Color primaryDark = Color(0xFF115E59); // Teal 800
  static const Color primaryLight = Color(0xFFCCFBF1); // Teal 100
  static const Color secondary = Color(0xFF0284C7); // Sky 600

  // Neutral Pharmacy Surfaces
  static const Color background = Color(0xFFF8FAFC); // Slate 50
  static const Color cardSurface = Colors.white;
  static const Color cardBorder = Color(0xFFE2E8F0); // Slate 200
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400

  // Statutory & Alert Colors
  static const Color success = Color(0xFF16A34A); // Green 600
  static const Color successBg = Color(0xFFDCFCE7); // Green 100
  static const Color warning = Color(0xFFD97706); // Amber 600
  static const Color warningBg = Color(0xFFFEF3C7); // Amber 100
  static const Color danger = Color(0xFFDC2626); // Red 600
  static const Color dangerBg = Color(0xFFFEE2E2); // Red 100
  static const Color info = Color(0xFF2563EB); // Blue 600
  static const Color infoBg = Color(0xFFDBEAFE); // Blue 100
}

class PharmacyTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: PharmacyColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: PharmacyColors.primary,
        primary: PharmacyColors.primary,
        secondary: PharmacyColors.secondary,
        surface: PharmacyColors.cardSurface,
        background: PharmacyColors.background,
        error: PharmacyColors.danger,
      ),
      fontFamily: 'Inter',
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: PharmacyColors.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: PharmacyColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardTheme(
        color: PharmacyColors.cardSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: PharmacyColors.cardBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: PharmacyColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: PharmacyColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: PharmacyColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: PharmacyColors.danger),
        ),
        labelStyle: const TextStyle(color: PharmacyColors.textSecondary, fontSize: 14),
        hintStyle: const TextStyle(color: PharmacyColors.textMuted, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: PharmacyColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          elevation: 0,
        ),
      ),
    );
  }
}
