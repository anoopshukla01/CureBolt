import '../models/pharmacy_user.dart';

class PharmacyPermissions {
  /// Strictly checks if a user is legally authorized to review prescription documents.
  /// Only registered Pharmacists (or an Owner who has registered Pharmacist credentials) may proceed.
  static bool canReviewPrescription(PharmacyUser? user) {
    if (user == null) return false;
    return user.capabilities.canViewAndDecidePrescriptions;
  }

  /// Strictly checks if a user can modify staff accounts, onboarding details, and bank payouts.
  /// Only Pharmacy Owners may perform this administrative action.
  static bool canManageStaffAndPayouts(PharmacyUser? user) {
    if (user == null) return false;
    return user.capabilities.canManageProfileAndStaff;
  }

  /// Strictly checks if a user can view financial statements and reports.
  static bool canViewReports(PharmacyUser? user) {
    if (user == null) return false;
    return user.capabilities.canViewReportsAndSettlements;
  }

  /// Checks if user can pack and record batch numbers (all roles permitted at counter).
  static bool canPickAndPack(PharmacyUser? user) {
    if (user == null) return false;
    return user.capabilities.canPickAndPack;
  }
}
