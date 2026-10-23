import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../api/api_client.dart';
import 'storage_provider.dart';

final Provider<ApiClient> apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageServiceProvider);
  return ApiClient(
    storage: storage,
    // Read lazily: the auth notifier itself depends on this client.
    onSessionExpired: () => ref.read(authProvider.notifier).expireSession(),
  );
});
