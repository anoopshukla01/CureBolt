import 'package:flutter_test/flutter_test.dart';
import 'package:medcure_mobile/rider/utils/rider_validators.dart';

void main() {
  group('Delivery Partner (Rider) Milestone R1 Validators Unit Tests', () {
    group('1. Rider Driving Licence Validation', () {
      test('accepts valid Indian driving licence formats', () {
        expect(RiderValidators.validateDrivingLicence('UP5320210098765'), isNull);
        expect(RiderValidators.validateDrivingLicence('DL0420110012345'), isNull);
        expect(RiderValidators.validateDrivingLicence('MH1220190054321'), isNull);
      });

      test('rejects empty or malformed driving licence numbers', () {
        expect(RiderValidators.validateDrivingLicence(''), contains('required'));
        expect(RiderValidators.validateDrivingLicence('12345'), contains('10-16 characters'));
        expect(RiderValidators.validateDrivingLicence('INVALID!@#'), contains('Invalid driving licence format'));
      });

      test('validates licence expiry date (requires active future licence)', () {
        final reference = DateTime(2026, 10, 11);
        final futureDate = DateTime(2030, 5, 20);
        final expiredDate = DateTime(2025, 1, 1);

        expect(RiderValidators.validateLicenceExpiry(futureDate, reference), isNull);
        expect(RiderValidators.validateLicenceExpiry(expiredDate, reference), contains('expired'));
        expect(RiderValidators.validateLicenceExpiry(null, reference), contains('required'));
      });
    });

    group('2. Vehicle Registration Validation', () {
      test('accepts valid Indian registration formats (standard and hyphenated)', () {
        expect(RiderValidators.validateVehicleRegistration('UP53-AB-1234'), isNull);
        expect(RiderValidators.validateVehicleRegistration('UP53AB1234'), isNull);
        expect(RiderValidators.validateVehicleRegistration('DL1CAB9999'), isNull);
      });

      test('rejects invalid vehicle registrations', () {
        expect(RiderValidators.validateVehicleRegistration(''), contains('required'));
        expect(RiderValidators.validateVehicleRegistration('1234'), contains('Invalid registration number'));
        expect(RiderValidators.validateVehicleRegistration('UNKNOWN'), contains('Invalid registration number'));
      });
    });

    group('3. Emergency Contact Validation & Non-Collision Rule', () {
      test('accepts valid emergency contact distinct from rider phone', () {
        expect(
          RiderValidators.validateEmergencyContact(
            riderPhone: '+919876500005',
            emergencyPhone: '+919876511111',
            emergencyName: 'Ramesh Yadav',
          ),
          isNull,
        );
      });

      test('strictly rejects emergency contact identical to rider phone', () {
        expect(
          RiderValidators.validateEmergencyContact(
            riderPhone: '+919876500005',
            emergencyPhone: '+919876500005', // Same!
            emergencyName: 'Self',
          ),
          contains('Emergency contact number cannot be the same'),
        );
      });

      test('rejects missing name or invalid phone for emergency contact', () {
        expect(
          RiderValidators.validateEmergencyContact(
            riderPhone: '+919876500005',
            emergencyPhone: '123',
            emergencyName: 'Ramesh',
          ),
          contains('Emergency contact phone'),
        );
      });
    });

    group('4. Government ID Validation (Aadhaar & PAN)', () {
      test('accepts 12-digit Aadhaar card numbers', () {
        expect(RiderValidators.validateGovId('123456789012', 'aadhaar'), isNull);
        expect(RiderValidators.validateGovId('1234 5678 9012', 'aadhaar'), isNull);
      });

      test('rejects invalid Aadhaar card numbers', () {
        expect(RiderValidators.validateGovId('123456', 'aadhaar'), contains('12 digits'));
      });

      test('accepts valid 10-character PAN format', () {
        expect(RiderValidators.validateGovId('ABCDE1234F', 'pan'), isNull);
      });

      test('rejects malformed PAN numbers', () {
        expect(RiderValidators.validateGovId('12345ABCDE', 'pan'), contains('Invalid PAN format'));
      });
    });

    group('5. Payout Details Validation (IFSC & UPI)', () {
      test('accepts valid IFSC codes', () {
        expect(RiderValidators.validateIfsc('SBIN0000123'), isNull);
        expect(RiderValidators.validateIfsc('HDFC0001234'), isNull);
      });

      test('rejects invalid IFSC codes', () {
        expect(RiderValidators.validateIfsc('SBI0000123'), contains('Invalid IFSC'));
        expect(RiderValidators.validateIfsc('12345678901'), contains('Invalid IFSC'));
      });

      test('accepts valid UPI IDs and rejects invalid formats', () {
        expect(RiderValidators.validateUpiId('vikas@oksbi'), isNull);
        expect(RiderValidators.validateUpiId('rider.fleet_99@paytm'), isNull);
        expect(RiderValidators.validateUpiId('invalidupi'), contains('Invalid UPI ID'));
      });
    });
  });
}
