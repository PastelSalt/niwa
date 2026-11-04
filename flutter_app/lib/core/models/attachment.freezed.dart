// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attachment.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Attachment {

 String get id; String get itemId; String get cloudinaryPublicId; String get secureUrl;@JsonKey(unknownEnumValue: AttachmentMime.unknown) AttachmentMime get mime; int get size; DateTime get createdAt;
/// Create a copy of Attachment
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AttachmentCopyWith<Attachment> get copyWith => _$AttachmentCopyWithImpl<Attachment>(this as Attachment, _$identity);

  /// Serializes this Attachment to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Attachment;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Attachment&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.itemId, _this.itemId) || other.itemId == _this.itemId)&&(identical(other.cloudinaryPublicId, _this.cloudinaryPublicId) || other.cloudinaryPublicId == _this.cloudinaryPublicId)&&(identical(other.secureUrl, _this.secureUrl) || other.secureUrl == _this.secureUrl)&&(identical(other.mime, _this.mime) || other.mime == _this.mime)&&(identical(other.size, _this.size) || other.size == _this.size)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Attachment;
  return Object.hash(runtimeType,_this.id,_this.itemId,_this.cloudinaryPublicId,_this.secureUrl,_this.mime,_this.size,_this.createdAt);
}

@override
String toString() {
  final _this = this as Attachment;
  return 'Attachment(id: ${_this.id}, itemId: ${_this.itemId}, cloudinaryPublicId: ${_this.cloudinaryPublicId}, secureUrl: ${_this.secureUrl}, mime: ${_this.mime}, size: ${_this.size}, createdAt: ${_this.createdAt})';
}


}

