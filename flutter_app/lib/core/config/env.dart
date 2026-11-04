/// Build-time configuration, set with `--dart-define` (see `flutter_app/README.md`).
enum AppEnv {
  local,
  staging,
  prod;

  static AppEnv parse(String value) => AppEnv.values.firstWhere(
    (e) => e.name == value,
    orElse: () => AppEnv.local,
  );
}

abstract final class Env {
  static final AppEnv appEnv = AppEnv.parse(
    const String.fromEnvironment('APP_ENV', defaultValue: 'local'),
  );

  /// API root including `/api/v1`. The default reaches the host machine from the Android emulator.
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );
}
