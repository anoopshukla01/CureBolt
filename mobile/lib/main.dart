import 'package:flutter/material.dart';
import 'screens/splash_onboarding_screen.dart';

void main() {
  runApp(const MedcureApp());
}

class MedcureApp extends StatelessWidget {
  const MedcureApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Medcure | Gorakhpur Quick-Commerce Medicine',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF028391),
          primary: const Color(0xFF028391),
          secondary: const Color(0xFF0B192C),
          surface: Colors.white,
          background: const Color(0xFFF8FAFC),
        ),
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0B192C),
          elevation: 0.5,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: Color(0xFF0B192C),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      home: const SplashOnboardingScreen(),
    );
  }
}
