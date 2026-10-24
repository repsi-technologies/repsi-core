import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../l10n/l10n.dart';
/// Build-time configuration. Prefer `--dart-define` (see docs/mobile-release.md); the bundled
/// `assets/.env` only supplies defaults and must never hold secrets.
class AppConfig {
  static const String appName = 'REPSI';
  static String get appTagline => L10n.current.appTagline;
  static const String defaultWorkspaceSlug = 'apex-fitness';

  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _productionBaseUrl = 'https://api.repsi.app/api/v1';

  static String get baseUrl {
    if (_definedBaseUrl.isNotEmpty) return _normalize(_definedBaseUrl);
    if (dotenv.isInitialized) {
      final envUrl = dotenv.env['API_BASE_URL'];
      if (envUrl != null && envUrl.isNotEmpty) return _normalize(envUrl);
    }
    return _productionBaseUrl;
  }

  /// Release builds refuse cleartext transport; debug builds may talk to a local server.
  static String _normalize(String url) {
    final trimmed = url.trim().replaceAll(RegExp(r'/+$'), '');
    if (kReleaseMode && !trimmed.startsWith('https://')) {
      return _productionBaseUrl;
    }
    return trimmed;
  }

  /// Absolute URL for media the API returns. Cloudinary URLs are already absolute; files served by
  /// the API itself come back as paths (`/api/v1/...`) and are resolved against the API origin.
  static String? resolveMediaUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!url.startsWith('/')) return null;
    final origin = Uri.parse(baseUrl);
    return origin.replace(path: url, query: null).toString();
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
