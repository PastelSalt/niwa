import 'package:url_launcher/url_launcher.dart';

/// Public pages and contact (NIWA-PLAN-B-01 B3; approved by the owner
/// 2026-11-04). Same URLs as the web footer.
abstract final class NiwaLinks {
  static const site = 'https://niwa-delta.vercel.app';
  static final Uri privacy = Uri.parse('$site/privacy');
  static final Uri terms = Uri.parse('$site/terms');
  static final Uri appLicence = Uri.parse('$site/eula');
  static final Uri source = Uri.parse('https://github.com/PastelSalt/niwa');
  static const contactEmail = 'zoletakyle.1111@gmail.com';
  static final Uri contact = Uri(scheme: 'mailto', path: contactEmail);
}

/// Opens [uri] in the browser or mail app; false if nothing could open it.
Future<bool> openLink(Uri uri) => launchUrl(
  uri,
  mode: LaunchMode.externalApplication,
).catchError((_) => false);
