// Form rules matching `packages/contracts/src/auth.ts` (`Email`, `Password`,
// `LoginInput`). Each returns an error message, or null when valid.

final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

String? validateEmail(String? value) {
  final v = value?.trim() ?? '';
  if (v.isEmpty) return 'Enter your email';
  if (v.length > 254 || !_email.hasMatch(v)) return 'Enter a valid email';
  return null;
}

/// Login only needs something to check; the server decides.
String? validateLoginPassword(String? value) {
  final v = value ?? '';
  if (v.isEmpty) return 'Enter your password';
  if (v.length > 256) return 'At most 256 characters';
  return null;
}

String? validateNewPassword(String? value) {
  final v = value ?? '';
  if (v.length < 12) return 'At least 12 characters';
  if (v.length > 256) return 'At most 256 characters';
  return null;
}

String? Function(String?) validateConfirmation(String Function() password) =>
    (value) => value == password() ? null : "Passwords don't match";
