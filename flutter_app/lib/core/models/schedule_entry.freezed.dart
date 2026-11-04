// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'schedule_entry.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ScheduleEntry {

 String get id;@JsonKey(unknownEnumValue: ScheduleKind.unknown) ScheduleKind get kind; String? get itemId; String get title; DateTime get startAt; DateTime get endAt; bool get isAllDay; String? get color;@JsonKey(unknownEnumValue: Recurrence.unknown) Recurrence get recurrence; String? get seriesId; int? get seriesIndex; DateTime get createdAt; DateTime get updatedAt;
/// Create a copy of ScheduleEntry
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ScheduleEntryCopyWith<ScheduleEntry> get copyWith => _$ScheduleEntryCopyWithImpl<ScheduleEntry>(this as ScheduleEntry, _$identity);

  /// Serializes this ScheduleEntry to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ScheduleEntry;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ScheduleEntry&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.itemId, _this.itemId) || other.itemId == _this.itemId)&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.startAt, _this.startAt) || other.startAt == _this.startAt)&&(identical(other.endAt, _this.endAt) || other.endAt == _this.endAt)&&(identical(other.isAllDay, _this.isAllDay) || other.isAllDay == _this.isAllDay)&&(identical(other.color, _this.color) || other.color == _this.color)&&(identical(other.recurrence, _this.recurrence) || other.recurrence == _this.recurrence)&&(identical(other.seriesId, _this.seriesId) || other.seriesId == _this.seriesId)&&(identical(other.seriesIndex, _this.seriesIndex) || other.seriesIndex == _this.seriesIndex)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&(identical(other.updatedAt, _this.updatedAt) || other.updatedAt == _this.updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ScheduleEntry;
  return Object.hash(runtimeType,_this.id,_this.kind,_this.itemId,_this.title,_this.startAt,_this.endAt,_this.isAllDay,_this.color,_this.recurrence,_this.seriesId,_this.seriesIndex,_this.createdAt,_this.updatedAt);
}

@override
String toString() {
  final _this = this as ScheduleEntry;
  return 'ScheduleEntry(id: ${_this.id}, kind: ${_this.kind}, itemId: ${_this.itemId}, title: ${_this.title}, startAt: ${_this.startAt}, endAt: ${_this.endAt}, isAllDay: ${_this.isAllDay}, color: ${_this.color}, recurrence: ${_this.recurrence}, seriesId: ${_this.seriesId}, seriesIndex: ${_this.seriesIndex}, createdAt: ${_this.createdAt}, updatedAt: ${_this.updatedAt})';
}


}

