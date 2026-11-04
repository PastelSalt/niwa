/// Where the refresh token lives between launches. The app uses secure
/// storage (Android Keystore / iOS Keychain, MA2.P2); tests use
/// [MemoryRefreshTokenStore].
/// Implementations must never log the token.
abstract interface class RefreshTokenStore {
  Future<String?> read();
  Future<void> write(String? token);
}

class MemoryRefreshTokenStore implements RefreshTokenStore {
  String? _token;

  @override
  Future<String?> read() async => _token;

  @override
  Future<void> write(String? token) async => _token = token;
}
