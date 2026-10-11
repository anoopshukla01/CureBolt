import 'package:flutter/foundation.dart';
import 'package:core_api/core_api.dart';
import '../models/onboarding_model.dart';

class PharmacyOnboardingService extends ChangeNotifier {
  PharmacyOnboardingModel? _application;
  bool _isLoading = false;
  String? _errorMessage;

  PharmacyOnboardingModel? get application => _application;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Load existing application or licence status for this pharmacy
  Future<PharmacyOnboardingModel?> fetchApplication({String? pharmacyId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final query = pharmacyId != null ? '?pharmacyId=$pharmacyId' : '';
      final response = await ApiClient.get('/pharmacy/onboarding/application$query');

      if (response['application'] != null) {
        _application = PharmacyOnboardingModel.fromJson(response['application'] as Map<String, dynamic>);
      }
      _isLoading = false;
      notifyListeners();
      return _application;
    } on ApiException catch (e) {
      _isLoading = false;
      _errorMessage = e.message;
      notifyListeners();
      return null;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return null;
    }
  }

  /// Create or update draft application
  Future<PharmacyOnboardingModel> saveDraft(Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.post('/pharmacy/onboarding/application', body: data);
      _application = PharmacyOnboardingModel.fromJson(response['application'] as Map<String, dynamic>);
      _isLoading = false;
      notifyListeners();
      return _application!;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Submit draft application for Platform Admin verification
  Future<PharmacyOnboardingModel> submitApplication(String applicationId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.post('/pharmacy/onboarding/submit', body: {
        'applicationId': applicationId,
      });
      _application = PharmacyOnboardingModel.fromJson(response['application'] as Map<String, dynamic>);
      _isLoading = false;
      notifyListeners();
      return _application!;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }
}
