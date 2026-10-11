enum AppFlavor {
  dev,
  staging,
  prod,
}

class FlavorConfig {
  final AppFlavor flavor;
  final String apiBaseUrl;
  final String supabaseUrl;
  final String appId;
  final String appName;

  const FlavorConfig({
    required this.flavor,
    required this.apiBaseUrl,
    required this.supabaseUrl,
    required this.appId,
    required this.appName,
  });

  bool get isDev => flavor == AppFlavor.dev;
  bool get isStaging => flavor == AppFlavor.staging;
  bool get isProd => flavor == AppFlavor.prod;

  /// Safety check: prevents production builds from pointing to localhost/mock endpoints
  /// and prevents accidental cross-environment configuration.
  void validate() {
    if (isProd && (apiBaseUrl.contains('localhost') || apiBaseUrl.contains('10.0.2.2') || apiBaseUrl.contains('127.0.0.1'))) {
      throw StateError('CRITICAL CONFIGURATION ERROR: Production build cannot point to a local/mock development backend ($apiBaseUrl).');
    }
    if (isDev && apiBaseUrl.contains('api.medcure.in') && !apiBaseUrl.contains('staging') && !apiBaseUrl.contains('dev')) {
      throw StateError('CRITICAL CONFIGURATION ERROR: Development build cannot target production backend without isolation.');
    }
  }

  static FlavorConfig devForApp({required String appId, required String appName}) {
    final cfg = FlavorConfig(
      flavor: AppFlavor.dev,
      apiBaseUrl: 'http://localhost:3000/api/v1',
      supabaseUrl: 'http://localhost:54321',
      appId: appId,
      appName: '$appName (Dev)',
    );
    cfg.validate();
    return cfg;
  }

  static FlavorConfig stagingForApp({required String appId, required String appName}) {
    final cfg = FlavorConfig(
      flavor: AppFlavor.staging,
      apiBaseUrl: 'https://staging-api.medcure.in/api/v1',
      supabaseUrl: 'https://staging-auth.medcure.in',
      appId: appId,
      appName: '$appName (Staging)',
    );
    cfg.validate();
    return cfg;
  }

  static FlavorConfig prodForApp({required String appId, required String appName}) {
    final cfg = FlavorConfig(
      flavor: AppFlavor.prod,
      apiBaseUrl: 'https://api.medcure.in/api/v1',
      supabaseUrl: 'https://auth.medcure.in',
      appId: appId,
      appName: appName,
    );
    cfg.validate();
    return cfg;
  }
}
