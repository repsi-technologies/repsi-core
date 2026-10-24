import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_time.dart';

void main() {
  test('offset-less API timestamps are UTC', () {
    final t = parseApiDateTime('2026-10-24T07:15:00')!;
    expect(t.toUtc(), DateTime.utc(2026, 10, 24, 7, 15));
    expect(t.isUtc, isFalse); // returned in device-local time for display
  });

  test('explicit zones are respected', () {
    expect(parseApiDateTime('2026-10-24T07:15:00Z')!.toUtc(), DateTime.utc(2026, 10, 24, 7, 15));
    expect(parseApiDateTime('2026-10-24T12:45:00+05:30')!.toUtc(), DateTime.utc(2026, 10, 24, 7, 15));
  });

  test('calendar dates stay calendar dates; junk is null', () {
    expect(parseApiDateTime('2026-11-27'), DateTime(2026, 11, 27));
    expect(parseApiDateTime(null), isNull);
    expect(parseApiDateTime(''), isNull);
    expect(parseApiDateTime('not a date'), isNull);
  });
}
