library core_l10n;

import 'package:intl/intl.dart';

class CoreL10n {
  static bool isHindi = false;

  /// Currency formatting: Indian Rupee (₹) with grouping
  static String formatCurrency(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: amount % 1 == 0 ? 0 : 2,
    );
    return formatter.format(amount);
  }

  /// Date formatting (e.g. 11 Oct 2026, 04:30 PM)
  static String formatDateTime(DateTime dateTime) {
    final formatter = DateFormat('dd MMM yyyy, hh:mm a');
    return formatter.format(dateTime.toLocal());
  }

  /// Relative time helper
  static String formatRelativeTime(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inSeconds < 60) return isHindi ? 'अभी-अभी' : 'Just now';
    if (diff.inMinutes < 60) return isHindi ? '${diff.inMinutes} मिनट पहले' : '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return isHindi ? '${diff.inHours} घंटे पहले' : '${diff.inHours}h ago';
    return isHindi ? '${diff.inDays} दिन पहले' : '${diff.inDays}d ago';
  }

  // --- Healthcare Domain Strings ---
  static String get humanHealthcare => isHindi ? 'मानव स्वास्थ्य' : 'Human Healthcare';
  static String get animalHealthcare => isHindi ? 'पशु स्वास्थ्य (वेटनरी)' : 'Animal Healthcare (Veterinary)';
  static String get otcDirect => isHindi ? 'ओटीसी सीधा आर्डर' : 'OTC Direct (No Rx)';
  static String get rxRequired => isHindi ? 'डॉक्टर का पर्चा अनिवार्य' : 'Prescription Required';

  // --- Order State Strings ---
  static String getOrderStateLabel(String state) {
    switch (state.toUpperCase()) {
      case 'CREATED':
        return isHindi ? 'ऑर्डर प्राप्त हुआ' : 'Order Placed';
      case 'PAYMENT_PENDING':
        return isHindi ? 'भुगतान लंबित' : 'Payment Pending';
      case 'PAYMENT_CONFIRMED':
        return isHindi ? 'भुगतान सफल' : 'Payment Confirmed';
      case 'PHARMACY_REVIEW':
        return isHindi ? 'फार्मेसी द्वारा समीक्षा' : 'Pharmacy Review';
      case 'PRESCRIPTION_CLARIFICATION':
        return isHindi ? 'पर्चे पर स्पष्टीकरण अपेक्षित' : 'Prescription Clarification';
      case 'ACCEPTED':
        return isHindi ? 'फार्मेसी द्वारा स्वीकृत' : 'Order Accepted';
      case 'REJECTED':
        return isHindi ? 'ऑर्डर अस्वीकृत' : 'Order Rejected';
      case 'PACKING':
      case 'PACKED':
        return isHindi ? 'पैकिंग प्रक्रिया पूर्ण' : 'Packed & Ready';
      case 'RIDER_ASSIGNED':
        return isHindi ? 'डिलीवरी पार्टनर नियुक्त' : 'Rider Assigned';
      case 'PICKED_UP':
        return isHindi ? 'फार्मेसी से पिकअप पूर्ण' : 'Picked Up';
      case 'OUT_FOR_DELIVERY':
        return isHindi ? 'डिलीवरी के लिए रवाना' : 'Out for Delivery';
      case 'DELIVERED':
        return isHindi ? 'सफलतापूर्वक डिलीवर' : 'Delivered';
      case 'CANCELLED':
        return isHindi ? 'ऑर्डर रद्द' : 'Cancelled';
      case 'DELIVERY_FAILED':
        return isHindi ? 'डिलीवरी असफल' : 'Delivery Failed';
      default:
        return state.replaceAll('_', ' ');
    }
  }

  // --- Error & Status Messages ---
  static String get networkError =>
      isHindi ? 'इंटरनेट कनेक्शन में समस्या है। कृपया पुनः प्रयास करें।' : 'Network connection error. Please retry.';
  static String get updateRequiredTitle =>
      isHindi ? 'एप्लिकेशन अपडेट आवश्यक है' : 'Critical Update Required';
  static String get updateRequiredMessage =>
      isHindi ? 'सुरक्षित संचालन जारी रखने के लिए कृपया ऐप को नवीनतम संस्करण में अपडेट करें।'
              : 'Please update to the latest version from the app store to continue.';
  static String get updateNow => isHindi ? 'अभी अपडेट करें' : 'UPDATE NOW';
}

// Retain compatibility with existing PharmacyStrings
class PharmacyStrings {
  static bool get isHindi => CoreL10n.isHindi;
  static set isHindi(bool val) => CoreL10n.isHindi = val;

  static String get appTitle => isHindi ? 'मेडक्योर पार्टनर' : 'Medcure Partner';
  static String get loginTitle => isHindi ? 'फार्मेसी पोर्टल लॉगिन' : 'Pharmacy Portal Login';
  static String get enterPhoneOrEmail =>
      isHindi ? 'पंजीकृत फोन नंबर या ईमेल दर्ज करें' : 'Enter registered phone or email';
  static String get roleOwner => isHindi ? 'फार्मेसी मालिक / व्यवस्थापक' : 'Pharmacy Owner / Admin';
  static String get rolePharmacist => isHindi ? 'पंजीकृत फार्मासिस्ट' : 'Registered Pharmacist';
  static String get roleStaff => isHindi ? 'काउंटर स्टाफ' : 'Pharmacy Staff';
  static String get licenceExpired => isHindi ? 'ड्रग लाइसेंस समाप्त हो गया है' : 'Drug Licence Expired';
  static String get licenceExpiresIn => isHindi ? 'लाइसेंस समाप्ति में शेष दिन' : 'Licence expires in';
  static String get newOrders => isHindi ? 'नए ऑर्डर' : 'New Orders';
  static String get rxReview => isHindi ? 'पर्चे की समीक्षा' : 'Prescription Review';
  static String get preparing => isHindi ? 'पैकिंग प्रक्रिया' : 'Preparing & Packing';
  static String get readyForPickup => isHindi ? 'हैंडओवर के लिए तैयार' : 'Ready for Pickup';
  static String get acceptOrder => isHindi ? 'ऑर्डर स्वीकार करें' : 'Accept Order';
  static String get rejectOrder => isHindi ? 'ऑर्डर अस्वीकार करें' : 'Reject Order';
  static String get signOutEverywhere => isHindi ? 'सभी डिवाइस से लॉगआउट करें' : 'Sign Out Everywhere';
}
