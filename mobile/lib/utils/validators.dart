/// Pure validation and business logic functions for customer authentication and profile.
class Validators {
  static final RegExp _indianPhoneRegex = RegExp(r'^[6-9]\d{9}$');
  static final RegExp _nameRegex = RegExp(r"^[a-zA-Z\s.'-]+$");

  /// Cleans and extracts a 10-digit Indian phone number starting with 6-9
  static String? normalizePhone(String? input) {
    if (input == null) return null;
    final digits = input.replaceAll(RegExp(r'\D'), '');
    final tenDigits = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;
    if (_indianPhoneRegex.hasMatch(tenDigits)) {
      return '+91$tenDigits';
    }
    return null;
  }

  /// Validates a 10-digit Indian mobile number
  static String? validatePhone(String? input) {
    if (input == null || input.trim().isEmpty) {
      return 'Mobile number is required';
    }
    final digits = input.replaceAll(RegExp(r'\D'), '');
    final tenDigits = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;

    if (tenDigits.length != 10) {
      return 'Please enter a 10-digit mobile number';
    }
    if (!tenDigits.startsWith(RegExp(r'[6-9]'))) {
      return 'Mobile number must start with 6, 7, 8, or 9';
    }
    if (!_indianPhoneRegex.hasMatch(tenDigits)) {
      return 'Invalid mobile number format';
    }
    return null;
  }

  /// Validates a customer's full name (2-60 chars, letters, spaces, full stops, apostrophes, hyphens)
  static String? validateFullName(String? input) {
    if (input == null || input.trim().isEmpty) {
      return 'Full name is required';
    }
    final trimmed = input.trim();
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmed.length > 60) {
      return 'Name cannot exceed 60 characters';
    }
    if (!_nameRegex.hasMatch(trimmed)) {
      return 'Name can only contain letters, spaces, full stops, apostrophes, and hyphens';
    }
    return null;
  }

  /// Calculates exact age in years, handling leap years and day-of-month boundaries
  static int calculateAge(DateTime dob, [DateTime? referenceDate]) {
    final now = referenceDate ?? DateTime.now();
    int age = now.year - dob.year;
    final monthDiff = now.month - dob.month;
    if (monthDiff < 0 || (monthDiff == 0 && now.day < dob.day)) {
      age--;
    }
    return age;
  }

  /// Validates Date of Birth according to pharmaceutical delivery age restrictions (18+)
  static String? validateDateOfBirth(DateTime? dob, {int minAge = 18, DateTime? referenceDate}) {
    if (dob == null) {
      return 'Date of birth is required';
    }
    final now = referenceDate ?? DateTime.now();
    if (dob.isAfter(now)) {
      return 'Date of birth cannot be in the future';
    }

    final age = calculateAge(dob, now);
    if (age > 120) {
      return 'Please enter a valid date of birth (max 120 years)';
    }
    if (age < minAge) {
      return 'You must be at least $minAge years of age to order medicines. Service is restricted for minors.';
    }
    return null;
  }
}