/// @nodoc
abstract mixin class $ScheduleEntryCopyWith<$Res>  {
  factory $ScheduleEntryCopyWith(ScheduleEntry value, $Res Function(ScheduleEntry) _then) = _$ScheduleEntryCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(unknownEnumValue: ScheduleKind.unknown) ScheduleKind kind, String? itemId, String title, DateTime startAt, DateTime endAt, bool isAllDay, String? color,@JsonKey(unknownEnumValue: Recurrence.unknown) Recurrence recurrence, String? seriesId, int? seriesIndex, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class _$ScheduleEntryCopyWithImpl<$Res>
    implements $ScheduleEntryCopyWith<$Res> {
  _$ScheduleEntryCopyWithImpl(this._self, this._then);

  final ScheduleEntry _self;
  final $Res Function(ScheduleEntry) _then;

/// Create a copy of ScheduleEntry
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? kind = null,Object? itemId = freezed,Object? title = null,Object? startAt = null,Object? endAt = null,Object? isAllDay = null,Object? color = freezed,Object? recurrence = null,Object? seriesId = freezed,Object? seriesIndex = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(ScheduleEntry(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ScheduleKind,itemId: freezed == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,startAt: null == startAt ? _self.startAt : startAt // ignore: cast_nullable_to_non_nullable
as DateTime,endAt: null == endAt ? _self.endAt : endAt // ignore: cast_nullable_to_non_nullable
as DateTime,isAllDay: null == isAllDay ? _self.isAllDay : isAllDay // ignore: cast_nullable_to_non_nullable
as bool,color: freezed == color ? _self.color : color // ignore: cast_nullable_to_non_nullable
as String?,recurrence: null == recurrence ? _self.recurrence : recurrence // ignore: cast_nullable_to_non_nullable
as Recurrence,seriesId: freezed == seriesId ? _self.seriesId : seriesId // ignore: cast_nullable_to_non_nullable
as String?,seriesIndex: freezed == seriesIndex ? _self.seriesIndex : seriesIndex // ignore: cast_nullable_to_non_nullable
as int?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [ScheduleEntry].
extension ScheduleEntryPatterns on ScheduleEntry {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ScheduleEntry value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ScheduleEntry() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ScheduleEntry value)  $default,){
final _that = this;
switch (_that) {
case _ScheduleEntry():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ScheduleEntry value)?  $default,){
final _that = this;
switch (_that) {
case _ScheduleEntry() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(unknownEnumValue: ScheduleKind.unknown)  ScheduleKind kind,  String? itemId,  String title,  DateTime startAt,  DateTime endAt,  bool isAllDay,  String? color, @JsonKey(unknownEnumValue: Recurrence.unknown)  Recurrence recurrence,  String? seriesId,  int? seriesIndex,  DateTime createdAt,  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ScheduleEntry() when $default != null:
return $default(_that.id,_that.kind,_that.itemId,_that.title,_that.startAt,_that.endAt,_that.isAllDay,_that.color,_that.recurrence,_that.seriesId,_that.seriesIndex,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(unknownEnumValue: ScheduleKind.unknown)  ScheduleKind kind,  String? itemId,  String title,  DateTime startAt,  DateTime endAt,  bool isAllDay,  String? color, @JsonKey(unknownEnumValue: Recurrence.unknown)  Recurrence recurrence,  String? seriesId,  int? seriesIndex,  DateTime createdAt,  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _ScheduleEntry():
return $default(_that.id,_that.kind,_that.itemId,_that.title,_that.startAt,_that.endAt,_that.isAllDay,_that.color,_that.recurrence,_that.seriesId,_that.seriesIndex,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(unknownEnumValue: ScheduleKind.unknown)  ScheduleKind kind,  String? itemId,  String title,  DateTime startAt,  DateTime endAt,  bool isAllDay,  String? color, @JsonKey(unknownEnumValue: Recurrence.unknown)  Recurrence recurrence,  String? seriesId,  int? seriesIndex,  DateTime createdAt,  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _ScheduleEntry() when $default != null:
return $default(_that.id,_that.kind,_that.itemId,_that.title,_that.startAt,_that.endAt,_that.isAllDay,_that.color,_that.recurrence,_that.seriesId,_that.seriesIndex,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ScheduleEntry implements ScheduleEntry {
  const _ScheduleEntry({required this.id, @JsonKey(unknownEnumValue: ScheduleKind.unknown) required this.kind, required this.itemId, required this.title, required this.startAt, required this.endAt, required this.isAllDay, required this.color, @JsonKey(unknownEnumValue: Recurrence.unknown) required this.recurrence, required this.seriesId, required this.seriesIndex, required this.createdAt, required this.updatedAt});
  factory _ScheduleEntry.fromJson(Map<String, dynamic> json) => _$ScheduleEntryFromJson(json);

@override final  String id;
@override@JsonKey(unknownEnumValue: ScheduleKind.unknown) final  ScheduleKind kind;
@override final  String? itemId;
@override final  String title;
@override final  DateTime startAt;
@override final  DateTime endAt;
@override final  bool isAllDay;
@override final  String? color;
@override@JsonKey(unknownEnumValue: Recurrence.unknown) final  Recurrence recurrence;
@override final  String? seriesId;
@override final  int? seriesIndex;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;

/// Create a copy of ScheduleEntry
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ScheduleEntryCopyWith<_ScheduleEntry> get copyWith => __$ScheduleEntryCopyWithImpl<_ScheduleEntry>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ScheduleEntryToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ScheduleEntry&&(identical(other.id, id) || other.id == id)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.itemId, itemId) || other.itemId == itemId)&&(identical(other.title, title) || other.title == title)&&(identical(other.startAt, startAt) || other.startAt == startAt)&&(identical(other.endAt, endAt) || other.endAt == endAt)&&(identical(other.isAllDay, isAllDay) || other.isAllDay == isAllDay)&&(identical(other.color, color) || other.color == color)&&(identical(other.recurrence, recurrence) || other.recurrence == recurrence)&&(identical(other.seriesId, seriesId) || other.seriesId == seriesId)&&(identical(other.seriesIndex, seriesIndex) || other.seriesIndex == seriesIndex)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,kind,itemId,title,startAt,endAt,isAllDay,color,recurrence,seriesId,seriesIndex,createdAt,updatedAt);
}

@override
String toString() {
    return 'ScheduleEntry(id: $id, kind: $kind, itemId: $itemId, title: $title, startAt: $startAt, endAt: $endAt, isAllDay: $isAllDay, color: $color, recurrence: $recurrence, seriesId: $seriesId, seriesIndex: $seriesIndex, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$ScheduleEntryCopyWith<$Res> implements $ScheduleEntryCopyWith<$Res> {
  factory _$ScheduleEntryCopyWith(_ScheduleEntry value, $Res Function(_ScheduleEntry) _then) = __$ScheduleEntryCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(unknownEnumValue: ScheduleKind.unknown) ScheduleKind kind, String? itemId, String title, DateTime startAt, DateTime endAt, bool isAllDay, String? color,@JsonKey(unknownEnumValue: Recurrence.unknown) Recurrence recurrence, String? seriesId, int? seriesIndex, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class __$ScheduleEntryCopyWithImpl<$Res>
    implements _$ScheduleEntryCopyWith<$Res> {
  __$ScheduleEntryCopyWithImpl(this._self, this._then);

  final _ScheduleEntry _self;
  final $Res Function(_ScheduleEntry) _then;

/// Create a copy of ScheduleEntry
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? kind = null,Object? itemId = freezed,Object? title = null,Object? startAt = null,Object? endAt = null,Object? isAllDay = null,Object? color = freezed,Object? recurrence = null,Object? seriesId = freezed,Object? seriesIndex = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_ScheduleEntry(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ScheduleKind,itemId: freezed == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,startAt: null == startAt ? _self.startAt : startAt // ignore: cast_nullable_to_non_nullable
as DateTime,endAt: null == endAt ? _self.endAt : endAt // ignore: cast_nullable_to_non_nullable
as DateTime,isAllDay: null == isAllDay ? _self.isAllDay : isAllDay // ignore: cast_nullable_to_non_nullable
as bool,color: freezed == color ? _self.color : color // ignore: cast_nullable_to_non_nullable
as String?,recurrence: null == recurrence ? _self.recurrence : recurrence // ignore: cast_nullable_to_non_nullable
as Recurrence,seriesId: freezed == seriesId ? _self.seriesId : seriesId // ignore: cast_nullable_to_non_nullable
as String?,seriesIndex: freezed == seriesIndex ? _self.seriesIndex : seriesIndex // ignore: cast_nullable_to_non_nullable
as int?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
