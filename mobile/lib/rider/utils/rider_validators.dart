/// Pure validation functions for Delivery Partner (Rider) onboarding and compliance

class RiderValidators {
  static final RegExp _phoneRegex = RegExp(r'^[6-9]\d{9}$');
  static final RegExp _nameRegex = RegExp(r"^[a-zA-Z\s.'-]+$");
  static final RegExp _dlRegex = RegExp(r'^[A-Z]{2}[0-9]{2}\s?[0-9A-Z]{7,12}$', caseSensitive: false);
  static final RegExp _vehicleRegRegex = RegExp(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$|^[A-Z]{2}[0-9]{1,2}-[A-Z]{1,3}-[0-9]{4}$', caseSensitive: false);
  static final RegExp _panRegex = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', caseSensitive: false);
  static final RegExp _aadhaarRegex = RegExp(r'^\d{4}\s?\d{4}\s?\d{4}$');
  static final RegExp _ifscRegex = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$', caseSensitive: false);
  static final RegExp _upiRegex = RegExp(r'^[\w.\-_]{2,49}@[\w._]{2,49}$');

  /// Validates 10-digit Indian mobile number
  static String? validatePhone(String? input) {
    if (input == null || input.trim().isEmpty) {
      return 'Mobile number is required';
    }
    final digits = input.replaceAll(RegExp(r'\D'), '');
    final tenDigits = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;

    if (tenDigits.length != 10) {
      return 'Please enter a 10-digit mobile number';
    }
    if (!_phoneRegex.hasMatch(tenDigits)) {
      return 'Mobile number must be a valid 10-digit Indian number starting with 6-9';
    }
    return null;
  }

  /// Validates full name
  static String? validateFullName(String? input) {
    if (input == null || input.trim().isEmpty) {
      return 'Full name is required';
    }
    final trimmed = input.trim();
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmed.length > 80) {
      return 'Name cannot exceed 80 characters';
    }
    if (!_nameRegex.hasMatch(trimmed)) {
      return 'Name can only contain letters, spaces, and punctuation';
    }
    return null;
  }

  /// Validates Driving Licence number (e.g., UP5320210098765)
  static String? validateDrivingLicence(String? input) {
    if (input == null || input.trim().isEmpty) {
      return 'Driving licence number is required';
    }
    final cleaned = input.trim().replaceAll(RegExp(r'\s+'), '');
    if (cleaned.length < 10 || cleaned.length > 16) {
      return 'Driving licence should be 10-16 characters long';
    }
    if (!_dlRegex.hasMatch(cleaned)) {
      return 'Invalid driving licence format (e.g., UP5320210098765)';
    }
    return null;
  }

  /// Validates driving licence expiry date (must be in future)
  static String? validateLicenceExpiry(DateTime? expiry, [DateTime? referenceDate]) {
    if (expiry == null) {
      return 'Licence expiry date is required';
    }
    final now = referenceDate ?? DateTime.now();
    if (expiry.isBefore(now)) {
      return 'Driving licence has expired. Active licence is required for delivery partners.';
    }
    return null;
  }

  /// Validates Vehicle Registration Number (e.g., UP53-AB-1234 or UP53AB1234)
  static String? validateVehicleRegistration(String? input) {
    if (input == null || input.trim().isEmpty) {
      return 'Vehicle registration number is required';
    }
    final cleaned = input.trim().replaceAll(RegExp(r'\s+'), '').toUpperCase();
    if (!_vehicleRegRegex.hasMatch(cleaned)) {
      return 'Invalid registration number (e.g. UP53-AB-1234 or UP53AB1234)';
    }
    return null;
  }

  /// Validates government identity document number based on type
  static String? validateGovId(String? input, String type) {
    if (input == null || input.trim().isEmpty) {
      return 'Government ID number is required';
    }
    final cleaned = input.trim().replaceAll(RegExp(r'\s+'), '').toUpperCase();

    if (type.toLowerCase() == 'pan') {
      if (!_panRegex.hasMatch(cleaned)) {
        return 'Invalid PAN format (e.g. ABCDE1234F)';
      }
    } else if (type.toLowerCase() == 'aadhaar') {
      final digits = input.replaceAll(RegExp(r'\D'), '');
      if (digits.length != 12) {
        return 'Aadhaar number must be exactly 12 digits';
      }
    } else {
      if (cleaned.length < 5) {
        return 'Please enter a valid Voter ID number';
      }
    }
    return null;
  }

  /// Validates emergency contact (cannot match rider's own number)
  static String? validateEmergencyContact({
    required String? riderPhone,
    required String? emergencyPhone,
    required String? emergencyName,
  }) {
    if (emergencyName == null || emergencyName.trim().length < 2) {
      return 'Emergency contact name is required';
    }
    final phoneError = validatePhone(emergencyPhone);
    if (phoneError != null) {
      return 'Emergency contact phone: $phoneError';
    }

    if (riderPhone != null && emergencyPhone != null) {
      final rDigits = riderPhone.replaceAll(RegExp(r'\D'), '');
      final eDigits = emergencyPhone.replaceAll(RegExp(r'\D'), '');
      final rTen = rDigits.length >= 10 ? rDigits.substring(rDigits.length - 10) : rDigits;
      final eTen = eDigits.length >= 10 ? eDigits.substring(eDigits.length - 10) : eDigits;

      if (rTen == eTen) {
        return 'Emergency contact number cannot be the same as your delivery partner mobile number.';
      }
    }
    return null;
  }

  /// Validates Bank IFSC
  static String? validateIfsc(String? input) {
    if (input == null || input.trim().isEmpty) {
      return null; // Optional if UPI provided
    }
    final cleaned = input.trim().toUpperCase();
    if (!_ifscRegex.hasMatch(cleaned)) {
      return 'Invalid IFSC code format (e.g., SBIN0000123)';
    }
    return null;
  }

  /// Validates UPI ID
  static String? validateUpiId(String? input) {
    if (input == null || input.trim().isEmpty) {
      return null; // Optional if Bank Account provided
    }
    final cleaned = input.trim();
    if (!_upiRegex.hasMatch(cleaned)) {
      return 'Invalid UPI ID format (e.g., user@oksbi)';
    }
    return null;
  }
}
