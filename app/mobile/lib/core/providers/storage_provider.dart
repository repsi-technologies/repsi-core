import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../storage/secure_storage_service.dart';

/// Overridden in `main()` once SharedPreferences has loaded, so workspace and cached-profile
/// data survive app restarts. Left null in tests that don't need persistence.
final sharedPreferencesProvider = Provider<SharedPreferences?>((ref) => null);

final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService(prefs: ref.watch(sharedPreferencesProvider));
});
