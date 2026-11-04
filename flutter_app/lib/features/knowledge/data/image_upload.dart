import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/knowledge/data/uploads_repository.dart';

/// Contract limits (packages/contracts/src/attachment.ts).
const allowedImageMime = {'image/png', 'image/jpeg', 'image/webp', 'image/gif'};
const int maxImageBytes = 10 * 1024 * 1024;

class UploadError implements Exception {
  const new(this.message);

  final String message;

  @override
  String toString() => message;
}

/// An image the user picked, ready to upload.
class PickedImage {
  const new({required this.bytes, required this.name, required this.mime});

  final Uint8List bytes;
  final String name;
  final String mime;
}

String _mimeFromName(String name) =>
    switch (name.toLowerCase().split('.').last) {
      'png' => 'image/png',
      'jpg' || 'jpeg' => 'image/jpeg',
      'webp' => 'image/webp',
      'gif' => 'image/gif',
      _ => 'application/octet-stream',
    };

/// Camera / gallery access; tests override it.
abstract interface class ImagePickerPort {
  Future<PickedImage?> pick(ImageSource source);
}

class DeviceImagePicker implements ImagePickerPort {
  final _picker = ImagePicker();

  @override
  Future<PickedImage?> pick(ImageSource source) async {
    // Downscaled on the phone so camera shots stay under the 10 MB limit.
    final file = await _picker.pickImage(
      source: source,
      maxWidth: 2560,
      maxHeight: 2560,
      imageQuality: 85,
    );
    if (file == null) return null;
    return PickedImage(
      bytes: await file.readAsBytes(),
      name: file.name,
      mime: file.mimeType ?? _mimeFromName(file.name),
    );
  }
}

final imagePickerProvider = Provider<ImagePickerPort>(
  (ref) => DeviceImagePicker(),
);

/// Plain Dio for Cloudinary (absolute upload URL, no NIWA auth headers).
final cloudinaryDioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(receiveTimeout: const Duration(seconds: 60)));
  ref.onDispose(dio.close);
  return dio;
});

/// Whether this server takes images (Cloudinary configured).
final uploadConfigProvider = FutureProvider<UploadConfigResponse>(
  (ref) => ref.watch(uploadsRepositoryProvider).config(),
);

void checkImage(PickedImage image) {
  if (!allowedImageMime.contains(image.mime)) {
    throw const UploadError(
      'Only PNG, JPEG, WebP and GIF images can be added.',
    );
  }
  if (image.bytes.length > maxImageBytes) {
    throw const UploadError('Images can be at most 10 MB.');
  }
}

/// Cloudinary delivery URL with automatic format and quality (web
/// `deliveryUrl`) — what the note stores as `src`.
String deliveryUrl(String secureUrl) => secureUrl.contains('/upload/f_auto')
    ? secureUrl
    : secureUrl.replaceFirst('/upload/', '/upload/f_auto,q_auto/');

/// A Cloudinary transformation path segment, e.g. `f_auto,q_auto`.
final _transformation = RegExp(r'^[a-z]{1,3}_[^/,]+(,[a-z]{1,3}_[^/,]+)*$');

/// For display only: a Cloudinary image resized to about [widthPx]
/// (rounded up to 360-px steps so the phone's cache gets hits).
String phoneImageUrl(String src, double widthPx) {
  if (!src.contains('res.cloudinary.com') || !src.contains('/upload/')) {
    return src;
  }
  final w = ((widthPx / 360).ceil() * 360).clamp(360, 2160);
  final i = src.indexOf('/upload/') + '/upload/'.length;
  // Chained after the stored transformation (f_auto,q_auto/…).
  final rest = src.substring(i);
  final slash = rest.indexOf('/');
  final first = slash < 0 ? '' : rest.substring(0, slash);
  final hasTransform = _transformation.hasMatch(first);
  return hasTransform
      ? '${src.substring(0, i)}$first/w_$w,c_limit${rest.substring(slash)}'
      : '${src.substring(0, i)}w_$w,c_limit/$rest';
}

/// Default alt text from the file name ("bgp-path_selection.png" →
/// "bgp path selection").
String altFromName(String name) {
  final s = name
      .replaceFirst(RegExp(r'\.[a-z0-9]+$', caseSensitive: false), '')
      .replaceAll(RegExp('[-_]+'), ' ')
      .trim();
  return s.length > 120 ? s.substring(0, 120) : s;
}

/// The signed upload (DATA_MODEL.md §8, port of web `uploadImage`): the
/// server signs, the phone sends the file straight to Cloudinary, then the
/// server verifies and records it. The API secret never reaches the phone.
Future<({Attachment attachment, String src})> uploadImage({
  required UploadsRepository uploads,
  required Dio cloudinary,
  required String itemId,
  required PickedImage image,
}) async {
  checkImage(image);
  final sig = await uploads.sign(itemId);
  final form = FormData.fromMap({
    'file': MultipartFile.fromBytes(
      image.bytes,
      filename: image.name,
      contentType: DioMediaType.parse(image.mime),
    ),
    'api_key': sig.apiKey,
    'timestamp': '${sig.timestamp}',
    'signature': sig.signature,
    'folder': sig.folder,
    'public_id': sig.publicId,
    'tags': sig.tags,
    'allowed_formats': sig.allowedFormats,
  });
  Response<Object?> res;
  try {
    res = await cloudinary.post<Object?>(
      sig.uploadUrl,
      data: form,
      options: Options(validateStatus: (_) => true),
    );
  } on DioException {
    throw const OfflineException("Couldn't reach the image service.");
  }
  final body = res.data;
  final publicId = body is Map ? body['public_id'] : null;
  if ((res.statusCode ?? 0) >= 300 || publicId is! String) {
    final error = body is Map && body['error'] is Map
        ? (body['error'] as Map)['message']
        : null;
    throw UploadError(
      error is String ? error : 'Upload failed (HTTP ${res.statusCode}).',
    );
  }
  try {
    final attachment = await uploads.confirm(
      itemId: itemId,
      publicId: publicId,
    );
    return (attachment: attachment, src: deliveryUrl(attachment.secureUrl));
  } on ApiException catch (e) {
    throw UploadError(e.message);
  }
}
