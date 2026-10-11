import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AppConfigState {
  final String appId;
  final String minSupportedVersion;
  final String latestVersion;
  final bool updateRequired;
  final String forceUpdateTitle;
  final String forceUpdateMessage;
  final String storeUrl;
  final bool maintenanceMode;

  const AppConfigState({
    required this.appId,
    required this.minSupportedVersion,
    required this.latestVersion,
    required this.updateRequired,
    required this.forceUpdateTitle,
    required this.forceUpdateMessage,
    required this.storeUrl,
    required this.maintenanceMode,
  });

  factory AppConfigState.defaults(String appId) => AppConfigState(
        appId: appId,
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        updateRequired: false,
        forceUpdateTitle: 'Update Required',
        forceUpdateMessage: 'A new version of the app is available.',
        storeUrl: 'https://play.google.com/store',
        maintenanceMode: false,
      );

  factory AppConfigState.fromJson(Map<String, dynamic> json) {
    return AppConfigState(
      appId: json['appId'] as String? ?? '',
      minSupportedVersion: json['minSupportedVersion'] as String? ?? '1.0.0',
      latestVersion: json['latestVersion'] as String? ?? '1.0.0',
      updateRequired: json['updateRequired'] as bool? ?? false,
      forceUpdateTitle: json['forceUpdateTitle'] as String? ?? 'Update Required',
      forceUpdateMessage: json['forceUpdateMessage'] as String? ?? 'A new version is available.',
      storeUrl: json['storeUrl'] as String? ?? '',
      maintenanceMode: json['maintenanceMode'] as bool? ?? false,
    );
  }
}

class AppConfigService extends ChangeNotifier {
  static const String _keyFlagsPrefix = 'medcure_flag_';

  AppConfigState? _configState;
  final Map<String, bool> _cachedFeatureFlags = {};
  bool _isLoading = false;

  AppConfigState? get configState => _configState;
  bool get updateRequired => _configState?.updateRequired ?? false;
  bool get maintenanceMode => _configState?.maintenanceMode ?? false;
  bool get isLoading => _isLoading;

  /// Check feature flag with safe default (false)
  bool isFeatureEnabled(String flagKey, {bool defaultValue = false}) {
    return _cachedFeatureFlags[flagKey] ?? defaultValue;
  }

  /// Check minimum supported app version against backend
  Future<AppConfigState> checkAppVersion({
    required String baseUrl,
    required String appId,
    required String currentVersion,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final platform = defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
      final uri = Uri.parse('$baseUrl/config/app?appId=$appId&version=$currentVersion&platform=$platform');
      final res = await http.get(uri).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body) as Map<String, dynamic>;
        _configState = AppConfigState.fromJson(decoded);
      } else {
        _configState = AppConfigState.defaults(appId);
      }
    } catch (e) {
      debugPrint('AppConfigService check failed (offline / network error): $e');
      _configState ??= AppConfigState.defaults(appId);
    } finally {
      _isLoading = false;
      notifyListeners();
    }

    return _configState!;
  }

  /// Initialize local feature flags from storage
  Future<void> initializeFlags() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final key in prefs.getKeys()) {
        if (key.startsWith(_keyFlagsPrefix)) {
          final flag = key.replaceFirst(_keyFlagsPrefix, '');
          _cachedFeatureFlags[flag] = prefs.getBool(key) ?? false;
        }
      }
    } catch (_) {}
  }
}
