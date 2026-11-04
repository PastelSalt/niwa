import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:niwa/core/api/refresh_token_store.dart';

/// Refresh token in Android Keystore-backed storage / the iOS Keychain
/// (specs §12.1). Device-only on iOS: never synced to iCloud or restored to
/// another phone, so a backup can't carry a live session.
class SecureRefreshTokenStore implements RefreshTokenStore {
  const new([this._storage = const FlutterSecureStorage(iOptions: _ios)]);

  static const _key = 'niwa.refreshToken';
  static const _ios = IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  );

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read() => _storage.read(key: _key);

  @override
  Future<void> write(String? token) => token == null
      ? _storage.delete(key: _key)
      : _storage.write(key: _key, value: token);
}
