import 'package:flutter_test/flutter_test.dart';
import 'package:medcure_mobile/utils/validators.dart';

void main() {
  group('Milestone 1 Validators Unit Tests', () {
    group('1. Indian Mobile Phone Validation', () {
      test('accepts valid 10-digit Indian numbers starting with 6, 7, 8, 9', () {
        expect(Validators.validatePhone('9876543210'), isNull);
        expect(Validators.validatePhone('8123456789'), isNull);
        expect(Validators.validatePhone('7000123456'), isNull);
        expect(Validators.validatePhone('6999888777'), isNull);
      });

      test('normalizes numbers with +91 prefix and whitespaces', () {
        expect(Validators.normalizePhone('+91 98765 43210'), '+919876543210');
        expect(Validators.normalizePhone('09876543210'), '+919876543210');
        expect(Validators.normalizePhone('9876543210'), '+919876543210');
      });

      test('rejects numbers starting with invalid digits (e.g., 0-5)', () {
        expect(Validators.validatePhone('5123456789'), contains('start with 6, 7, 8, or 9'));
        expect(Validators.validatePhone('1234567890'), contains('start with 6, 7, 8, or 9'));
        expect(Validators.validatePhone('0987654321'), contains('start with 6, 7, 8, or 9'));
      });

      test('rejects numbers with incorrect length or empty input', () {
        expect(Validators.validatePhone(''), contains('required'));
        expect(Validators.validatePhone('98765'), contains('10-digit'));
        expect(Validators.validatePhone('987654321000'), contains('10-digit'));
      });
    });

    group('2. Customer Full Name Validation', () {
      test('accepts valid names between 2 and 60 characters with allowed characters', () {
        expect(Validators.validateFullName('Pooja Srivastava'), isNull);
        expect(Validators.validateFullName('Dr. Alok Verma'), isNull);
        expect(Validators.validateFullName("O'Connor"), isNull);
        expect(Validators.validateFullName('Mary-Jane Watson'), isNull);
        expect(Validators.validateFullName('Om'), isNull);
      });

      test('rejects names shorter than 2 chars or longer than 60 chars', () {
        expect(Validators.validateFullName(''), contains('required'));
        expect(Validators.validateFullName('A'), contains('at least 2 characters'));
        final tooLongName = 'A' * 61;
        expect(Validators.validateFullName(tooLongName), contains('cannot exceed 60'));
      });

      test('rejects names with numbers or illegal special characters', () {
        expect(Validators.validateFullName('Pooja123'), contains('only contain letters'));
        expect(Validators.validateFullName('Pooja@Srivastava'), contains('only contain letters'));
        expect(Validators.validateFullName('User_Name!'), contains('only contain letters'));
      });
    });

    group('3. Date of Birth & Age Calculation Across Boundaries', () {
      test('calculates exact age correctly before and after birthday in current year', () {
        final reference = DateTime(2026, 6, 15);

        // Birthday has not occurred yet this year (born Dec 1, 2000)
        final bdayLater = DateTime(2000, 12, 1);
        expect(Validators.calculateAge(bdayLater, reference), 25);

        // Birthday has already occurred this year (born Jan 1, 2000)
        final bdayEarlier = DateTime(2000, 1, 1);
        expect(Validators.calculateAge(bdayEarlier, reference), 26);

        // Exactly on the birthday
        final bdayToday = DateTime(2000, 6, 15);
        expect(Validators.calculateAge(bdayToday, reference), 26);

        // One day before birthday (turning 18 tomorrow)
        final oneDayBefore18 = DateTime(2008, 6, 16);
        expect(Validators.calculateAge(oneDayBefore18, reference), 17);

        // Exactly turning 18 today
        final exactly18Today = DateTime(2008, 6, 15);
        expect(Validators.calculateAge(exactly18Today, reference), 18);
      });

      test('handles leap year birth dates (Feb 29) accurately', () {
        // Born on Feb 29, 2004 (leap year)
        final leapDob = DateTime(2004, 2, 29);

        // Checked on Feb 28, 2024 (non-birthday day)
        expect(Validators.calculateAge(leapDob, DateTime(2024, 2, 28)), 19);

        // Checked on Feb 29, 2024 (leap year 20th birthday)
        expect(Validators.calculateAge(leapDob, DateTime(2024, 2, 29)), 20);

        // Checked on Mar 1, 2024
        expect(Validators.calculateAge(leapDob, DateTime(2024, 3, 1)), 20);
      });

      test('validates age restrictions (18+ requirement)', () {
        final reference = DateTime(2026, 10, 11);

        // 17-year old (minor)
        final minorDob = DateTime(2009, 5, 10);
        expect(Validators.validateDateOfBirth(minorDob, referenceDate: reference), contains('at least 18 years'));

        // Exactly 18 years old
        final adultDob = DateTime(2008, 10, 10);
        expect(Validators.validateDateOfBirth(adultDob, referenceDate: reference), isNull);

        // Future date
        final futureDob = DateTime(2027, 1, 1);
        expect(Validators.validateDateOfBirth(futureDob, referenceDate: reference), contains('cannot be in the future'));

        // Exceeds 120 years
        final tooOldDob = DateTime(1890, 1, 1);
        expect(Validators.validateDateOfBirth(tooOldDob, referenceDate: reference), contains('max 120 years'));
      });
    });
  });
}