/// @nodoc
abstract mixin class $AttachmentCopyWith<$Res>  {
  factory $AttachmentCopyWith(Attachment value, $Res Function(Attachment) _then) = _$AttachmentCopyWithImpl;
@useResult
$Res call({
 String id, String itemId, String cloudinaryPublicId, String secureUrl,@JsonKey(unknownEnumValue: AttachmentMime.unknown) AttachmentMime mime, int size, DateTime createdAt
});




}
/// @nodoc
class _$AttachmentCopyWithImpl<$Res>
    implements $AttachmentCopyWith<$Res> {
  _$AttachmentCopyWithImpl(this._self, this._then);

  final Attachment _self;
  final $Res Function(Attachment) _then;

/// Create a copy of Attachment
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? itemId = null,Object? cloudinaryPublicId = null,Object? secureUrl = null,Object? mime = null,Object? size = null,Object? createdAt = null,}) {
  return _then(Attachment(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,itemId: null == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String,cloudinaryPublicId: null == cloudinaryPublicId ? _self.cloudinaryPublicId : cloudinaryPublicId // ignore: cast_nullable_to_non_nullable
as String,secureUrl: null == secureUrl ? _self.secureUrl : secureUrl // ignore: cast_nullable_to_non_nullable
as String,mime: null == mime ? _self.mime : mime // ignore: cast_nullable_to_non_nullable
as AttachmentMime,size: null == size ? _self.size : size // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [Attachment].
extension AttachmentPatterns on Attachment {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Attachment value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Attachment() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Attachment value)  $default,){
final _that = this;
switch (_that) {
case _Attachment():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Attachment value)?  $default,){
final _that = this;
switch (_that) {
case _Attachment() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String itemId,  String cloudinaryPublicId,  String secureUrl, @JsonKey(unknownEnumValue: AttachmentMime.unknown)  AttachmentMime mime,  int size,  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Attachment() when $default != null:
return $default(_that.id,_that.itemId,_that.cloudinaryPublicId,_that.secureUrl,_that.mime,_that.size,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String itemId,  String cloudinaryPublicId,  String secureUrl, @JsonKey(unknownEnumValue: AttachmentMime.unknown)  AttachmentMime mime,  int size,  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _Attachment():
return $default(_that.id,_that.itemId,_that.cloudinaryPublicId,_that.secureUrl,_that.mime,_that.size,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String itemId,  String cloudinaryPublicId,  String secureUrl, @JsonKey(unknownEnumValue: AttachmentMime.unknown)  AttachmentMime mime,  int size,  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _Attachment() when $default != null:
return $default(_that.id,_that.itemId,_that.cloudinaryPublicId,_that.secureUrl,_that.mime,_that.size,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Attachment implements Attachment {
  const _Attachment({required this.id, required this.itemId, required this.cloudinaryPublicId, required this.secureUrl, @JsonKey(unknownEnumValue: AttachmentMime.unknown) required this.mime, required this.size, required this.createdAt});
  factory _Attachment.fromJson(Map<String, dynamic> json) => _$AttachmentFromJson(json);

@override final  String id;
@override final  String itemId;
@override final  String cloudinaryPublicId;
@override final  String secureUrl;
@override@JsonKey(unknownEnumValue: AttachmentMime.unknown) final  AttachmentMime mime;
@override final  int size;
@override final  DateTime createdAt;

/// Create a copy of Attachment
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AttachmentCopyWith<_Attachment> get copyWith => __$AttachmentCopyWithImpl<_Attachment>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AttachmentToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Attachment&&(identical(other.id, id) || other.id == id)&&(identical(other.itemId, itemId) || other.itemId == itemId)&&(identical(other.cloudinaryPublicId, cloudinaryPublicId) || other.cloudinaryPublicId == cloudinaryPublicId)&&(identical(other.secureUrl, secureUrl) || other.secureUrl == secureUrl)&&(identical(other.mime, mime) || other.mime == mime)&&(identical(other.size, size) || other.size == size)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,itemId,cloudinaryPublicId,secureUrl,mime,size,createdAt);
}

@override
String toString() {
    return 'Attachment(id: $id, itemId: $itemId, cloudinaryPublicId: $cloudinaryPublicId, secureUrl: $secureUrl, mime: $mime, size: $size, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$AttachmentCopyWith<$Res> implements $AttachmentCopyWith<$Res> {
  factory _$AttachmentCopyWith(_Attachment value, $Res Function(_Attachment) _then) = __$AttachmentCopyWithImpl;
@override @useResult
$Res call({
 String id, String itemId, String cloudinaryPublicId, String secureUrl,@JsonKey(unknownEnumValue: AttachmentMime.unknown) AttachmentMime mime, int size, DateTime createdAt
});




}
/// @nodoc
class __$AttachmentCopyWithImpl<$Res>
    implements _$AttachmentCopyWith<$Res> {
  __$AttachmentCopyWithImpl(this._self, this._then);

  final _Attachment _self;
  final $Res Function(_Attachment) _then;

/// Create a copy of Attachment
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? itemId = null,Object? cloudinaryPublicId = null,Object? secureUrl = null,Object? mime = null,Object? size = null,Object? createdAt = null,}) {
  return _then(_Attachment(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,itemId: null == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String,cloudinaryPublicId: null == cloudinaryPublicId ? _self.cloudinaryPublicId : cloudinaryPublicId // ignore: cast_nullable_to_non_nullable
as String,secureUrl: null == secureUrl ? _self.secureUrl : secureUrl // ignore: cast_nullable_to_non_nullable
as String,mime: null == mime ? _self.mime : mime // ignore: cast_nullable_to_non_nullable
as AttachmentMime,size: null == size ? _self.size : size // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$UploadConfigResponse {

 bool get enabled; int get maxBytes; List<String> get allowedMime;
/// Create a copy of UploadConfigResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UploadConfigResponseCopyWith<UploadConfigResponse> get copyWith => _$UploadConfigResponseCopyWithImpl<UploadConfigResponse>(this as UploadConfigResponse, _$identity);

  /// Serializes this UploadConfigResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as UploadConfigResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UploadConfigResponse&&(identical(other.enabled, _this.enabled) || other.enabled == _this.enabled)&&(identical(other.maxBytes, _this.maxBytes) || other.maxBytes == _this.maxBytes)&&const DeepCollectionEquality().equals(other.allowedMime, _this.allowedMime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as UploadConfigResponse;
  return Object.hash(runtimeType,_this.enabled,_this.maxBytes,const DeepCollectionEquality().hash(_this.allowedMime));
}

@override
String toString() {
  final _this = this as UploadConfigResponse;
  return 'UploadConfigResponse(enabled: ${_this.enabled}, maxBytes: ${_this.maxBytes}, allowedMime: ${_this.allowedMime})';
}


}

/// @nodoc
abstract mixin class $UploadConfigResponseCopyWith<$Res>  {
  factory $UploadConfigResponseCopyWith(UploadConfigResponse value, $Res Function(UploadConfigResponse) _then) = _$UploadConfigResponseCopyWithImpl;
@useResult
$Res call({
 bool enabled, int maxBytes, List<String> allowedMime
});




}
/// @nodoc
class _$UploadConfigResponseCopyWithImpl<$Res>
    implements $UploadConfigResponseCopyWith<$Res> {
  _$UploadConfigResponseCopyWithImpl(this._self, this._then);

  final UploadConfigResponse _self;
  final $Res Function(UploadConfigResponse) _then;

/// Create a copy of UploadConfigResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? enabled = null,Object? maxBytes = null,Object? allowedMime = null,}) {
  return _then(UploadConfigResponse(
enabled: null == enabled ? _self.enabled : enabled // ignore: cast_nullable_to_non_nullable
as bool,maxBytes: null == maxBytes ? _self.maxBytes : maxBytes // ignore: cast_nullable_to_non_nullable
as int,allowedMime: null == allowedMime ? _self.allowedMime : allowedMime // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [UploadConfigResponse].
extension UploadConfigResponsePatterns on UploadConfigResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _UploadConfigResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _UploadConfigResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _UploadConfigResponse value)  $default,){
final _that = this;
switch (_that) {
case _UploadConfigResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _UploadConfigResponse value)?  $default,){
final _that = this;
switch (_that) {
case _UploadConfigResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool enabled,  int maxBytes,  List<String> allowedMime)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _UploadConfigResponse() when $default != null:
return $default(_that.enabled,_that.maxBytes,_that.allowedMime);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool enabled,  int maxBytes,  List<String> allowedMime)  $default,) {final _that = this;
switch (_that) {
case _UploadConfigResponse():
return $default(_that.enabled,_that.maxBytes,_that.allowedMime);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool enabled,  int maxBytes,  List<String> allowedMime)?  $default,) {final _that = this;
switch (_that) {
case _UploadConfigResponse() when $default != null:
return $default(_that.enabled,_that.maxBytes,_that.allowedMime);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _UploadConfigResponse implements UploadConfigResponse {
  const _UploadConfigResponse({required this.enabled, required this.maxBytes, required  List<String> allowedMime}): _allowedMime = allowedMime;
  factory _UploadConfigResponse.fromJson(Map<String, dynamic> json) => _$UploadConfigResponseFromJson(json);

@override final  bool enabled;
@override final  int maxBytes;
 final  List<String> _allowedMime;
@override List<String> get allowedMime {
  if (_allowedMime is EqualUnmodifiableListView) return _allowedMime;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_allowedMime);
}


/// Create a copy of UploadConfigResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UploadConfigResponseCopyWith<_UploadConfigResponse> get copyWith => __$UploadConfigResponseCopyWithImpl<_UploadConfigResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UploadConfigResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _UploadConfigResponse&&(identical(other.enabled, enabled) || other.enabled == enabled)&&(identical(other.maxBytes, maxBytes) || other.maxBytes == maxBytes)&&const DeepCollectionEquality().equals(other.allowedMime, _allowedMime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,enabled,maxBytes,const DeepCollectionEquality().hash(_allowedMime));
}

@override
String toString() {
    return 'UploadConfigResponse(enabled: $enabled, maxBytes: $maxBytes, allowedMime: $allowedMime)';
}


}

/// @nodoc
abstract mixin class _$UploadConfigResponseCopyWith<$Res> implements $UploadConfigResponseCopyWith<$Res> {
  factory _$UploadConfigResponseCopyWith(_UploadConfigResponse value, $Res Function(_UploadConfigResponse) _then) = __$UploadConfigResponseCopyWithImpl;
@override @useResult
$Res call({
 bool enabled, int maxBytes, List<String> allowedMime
});




}
/// @nodoc
class __$UploadConfigResponseCopyWithImpl<$Res>
    implements _$UploadConfigResponseCopyWith<$Res> {
  __$UploadConfigResponseCopyWithImpl(this._self, this._then);

  final _UploadConfigResponse _self;
  final $Res Function(_UploadConfigResponse) _then;

/// Create a copy of UploadConfigResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? enabled = null,Object? maxBytes = null,Object? allowedMime = null,}) {
  return _then(_UploadConfigResponse(
enabled: null == enabled ? _self.enabled : enabled // ignore: cast_nullable_to_non_nullable
as bool,maxBytes: null == maxBytes ? _self.maxBytes : maxBytes // ignore: cast_nullable_to_non_nullable
as int,allowedMime: null == allowedMime ? _self._allowedMime : allowedMime // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}


/// @nodoc
mixin _$UploadSignatureResponse {

 String get cloudName;/// Public Cloudinary API key (not the secret).
 String get apiKey; int get timestamp; String get signature; String get folder; String get publicId; String get tags; String get allowedFormats; String get uploadUrl;
/// Create a copy of UploadSignatureResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UploadSignatureResponseCopyWith<UploadSignatureResponse> get copyWith => _$UploadSignatureResponseCopyWithImpl<UploadSignatureResponse>(this as UploadSignatureResponse, _$identity);

  /// Serializes this UploadSignatureResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as UploadSignatureResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UploadSignatureResponse&&(identical(other.cloudName, _this.cloudName) || other.cloudName == _this.cloudName)&&(identical(other.apiKey, _this.apiKey) || other.apiKey == _this.apiKey)&&(identical(other.timestamp, _this.timestamp) || other.timestamp == _this.timestamp)&&(identical(other.signature, _this.signature) || other.signature == _this.signature)&&(identical(other.folder, _this.folder) || other.folder == _this.folder)&&(identical(other.publicId, _this.publicId) || other.publicId == _this.publicId)&&(identical(other.tags, _this.tags) || other.tags == _this.tags)&&(identical(other.allowedFormats, _this.allowedFormats) || other.allowedFormats == _this.allowedFormats)&&(identical(other.uploadUrl, _this.uploadUrl) || other.uploadUrl == _this.uploadUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as UploadSignatureResponse;
  return Object.hash(runtimeType,_this.cloudName,_this.apiKey,_this.timestamp,_this.signature,_this.folder,_this.publicId,_this.tags,_this.allowedFormats,_this.uploadUrl);
}

@override
String toString() {
  final _this = this as UploadSignatureResponse;
  return 'UploadSignatureResponse(cloudName: ${_this.cloudName}, apiKey: ${_this.apiKey}, timestamp: ${_this.timestamp}, signature: ${_this.signature}, folder: ${_this.folder}, publicId: ${_this.publicId}, tags: ${_this.tags}, allowedFormats: ${_this.allowedFormats}, uploadUrl: ${_this.uploadUrl})';
}


}

/// @nodoc
abstract mixin class $UploadSignatureResponseCopyWith<$Res>  {
  factory $UploadSignatureResponseCopyWith(UploadSignatureResponse value, $Res Function(UploadSignatureResponse) _then) = _$UploadSignatureResponseCopyWithImpl;
@useResult
$Res call({
 String cloudName, String apiKey, int timestamp, String signature, String folder, String publicId, String tags, String allowedFormats, String uploadUrl
});




}
/// @nodoc
class _$UploadSignatureResponseCopyWithImpl<$Res>
    implements $UploadSignatureResponseCopyWith<$Res> {
  _$UploadSignatureResponseCopyWithImpl(this._self, this._then);

  final UploadSignatureResponse _self;
  final $Res Function(UploadSignatureResponse) _then;

/// Create a copy of UploadSignatureResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? cloudName = null,Object? apiKey = null,Object? timestamp = null,Object? signature = null,Object? folder = null,Object? publicId = null,Object? tags = null,Object? allowedFormats = null,Object? uploadUrl = null,}) {
  return _then(UploadSignatureResponse(
cloudName: null == cloudName ? _self.cloudName : cloudName // ignore: cast_nullable_to_non_nullable
as String,apiKey: null == apiKey ? _self.apiKey : apiKey // ignore: cast_nullable_to_non_nullable
as String,timestamp: null == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as int,signature: null == signature ? _self.signature : signature // ignore: cast_nullable_to_non_nullable
as String,folder: null == folder ? _self.folder : folder // ignore: cast_nullable_to_non_nullable
as String,publicId: null == publicId ? _self.publicId : publicId // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as String,allowedFormats: null == allowedFormats ? _self.allowedFormats : allowedFormats // ignore: cast_nullable_to_non_nullable
as String,uploadUrl: null == uploadUrl ? _self.uploadUrl : uploadUrl // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [UploadSignatureResponse].
extension UploadSignatureResponsePatterns on UploadSignatureResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _UploadSignatureResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _UploadSignatureResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _UploadSignatureResponse value)  $default,){
final _that = this;
switch (_that) {
case _UploadSignatureResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _UploadSignatureResponse value)?  $default,){
final _that = this;
switch (_that) {
case _UploadSignatureResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String cloudName,  String apiKey,  int timestamp,  String signature,  String folder,  String publicId,  String tags,  String allowedFormats,  String uploadUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _UploadSignatureResponse() when $default != null:
return $default(_that.cloudName,_that.apiKey,_that.timestamp,_that.signature,_that.folder,_that.publicId,_that.tags,_that.allowedFormats,_that.uploadUrl);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String cloudName,  String apiKey,  int timestamp,  String signature,  String folder,  String publicId,  String tags,  String allowedFormats,  String uploadUrl)  $default,) {final _that = this;
switch (_that) {
case _UploadSignatureResponse():
return $default(_that.cloudName,_that.apiKey,_that.timestamp,_that.signature,_that.folder,_that.publicId,_that.tags,_that.allowedFormats,_that.uploadUrl);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String cloudName,  String apiKey,  int timestamp,  String signature,  String folder,  String publicId,  String tags,  String allowedFormats,  String uploadUrl)?  $default,) {final _that = this;
switch (_that) {
case _UploadSignatureResponse() when $default != null:
return $default(_that.cloudName,_that.apiKey,_that.timestamp,_that.signature,_that.folder,_that.publicId,_that.tags,_that.allowedFormats,_that.uploadUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _UploadSignatureResponse implements UploadSignatureResponse {
  const _UploadSignatureResponse({required this.cloudName, required this.apiKey, required this.timestamp, required this.signature, required this.folder, required this.publicId, required this.tags, required this.allowedFormats, required this.uploadUrl});
  factory _UploadSignatureResponse.fromJson(Map<String, dynamic> json) => _$UploadSignatureResponseFromJson(json);

@override final  String cloudName;
/// Public Cloudinary API key (not the secret).
@override final  String apiKey;
@override final  int timestamp;
@override final  String signature;
@override final  String folder;
@override final  String publicId;
@override final  String tags;
@override final  String allowedFormats;
@override final  String uploadUrl;

/// Create a copy of UploadSignatureResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UploadSignatureResponseCopyWith<_UploadSignatureResponse> get copyWith => __$UploadSignatureResponseCopyWithImpl<_UploadSignatureResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UploadSignatureResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _UploadSignatureResponse&&(identical(other.cloudName, cloudName) || other.cloudName == cloudName)&&(identical(other.apiKey, apiKey) || other.apiKey == apiKey)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp)&&(identical(other.signature, signature) || other.signature == signature)&&(identical(other.folder, folder) || other.folder == folder)&&(identical(other.publicId, publicId) || other.publicId == publicId)&&(identical(other.tags, tags) || other.tags == tags)&&(identical(other.allowedFormats, allowedFormats) || other.allowedFormats == allowedFormats)&&(identical(other.uploadUrl, uploadUrl) || other.uploadUrl == uploadUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,cloudName,apiKey,timestamp,signature,folder,publicId,tags,allowedFormats,uploadUrl);
}

@override
String toString() {
    return 'UploadSignatureResponse(cloudName: $cloudName, apiKey: $apiKey, timestamp: $timestamp, signature: $signature, folder: $folder, publicId: $publicId, tags: $tags, allowedFormats: $allowedFormats, uploadUrl: $uploadUrl)';
}


}

/// @nodoc
abstract mixin class _$UploadSignatureResponseCopyWith<$Res> implements $UploadSignatureResponseCopyWith<$Res> {
  factory _$UploadSignatureResponseCopyWith(_UploadSignatureResponse value, $Res Function(_UploadSignatureResponse) _then) = __$UploadSignatureResponseCopyWithImpl;
@override @useResult
$Res call({
 String cloudName, String apiKey, int timestamp, String signature, String folder, String publicId, String tags, String allowedFormats, String uploadUrl
});




}
/// @nodoc
class __$UploadSignatureResponseCopyWithImpl<$Res>
    implements _$UploadSignatureResponseCopyWith<$Res> {
  __$UploadSignatureResponseCopyWithImpl(this._self, this._then);

  final _UploadSignatureResponse _self;
  final $Res Function(_UploadSignatureResponse) _then;

/// Create a copy of UploadSignatureResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? cloudName = null,Object? apiKey = null,Object? timestamp = null,Object? signature = null,Object? folder = null,Object? publicId = null,Object? tags = null,Object? allowedFormats = null,Object? uploadUrl = null,}) {
  return _then(_UploadSignatureResponse(
cloudName: null == cloudName ? _self.cloudName : cloudName // ignore: cast_nullable_to_non_nullable
as String,apiKey: null == apiKey ? _self.apiKey : apiKey // ignore: cast_nullable_to_non_nullable
as String,timestamp: null == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as int,signature: null == signature ? _self.signature : signature // ignore: cast_nullable_to_non_nullable
as String,folder: null == folder ? _self.folder : folder // ignore: cast_nullable_to_non_nullable
as String,publicId: null == publicId ? _self.publicId : publicId // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as String,allowedFormats: null == allowedFormats ? _self.allowedFormats : allowedFormats // ignore: cast_nullable_to_non_nullable
as String,uploadUrl: null == uploadUrl ? _self.uploadUrl : uploadUrl // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
