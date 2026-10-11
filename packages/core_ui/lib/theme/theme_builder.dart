import 'package:flutter/material.dart';
import 'pharmacy_theme.dart';

class ThemeBuilder {
  static ThemeData buildAppTheme({
    required Color primaryColor,
    required Color secondaryColor,
    Color backgroundColor = const Color(0xFFF8FAFC),
    Color cardColor = Colors.white,
    String fontFamily = 'Inter',
  }) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryColor,
      primary: primaryColor,
      secondary: secondaryColor,
      surface: cardColor,
      background: backgroundColor,
      error: PharmacyColors.danger,
    );

    return ThemeData(
      useMaterial3: true,
      fontFamily: fontFamily,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: colorScheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: PharmacyColors.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: const TextStyle(
          color: PharmacyColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardTheme(
        color: cardColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: PharmacyColors.cardBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
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

  // Pre-configured flavor themes for the three apps
  static ThemeData get customerTheme => buildAppTheme(
        primaryColor: const Color(0xFF0F766E), // Teal 700
        secondaryColor: const Color(0xFF0284C7), // Sky 600
      );

  static ThemeData get riderTheme => buildAppTheme(
        primaryColor: const Color(0xFFD97706), // Amber 600
        secondaryColor: const Color(0xFF059669), // Emerald 600
      );

  static ThemeData get merchantTheme => buildAppTheme(
        primaryColor: const Color(0xFF0F766E), // Pharmacy Medical Teal
        secondaryColor: const Color(0xFF14B8A6), // Teal 500
      );
}
