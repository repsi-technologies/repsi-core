/// Timestamps from the API are UTC. Columns are timezone-naive, so many arrive without a `Z` or
/// offset (e.g. `2026-10-24T07:15:00`); `DateTime.parse` would read those as device-local time and
/// shift every time by the device's UTC offset. This reads them as UTC and returns local time.
DateTime? parseApiDateTime(Object? value) {
  if (value == null) return null;
  final raw = value.toString().trim();
  if (raw.isEmpty) return null;
  // Date-only values (yyyy-MM-dd) are calendar dates, not instants.
  if (raw.length <= 10) return DateTime.tryParse(raw);
  final hasZone = raw.endsWith('Z') || RegExp(r'[+-]\d{2}:?\d{2}$').hasMatch(raw);
  return DateTime.tryParse(hasZone ? raw : '${raw}Z')?.toLocal();
}
