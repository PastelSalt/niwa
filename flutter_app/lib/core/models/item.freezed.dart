// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'item.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Item {

 String get id; String get workspaceId; String? get parentId; String get title; Map<String, dynamic>? get content;@JsonKey(unknownEnumValue: ItemType.unknown) ItemType get type;@JsonKey(unknownEnumValue: ItemNature.unknown) ItemNature get nature;@JsonKey(unknownEnumValue: ItemStatus.unknown) ItemStatus get status;@JsonKey(unknownEnumValue: ItemPriority.unknown) ItemPriority get priority; String get orderKey; List<String> get tags; String? get dueAt; int? get estimatedMinutes; String? get reviewAt; String? get sourceUrl; DateTime? get inboxedAt; String? get suggestedParentId; DateTime? get archivedAt; DateTime? get deletedAt; int get version; DateTime get createdAt; DateTime get updatedAt; DateTime? get completedAt;
/// Create a copy of Item
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ItemCopyWith<Item> get copyWith => _$ItemCopyWithImpl<Item>(this as Item, _$identity);

  /// Serializes this Item to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Item;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Item&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.workspaceId, _this.workspaceId) || other.workspaceId == _this.workspaceId)&&(identical(other.parentId, _this.parentId) || other.parentId == _this.parentId)&&(identical(other.title, _this.title) || other.title == _this.title)&&const DeepCollectionEquality().equals(other.content, _this.content)&&(identical(other.type, _this.type) || other.type == _this.type)&&(identical(other.nature, _this.nature) || other.nature == _this.nature)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.priority, _this.priority) || other.priority == _this.priority)&&(identical(other.orderKey, _this.orderKey) || other.orderKey == _this.orderKey)&&const DeepCollectionEquality().equals(other.tags, _this.tags)&&(identical(other.dueAt, _this.dueAt) || other.dueAt == _this.dueAt)&&(identical(other.estimatedMinutes, _this.estimatedMinutes) || other.estimatedMinutes == _this.estimatedMinutes)&&(identical(other.reviewAt, _this.reviewAt) || other.reviewAt == _this.reviewAt)&&(identical(other.sourceUrl, _this.sourceUrl) || other.sourceUrl == _this.sourceUrl)&&(identical(other.inboxedAt, _this.inboxedAt) || other.inboxedAt == _this.inboxedAt)&&(identical(other.suggestedParentId, _this.suggestedParentId) || other.suggestedParentId == _this.suggestedParentId)&&(identical(other.archivedAt, _this.archivedAt) || other.archivedAt == _this.archivedAt)&&(identical(other.deletedAt, _this.deletedAt) || other.deletedAt == _this.deletedAt)&&(identical(other.version, _this.version) || other.version == _this.version)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&(identical(other.updatedAt, _this.updatedAt) || other.updatedAt == _this.updatedAt)&&(identical(other.completedAt, _this.completedAt) || other.completedAt == _this.completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Item;
  return Object.hashAll([runtimeType,_this.id,_this.workspaceId,_this.parentId,_this.title,const DeepCollectionEquality().hash(_this.content),_this.type,_this.nature,_this.status,_this.priority,_this.orderKey,const DeepCollectionEquality().hash(_this.tags),_this.dueAt,_this.estimatedMinutes,_this.reviewAt,_this.sourceUrl,_this.inboxedAt,_this.suggestedParentId,_this.archivedAt,_this.deletedAt,_this.version,_this.createdAt,_this.updatedAt,_this.completedAt]);
}

@override
String toString() {
  final _this = this as Item;
  return 'Item(id: ${_this.id}, workspaceId: ${_this.workspaceId}, parentId: ${_this.parentId}, title: ${_this.title}, content: ${_this.content}, type: ${_this.type}, nature: ${_this.nature}, status: ${_this.status}, priority: ${_this.priority}, orderKey: ${_this.orderKey}, tags: ${_this.tags}, dueAt: ${_this.dueAt}, estimatedMinutes: ${_this.estimatedMinutes}, reviewAt: ${_this.reviewAt}, sourceUrl: ${_this.sourceUrl}, inboxedAt: ${_this.inboxedAt}, suggestedParentId: ${_this.suggestedParentId}, archivedAt: ${_this.archivedAt}, deletedAt: ${_this.deletedAt}, version: ${_this.version}, createdAt: ${_this.createdAt}, updatedAt: ${_this.updatedAt}, completedAt: ${_this.completedAt})';
}


}

/// @nodoc
abstract mixin class $ItemCopyWith<$Res>  {
  factory $ItemCopyWith(Item value, $Res Function(Item) _then) = _$ItemCopyWithImpl;
@useResult
$Res call({
 String id, String workspaceId, String? parentId, String title, Map<String, dynamic>? content,@JsonKey(unknownEnumValue: ItemType.unknown) ItemType type,@JsonKey(unknownEnumValue: ItemNature.unknown) ItemNature nature,@JsonKey(unknownEnumValue: ItemStatus.unknown) ItemStatus status,@JsonKey(unknownEnumValue: ItemPriority.unknown) ItemPriority priority, String orderKey, List<String> tags, String? dueAt, int? estimatedMinutes, String? reviewAt, String? sourceUrl, DateTime? inboxedAt, String? suggestedParentId, DateTime? archivedAt, DateTime? deletedAt, int version, DateTime createdAt, DateTime updatedAt, DateTime? completedAt
});




}
/// @nodoc
class _$ItemCopyWithImpl<$Res>
    implements $ItemCopyWith<$Res> {
  _$ItemCopyWithImpl(this._self, this._then);

  final Item _self;
  final $Res Function(Item) _then;

/// Create a copy of Item
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? workspaceId = null,Object? parentId = freezed,Object? title = null,Object? content = freezed,Object? type = null,Object? nature = null,Object? status = null,Object? priority = null,Object? orderKey = null,Object? tags = null,Object? dueAt = freezed,Object? estimatedMinutes = freezed,Object? reviewAt = freezed,Object? sourceUrl = freezed,Object? inboxedAt = freezed,Object? suggestedParentId = freezed,Object? archivedAt = freezed,Object? deletedAt = freezed,Object? version = null,Object? createdAt = null,Object? updatedAt = null,Object? completedAt = freezed,}) {
  return _then(Item(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,workspaceId: null == workspaceId ? _self.workspaceId : workspaceId // ignore: cast_nullable_to_non_nullable
as String,parentId: freezed == parentId ? _self.parentId : parentId // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,content: freezed == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ItemType,nature: null == nature ? _self.nature : nature // ignore: cast_nullable_to_non_nullable
as ItemNature,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ItemStatus,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as ItemPriority,orderKey: null == orderKey ? _self.orderKey : orderKey // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,dueAt: freezed == dueAt ? _self.dueAt : dueAt // ignore: cast_nullable_to_non_nullable
as String?,estimatedMinutes: freezed == estimatedMinutes ? _self.estimatedMinutes : estimatedMinutes // ignore: cast_nullable_to_non_nullable
as int?,reviewAt: freezed == reviewAt ? _self.reviewAt : reviewAt // ignore: cast_nullable_to_non_nullable
as String?,sourceUrl: freezed == sourceUrl ? _self.sourceUrl : sourceUrl // ignore: cast_nullable_to_non_nullable
as String?,inboxedAt: freezed == inboxedAt ? _self.inboxedAt : inboxedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,suggestedParentId: freezed == suggestedParentId ? _self.suggestedParentId : suggestedParentId // ignore: cast_nullable_to_non_nullable
as String?,archivedAt: freezed == archivedAt ? _self.archivedAt : archivedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deletedAt: freezed == deletedAt ? _self.deletedAt : deletedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [Item].
extension ItemPatterns on Item {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Item value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Item() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Item value)  $default,){
final _that = this;
switch (_that) {
case _Item():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Item value)?  $default,){
final _that = this;
switch (_that) {
case _Item() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String workspaceId,  String? parentId,  String title,  Map<String, dynamic>? content, @JsonKey(unknownEnumValue: ItemType.unknown)  ItemType type, @JsonKey(unknownEnumValue: ItemNature.unknown)  ItemNature nature, @JsonKey(unknownEnumValue: ItemStatus.unknown)  ItemStatus status, @JsonKey(unknownEnumValue: ItemPriority.unknown)  ItemPriority priority,  String orderKey,  List<String> tags,  String? dueAt,  int? estimatedMinutes,  String? reviewAt,  String? sourceUrl,  DateTime? inboxedAt,  String? suggestedParentId,  DateTime? archivedAt,  DateTime? deletedAt,  int version,  DateTime createdAt,  DateTime updatedAt,  DateTime? completedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Item() when $default != null:
return $default(_that.id,_that.workspaceId,_that.parentId,_that.title,_that.content,_that.type,_that.nature,_that.status,_that.priority,_that.orderKey,_that.tags,_that.dueAt,_that.estimatedMinutes,_that.reviewAt,_that.sourceUrl,_that.inboxedAt,_that.suggestedParentId,_that.archivedAt,_that.deletedAt,_that.version,_that.createdAt,_that.updatedAt,_that.completedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String workspaceId,  String? parentId,  String title,  Map<String, dynamic>? content, @JsonKey(unknownEnumValue: ItemType.unknown)  ItemType type, @JsonKey(unknownEnumValue: ItemNature.unknown)  ItemNature nature, @JsonKey(unknownEnumValue: ItemStatus.unknown)  ItemStatus status, @JsonKey(unknownEnumValue: ItemPriority.unknown)  ItemPriority priority,  String orderKey,  List<String> tags,  String? dueAt,  int? estimatedMinutes,  String? reviewAt,  String? sourceUrl,  DateTime? inboxedAt,  String? suggestedParentId,  DateTime? archivedAt,  DateTime? deletedAt,  int version,  DateTime createdAt,  DateTime updatedAt,  DateTime? completedAt)  $default,) {final _that = this;
switch (_that) {
case _Item():
return $default(_that.id,_that.workspaceId,_that.parentId,_that.title,_that.content,_that.type,_that.nature,_that.status,_that.priority,_that.orderKey,_that.tags,_that.dueAt,_that.estimatedMinutes,_that.reviewAt,_that.sourceUrl,_that.inboxedAt,_that.suggestedParentId,_that.archivedAt,_that.deletedAt,_that.version,_that.createdAt,_that.updatedAt,_that.completedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String workspaceId,  String? parentId,  String title,  Map<String, dynamic>? content, @JsonKey(unknownEnumValue: ItemType.unknown)  ItemType type, @JsonKey(unknownEnumValue: ItemNature.unknown)  ItemNature nature, @JsonKey(unknownEnumValue: ItemStatus.unknown)  ItemStatus status, @JsonKey(unknownEnumValue: ItemPriority.unknown)  ItemPriority priority,  String orderKey,  List<String> tags,  String? dueAt,  int? estimatedMinutes,  String? reviewAt,  String? sourceUrl,  DateTime? inboxedAt,  String? suggestedParentId,  DateTime? archivedAt,  DateTime? deletedAt,  int version,  DateTime createdAt,  DateTime updatedAt,  DateTime? completedAt)?  $default,) {final _that = this;
switch (_that) {
case _Item() when $default != null:
return $default(_that.id,_that.workspaceId,_that.parentId,_that.title,_that.content,_that.type,_that.nature,_that.status,_that.priority,_that.orderKey,_that.tags,_that.dueAt,_that.estimatedMinutes,_that.reviewAt,_that.sourceUrl,_that.inboxedAt,_that.suggestedParentId,_that.archivedAt,_that.deletedAt,_that.version,_that.createdAt,_that.updatedAt,_that.completedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Item implements Item {
  const _Item({required this.id, required this.workspaceId, required this.parentId, required this.title, required  Map<String, dynamic>? content, @JsonKey(unknownEnumValue: ItemType.unknown) required this.type, @JsonKey(unknownEnumValue: ItemNature.unknown) required this.nature, @JsonKey(unknownEnumValue: ItemStatus.unknown) required this.status, @JsonKey(unknownEnumValue: ItemPriority.unknown) required this.priority, required this.orderKey, required  List<String> tags, required this.dueAt, required this.estimatedMinutes, required this.reviewAt, required this.sourceUrl, required this.inboxedAt, required this.suggestedParentId, required this.archivedAt, required this.deletedAt, required this.version, required this.createdAt, required this.updatedAt, required this.completedAt}): _content = content,_tags = tags;
  factory _Item.fromJson(Map<String, dynamic> json) => _$ItemFromJson(json);

@override final  String id;
@override final  String workspaceId;
@override final  String? parentId;
@override final  String title;
 final  Map<String, dynamic>? _content;
@override Map<String, dynamic>? get content {
  final value = _content;
  if (value == null) return null;
  if (_content is EqualUnmodifiableMapView) return _content;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override@JsonKey(unknownEnumValue: ItemType.unknown) final  ItemType type;
@override@JsonKey(unknownEnumValue: ItemNature.unknown) final  ItemNature nature;
@override@JsonKey(unknownEnumValue: ItemStatus.unknown) final  ItemStatus status;
@override@JsonKey(unknownEnumValue: ItemPriority.unknown) final  ItemPriority priority;
@override final  String orderKey;
 final  List<String> _tags;
@override List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override final  String? dueAt;
@override final  int? estimatedMinutes;
@override final  String? reviewAt;
@override final  String? sourceUrl;
@override final  DateTime? inboxedAt;
@override final  String? suggestedParentId;
@override final  DateTime? archivedAt;
@override final  DateTime? deletedAt;
@override final  int version;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;
@override final  DateTime? completedAt;

/// Create a copy of Item
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ItemCopyWith<_Item> get copyWith => __$ItemCopyWithImpl<_Item>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ItemToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Item&&(identical(other.id, id) || other.id == id)&&(identical(other.workspaceId, workspaceId) || other.workspaceId == workspaceId)&&(identical(other.parentId, parentId) || other.parentId == parentId)&&(identical(other.title, title) || other.title == title)&&const DeepCollectionEquality().equals(other.content, _content)&&(identical(other.type, type) || other.type == type)&&(identical(other.nature, nature) || other.nature == nature)&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.orderKey, orderKey) || other.orderKey == orderKey)&&const DeepCollectionEquality().equals(other.tags, _tags)&&(identical(other.dueAt, dueAt) || other.dueAt == dueAt)&&(identical(other.estimatedMinutes, estimatedMinutes) || other.estimatedMinutes == estimatedMinutes)&&(identical(other.reviewAt, reviewAt) || other.reviewAt == reviewAt)&&(identical(other.sourceUrl, sourceUrl) || other.sourceUrl == sourceUrl)&&(identical(other.inboxedAt, inboxedAt) || other.inboxedAt == inboxedAt)&&(identical(other.suggestedParentId, suggestedParentId) || other.suggestedParentId == suggestedParentId)&&(identical(other.archivedAt, archivedAt) || other.archivedAt == archivedAt)&&(identical(other.deletedAt, deletedAt) || other.deletedAt == deletedAt)&&(identical(other.version, version) || other.version == version)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,id,workspaceId,parentId,title,const DeepCollectionEquality().hash(_content),type,nature,status,priority,orderKey,const DeepCollectionEquality().hash(_tags),dueAt,estimatedMinutes,reviewAt,sourceUrl,inboxedAt,suggestedParentId,archivedAt,deletedAt,version,createdAt,updatedAt,completedAt]);
}

@override
String toString() {
    return 'Item(id: $id, workspaceId: $workspaceId, parentId: $parentId, title: $title, content: $content, type: $type, nature: $nature, status: $status, priority: $priority, orderKey: $orderKey, tags: $tags, dueAt: $dueAt, estimatedMinutes: $estimatedMinutes, reviewAt: $reviewAt, sourceUrl: $sourceUrl, inboxedAt: $inboxedAt, suggestedParentId: $suggestedParentId, archivedAt: $archivedAt, deletedAt: $deletedAt, version: $version, createdAt: $createdAt, updatedAt: $updatedAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class _$ItemCopyWith<$Res> implements $ItemCopyWith<$Res> {
  factory _$ItemCopyWith(_Item value, $Res Function(_Item) _then) = __$ItemCopyWithImpl;
@override @useResult
$Res call({
 String id, String workspaceId, String? parentId, String title, Map<String, dynamic>? content,@JsonKey(unknownEnumValue: ItemType.unknown) ItemType type,@JsonKey(unknownEnumValue: ItemNature.unknown) ItemNature nature,@JsonKey(unknownEnumValue: ItemStatus.unknown) ItemStatus status,@JsonKey(unknownEnumValue: ItemPriority.unknown) ItemPriority priority, String orderKey, List<String> tags, String? dueAt, int? estimatedMinutes, String? reviewAt, String? sourceUrl, DateTime? inboxedAt, String? suggestedParentId, DateTime? archivedAt, DateTime? deletedAt, int version, DateTime createdAt, DateTime updatedAt, DateTime? completedAt
});




}
/// @nodoc
class __$ItemCopyWithImpl<$Res>
    implements _$ItemCopyWith<$Res> {
  __$ItemCopyWithImpl(this._self, this._then);

  final _Item _self;
  final $Res Function(_Item) _then;

/// Create a copy of Item
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? workspaceId = null,Object? parentId = freezed,Object? title = null,Object? content = freezed,Object? type = null,Object? nature = null,Object? status = null,Object? priority = null,Object? orderKey = null,Object? tags = null,Object? dueAt = freezed,Object? estimatedMinutes = freezed,Object? reviewAt = freezed,Object? sourceUrl = freezed,Object? inboxedAt = freezed,Object? suggestedParentId = freezed,Object? archivedAt = freezed,Object? deletedAt = freezed,Object? version = null,Object? createdAt = null,Object? updatedAt = null,Object? completedAt = freezed,}) {
  return _then(_Item(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,workspaceId: null == workspaceId ? _self.workspaceId : workspaceId // ignore: cast_nullable_to_non_nullable
as String,parentId: freezed == parentId ? _self.parentId : parentId // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,content: freezed == content ? _self._content : content // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ItemType,nature: null == nature ? _self.nature : nature // ignore: cast_nullable_to_non_nullable
as ItemNature,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ItemStatus,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as ItemPriority,orderKey: null == orderKey ? _self.orderKey : orderKey // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,dueAt: freezed == dueAt ? _self.dueAt : dueAt // ignore: cast_nullable_to_non_nullable
as String?,estimatedMinutes: freezed == estimatedMinutes ? _self.estimatedMinutes : estimatedMinutes // ignore: cast_nullable_to_non_nullable
as int?,reviewAt: freezed == reviewAt ? _self.reviewAt : reviewAt // ignore: cast_nullable_to_non_nullable
as String?,sourceUrl: freezed == sourceUrl ? _self.sourceUrl : sourceUrl // ignore: cast_nullable_to_non_nullable
as String?,inboxedAt: freezed == inboxedAt ? _self.inboxedAt : inboxedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,suggestedParentId: freezed == suggestedParentId ? _self.suggestedParentId : suggestedParentId // ignore: cast_nullable_to_non_nullable
as String?,archivedAt: freezed == archivedAt ? _self.archivedAt : archivedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deletedAt: freezed == deletedAt ? _self.deletedAt : deletedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$ItemSummary {

 String get id; String get workspaceId; String? get parentId; String get title;@JsonKey(unknownEnumValue: ItemType.unknown) ItemType get type;@JsonKey(unknownEnumValue: ItemNature.unknown) ItemNature get nature;@JsonKey(unknownEnumValue: ItemStatus.unknown) ItemStatus get status;@JsonKey(unknownEnumValue: ItemPriority.unknown) ItemPriority get priority; String get orderKey; List<String> get tags; String? get dueAt; int? get estimatedMinutes; String? get reviewAt; String? get sourceUrl; DateTime? get inboxedAt; String? get suggestedParentId; DateTime? get archivedAt; DateTime? get deletedAt; int get version; DateTime get createdAt; DateTime get updatedAt; DateTime? get completedAt;
/// Create a copy of ItemSummary
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ItemSummaryCopyWith<ItemSummary> get copyWith => _$ItemSummaryCopyWithImpl<ItemSummary>(this as ItemSummary, _$identity);

  /// Serializes this ItemSummary to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ItemSummary;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ItemSummary&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.workspaceId, _this.workspaceId) || other.workspaceId == _this.workspaceId)&&(identical(other.parentId, _this.parentId) || other.parentId == _this.parentId)&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.type, _this.type) || other.type == _this.type)&&(identical(other.nature, _this.nature) || other.nature == _this.nature)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.priority, _this.priority) || other.priority == _this.priority)&&(identical(other.orderKey, _this.orderKey) || other.orderKey == _this.orderKey)&&const DeepCollectionEquality().equals(other.tags, _this.tags)&&(identical(other.dueAt, _this.dueAt) || other.dueAt == _this.dueAt)&&(identical(other.estimatedMinutes, _this.estimatedMinutes) || other.estimatedMinutes == _this.estimatedMinutes)&&(identical(other.reviewAt, _this.reviewAt) || other.reviewAt == _this.reviewAt)&&(identical(other.sourceUrl, _this.sourceUrl) || other.sourceUrl == _this.sourceUrl)&&(identical(other.inboxedAt, _this.inboxedAt) || other.inboxedAt == _this.inboxedAt)&&(identical(other.suggestedParentId, _this.suggestedParentId) || other.suggestedParentId == _this.suggestedParentId)&&(identical(other.archivedAt, _this.archivedAt) || other.archivedAt == _this.archivedAt)&&(identical(other.deletedAt, _this.deletedAt) || other.deletedAt == _this.deletedAt)&&(identical(other.version, _this.version) || other.version == _this.version)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&(identical(other.updatedAt, _this.updatedAt) || other.updatedAt == _this.updatedAt)&&(identical(other.completedAt, _this.completedAt) || other.completedAt == _this.completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ItemSummary;
  return Object.hashAll([runtimeType,_this.id,_this.workspaceId,_this.parentId,_this.title,_this.type,_this.nature,_this.status,_this.priority,_this.orderKey,const DeepCollectionEquality().hash(_this.tags),_this.dueAt,_this.estimatedMinutes,_this.reviewAt,_this.sourceUrl,_this.inboxedAt,_this.suggestedParentId,_this.archivedAt,_this.deletedAt,_this.version,_this.createdAt,_this.updatedAt,_this.completedAt]);
}

@override
String toString() {
  final _this = this as ItemSummary;
  return 'ItemSummary(id: ${_this.id}, workspaceId: ${_this.workspaceId}, parentId: ${_this.parentId}, title: ${_this.title}, type: ${_this.type}, nature: ${_this.nature}, status: ${_this.status}, priority: ${_this.priority}, orderKey: ${_this.orderKey}, tags: ${_this.tags}, dueAt: ${_this.dueAt}, estimatedMinutes: ${_this.estimatedMinutes}, reviewAt: ${_this.reviewAt}, sourceUrl: ${_this.sourceUrl}, inboxedAt: ${_this.inboxedAt}, suggestedParentId: ${_this.suggestedParentId}, archivedAt: ${_this.archivedAt}, deletedAt: ${_this.deletedAt}, version: ${_this.version}, createdAt: ${_this.createdAt}, updatedAt: ${_this.updatedAt}, completedAt: ${_this.completedAt})';
}


}

/// @nodoc
abstract mixin class $ItemSummaryCopyWith<$Res>  {
  factory $ItemSummaryCopyWith(ItemSummary value, $Res Function(ItemSummary) _then) = _$ItemSummaryCopyWithImpl;
@useResult
$Res call({
 String id, String workspaceId, String? parentId, String title,@JsonKey(unknownEnumValue: ItemType.unknown) ItemType type,@JsonKey(unknownEnumValue: ItemNature.unknown) ItemNature nature,@JsonKey(unknownEnumValue: ItemStatus.unknown) ItemStatus status,@JsonKey(unknownEnumValue: ItemPriority.unknown) ItemPriority priority, String orderKey, List<String> tags, String? dueAt, int? estimatedMinutes, String? reviewAt, String? sourceUrl, DateTime? inboxedAt, String? suggestedParentId, DateTime? archivedAt, DateTime? deletedAt, int version, DateTime createdAt, DateTime updatedAt, DateTime? completedAt
});




}
/// @nodoc
class _$ItemSummaryCopyWithImpl<$Res>
    implements $ItemSummaryCopyWith<$Res> {
  _$ItemSummaryCopyWithImpl(this._self, this._then);

  final ItemSummary _self;
  final $Res Function(ItemSummary) _then;

/// Create a copy of ItemSummary
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? workspaceId = null,Object? parentId = freezed,Object? title = null,Object? type = null,Object? nature = null,Object? status = null,Object? priority = null,Object? orderKey = null,Object? tags = null,Object? dueAt = freezed,Object? estimatedMinutes = freezed,Object? reviewAt = freezed,Object? sourceUrl = freezed,Object? inboxedAt = freezed,Object? suggestedParentId = freezed,Object? archivedAt = freezed,Object? deletedAt = freezed,Object? version = null,Object? createdAt = null,Object? updatedAt = null,Object? completedAt = freezed,}) {
  return _then(ItemSummary(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,workspaceId: null == workspaceId ? _self.workspaceId : workspaceId // ignore: cast_nullable_to_non_nullable
as String,parentId: freezed == parentId ? _self.parentId : parentId // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ItemType,nature: null == nature ? _self.nature : nature // ignore: cast_nullable_to_non_nullable
as ItemNature,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ItemStatus,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as ItemPriority,orderKey: null == orderKey ? _self.orderKey : orderKey // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,dueAt: freezed == dueAt ? _self.dueAt : dueAt // ignore: cast_nullable_to_non_nullable
as String?,estimatedMinutes: freezed == estimatedMinutes ? _self.estimatedMinutes : estimatedMinutes // ignore: cast_nullable_to_non_nullable
as int?,reviewAt: freezed == reviewAt ? _self.reviewAt : reviewAt // ignore: cast_nullable_to_non_nullable
as String?,sourceUrl: freezed == sourceUrl ? _self.sourceUrl : sourceUrl // ignore: cast_nullable_to_non_nullable
as String?,inboxedAt: freezed == inboxedAt ? _self.inboxedAt : inboxedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,suggestedParentId: freezed == suggestedParentId ? _self.suggestedParentId : suggestedParentId // ignore: cast_nullable_to_non_nullable
as String?,archivedAt: freezed == archivedAt ? _self.archivedAt : archivedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deletedAt: freezed == deletedAt ? _self.deletedAt : deletedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [ItemSummary].
extension ItemSummaryPatterns on ItemSummary {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ItemSummary value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ItemSummary() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ItemSummary value)  $default,){
final _that = this;
switch (_that) {
case _ItemSummary():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ItemSummary value)?  $default,){
final _that = this;
switch (_that) {
case _ItemSummary() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String workspaceId,  String? parentId,  String title, @JsonKey(unknownEnumValue: ItemType.unknown)  ItemType type, @JsonKey(unknownEnumValue: ItemNature.unknown)  ItemNature nature, @JsonKey(unknownEnumValue: ItemStatus.unknown)  ItemStatus status, @JsonKey(unknownEnumValue: ItemPriority.unknown)  ItemPriority priority,  String orderKey,  List<String> tags,  String? dueAt,  int? estimatedMinutes,  String? reviewAt,  String? sourceUrl,  DateTime? inboxedAt,  String? suggestedParentId,  DateTime? archivedAt,  DateTime? deletedAt,  int version,  DateTime createdAt,  DateTime updatedAt,  DateTime? completedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ItemSummary() when $default != null:
return $default(_that.id,_that.workspaceId,_that.parentId,_that.title,_that.type,_that.nature,_that.status,_that.priority,_that.orderKey,_that.tags,_that.dueAt,_that.estimatedMinutes,_that.reviewAt,_that.sourceUrl,_that.inboxedAt,_that.suggestedParentId,_that.archivedAt,_that.deletedAt,_that.version,_that.createdAt,_that.updatedAt,_that.completedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String workspaceId,  String? parentId,  String title, @JsonKey(unknownEnumValue: ItemType.unknown)  ItemType type, @JsonKey(unknownEnumValue: ItemNature.unknown)  ItemNature nature, @JsonKey(unknownEnumValue: ItemStatus.unknown)  ItemStatus status, @JsonKey(unknownEnumValue: ItemPriority.unknown)  ItemPriority priority,  String orderKey,  List<String> tags,  String? dueAt,  int? estimatedMinutes,  String? reviewAt,  String? sourceUrl,  DateTime? inboxedAt,  String? suggestedParentId,  DateTime? archivedAt,  DateTime? deletedAt,  int version,  DateTime createdAt,  DateTime updatedAt,  DateTime? completedAt)  $default,) {final _that = this;
switch (_that) {
case _ItemSummary():
return $default(_that.id,_that.workspaceId,_that.parentId,_that.title,_that.type,_that.nature,_that.status,_that.priority,_that.orderKey,_that.tags,_that.dueAt,_that.estimatedMinutes,_that.reviewAt,_that.sourceUrl,_that.inboxedAt,_that.suggestedParentId,_that.archivedAt,_that.deletedAt,_that.version,_that.createdAt,_that.updatedAt,_that.completedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String workspaceId,  String? parentId,  String title, @JsonKey(unknownEnumValue: ItemType.unknown)  ItemType type, @JsonKey(unknownEnumValue: ItemNature.unknown)  ItemNature nature, @JsonKey(unknownEnumValue: ItemStatus.unknown)  ItemStatus status, @JsonKey(unknownEnumValue: ItemPriority.unknown)  ItemPriority priority,  String orderKey,  List<String> tags,  String? dueAt,  int? estimatedMinutes,  String? reviewAt,  String? sourceUrl,  DateTime? inboxedAt,  String? suggestedParentId,  DateTime? archivedAt,  DateTime? deletedAt,  int version,  DateTime createdAt,  DateTime updatedAt,  DateTime? completedAt)?  $default,) {final _that = this;
switch (_that) {
case _ItemSummary() when $default != null:
return $default(_that.id,_that.workspaceId,_that.parentId,_that.title,_that.type,_that.nature,_that.status,_that.priority,_that.orderKey,_that.tags,_that.dueAt,_that.estimatedMinutes,_that.reviewAt,_that.sourceUrl,_that.inboxedAt,_that.suggestedParentId,_that.archivedAt,_that.deletedAt,_that.version,_that.createdAt,_that.updatedAt,_that.completedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ItemSummary implements ItemSummary {
  const _ItemSummary({required this.id, required this.workspaceId, required this.parentId, required this.title, @JsonKey(unknownEnumValue: ItemType.unknown) required this.type, @JsonKey(unknownEnumValue: ItemNature.unknown) required this.nature, @JsonKey(unknownEnumValue: ItemStatus.unknown) required this.status, @JsonKey(unknownEnumValue: ItemPriority.unknown) required this.priority, required this.orderKey, required  List<String> tags, required this.dueAt, required this.estimatedMinutes, required this.reviewAt, required this.sourceUrl, required this.inboxedAt, required this.suggestedParentId, required this.archivedAt, required this.deletedAt, required this.version, required this.createdAt, required this.updatedAt, required this.completedAt}): _tags = tags;
  factory _ItemSummary.fromJson(Map<String, dynamic> json) => _$ItemSummaryFromJson(json);

@override final  String id;
@override final  String workspaceId;
@override final  String? parentId;
@override final  String title;
@override@JsonKey(unknownEnumValue: ItemType.unknown) final  ItemType type;
@override@JsonKey(unknownEnumValue: ItemNature.unknown) final  ItemNature nature;
@override@JsonKey(unknownEnumValue: ItemStatus.unknown) final  ItemStatus status;
@override@JsonKey(unknownEnumValue: ItemPriority.unknown) final  ItemPriority priority;
@override final  String orderKey;
 final  List<String> _tags;
@override List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override final  String? dueAt;
@override final  int? estimatedMinutes;
@override final  String? reviewAt;
@override final  String? sourceUrl;
@override final  DateTime? inboxedAt;
@override final  String? suggestedParentId;
@override final  DateTime? archivedAt;
@override final  DateTime? deletedAt;
@override final  int version;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;
@override final  DateTime? completedAt;

/// Create a copy of ItemSummary
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ItemSummaryCopyWith<_ItemSummary> get copyWith => __$ItemSummaryCopyWithImpl<_ItemSummary>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ItemSummaryToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ItemSummary&&(identical(other.id, id) || other.id == id)&&(identical(other.workspaceId, workspaceId) || other.workspaceId == workspaceId)&&(identical(other.parentId, parentId) || other.parentId == parentId)&&(identical(other.title, title) || other.title == title)&&(identical(other.type, type) || other.type == type)&&(identical(other.nature, nature) || other.nature == nature)&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.orderKey, orderKey) || other.orderKey == orderKey)&&const DeepCollectionEquality().equals(other.tags, _tags)&&(identical(other.dueAt, dueAt) || other.dueAt == dueAt)&&(identical(other.estimatedMinutes, estimatedMinutes) || other.estimatedMinutes == estimatedMinutes)&&(identical(other.reviewAt, reviewAt) || other.reviewAt == reviewAt)&&(identical(other.sourceUrl, sourceUrl) || other.sourceUrl == sourceUrl)&&(identical(other.inboxedAt, inboxedAt) || other.inboxedAt == inboxedAt)&&(identical(other.suggestedParentId, suggestedParentId) || other.suggestedParentId == suggestedParentId)&&(identical(other.archivedAt, archivedAt) || other.archivedAt == archivedAt)&&(identical(other.deletedAt, deletedAt) || other.deletedAt == deletedAt)&&(identical(other.version, version) || other.version == version)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,id,workspaceId,parentId,title,type,nature,status,priority,orderKey,const DeepCollectionEquality().hash(_tags),dueAt,estimatedMinutes,reviewAt,sourceUrl,inboxedAt,suggestedParentId,archivedAt,deletedAt,version,createdAt,updatedAt,completedAt]);
}

@override
String toString() {
    return 'ItemSummary(id: $id, workspaceId: $workspaceId, parentId: $parentId, title: $title, type: $type, nature: $nature, status: $status, priority: $priority, orderKey: $orderKey, tags: $tags, dueAt: $dueAt, estimatedMinutes: $estimatedMinutes, reviewAt: $reviewAt, sourceUrl: $sourceUrl, inboxedAt: $inboxedAt, suggestedParentId: $suggestedParentId, archivedAt: $archivedAt, deletedAt: $deletedAt, version: $version, createdAt: $createdAt, updatedAt: $updatedAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class _$ItemSummaryCopyWith<$Res> implements $ItemSummaryCopyWith<$Res> {
  factory _$ItemSummaryCopyWith(_ItemSummary value, $Res Function(_ItemSummary) _then) = __$ItemSummaryCopyWithImpl;
@override @useResult
$Res call({
 String id, String workspaceId, String? parentId, String title,@JsonKey(unknownEnumValue: ItemType.unknown) ItemType type,@JsonKey(unknownEnumValue: ItemNature.unknown) ItemNature nature,@JsonKey(unknownEnumValue: ItemStatus.unknown) ItemStatus status,@JsonKey(unknownEnumValue: ItemPriority.unknown) ItemPriority priority, String orderKey, List<String> tags, String? dueAt, int? estimatedMinutes, String? reviewAt, String? sourceUrl, DateTime? inboxedAt, String? suggestedParentId, DateTime? archivedAt, DateTime? deletedAt, int version, DateTime createdAt, DateTime updatedAt, DateTime? completedAt
});




}
/// @nodoc
class __$ItemSummaryCopyWithImpl<$Res>
    implements _$ItemSummaryCopyWith<$Res> {
  __$ItemSummaryCopyWithImpl(this._self, this._then);

  final _ItemSummary _self;
  final $Res Function(_ItemSummary) _then;

/// Create a copy of ItemSummary
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? workspaceId = null,Object? parentId = freezed,Object? title = null,Object? type = null,Object? nature = null,Object? status = null,Object? priority = null,Object? orderKey = null,Object? tags = null,Object? dueAt = freezed,Object? estimatedMinutes = freezed,Object? reviewAt = freezed,Object? sourceUrl = freezed,Object? inboxedAt = freezed,Object? suggestedParentId = freezed,Object? archivedAt = freezed,Object? deletedAt = freezed,Object? version = null,Object? createdAt = null,Object? updatedAt = null,Object? completedAt = freezed,}) {
  return _then(_ItemSummary(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,workspaceId: null == workspaceId ? _self.workspaceId : workspaceId // ignore: cast_nullable_to_non_nullable
as String,parentId: freezed == parentId ? _self.parentId : parentId // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ItemType,nature: null == nature ? _self.nature : nature // ignore: cast_nullable_to_non_nullable
as ItemNature,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ItemStatus,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as ItemPriority,orderKey: null == orderKey ? _self.orderKey : orderKey // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,dueAt: freezed == dueAt ? _self.dueAt : dueAt // ignore: cast_nullable_to_non_nullable
as String?,estimatedMinutes: freezed == estimatedMinutes ? _self.estimatedMinutes : estimatedMinutes // ignore: cast_nullable_to_non_nullable
as int?,reviewAt: freezed == reviewAt ? _self.reviewAt : reviewAt // ignore: cast_nullable_to_non_nullable
as String?,sourceUrl: freezed == sourceUrl ? _self.sourceUrl : sourceUrl // ignore: cast_nullable_to_non_nullable
as String?,inboxedAt: freezed == inboxedAt ? _self.inboxedAt : inboxedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,suggestedParentId: freezed == suggestedParentId ? _self.suggestedParentId : suggestedParentId // ignore: cast_nullable_to_non_nullable
as String?,archivedAt: freezed == archivedAt ? _self.archivedAt : archivedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deletedAt: freezed == deletedAt ? _self.deletedAt : deletedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$FocusResponse {

 List<ItemSummary> get inProgress; List<ItemSummary> get highPriority; List<ItemSummary> get overdue; List<ItemSummary> get upcoming; List<ItemSummary> get recentlyUpdated;
/// Create a copy of FocusResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FocusResponseCopyWith<FocusResponse> get copyWith => _$FocusResponseCopyWithImpl<FocusResponse>(this as FocusResponse, _$identity);

  /// Serializes this FocusResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FocusResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FocusResponse&&const DeepCollectionEquality().equals(other.inProgress, _this.inProgress)&&const DeepCollectionEquality().equals(other.highPriority, _this.highPriority)&&const DeepCollectionEquality().equals(other.overdue, _this.overdue)&&const DeepCollectionEquality().equals(other.upcoming, _this.upcoming)&&const DeepCollectionEquality().equals(other.recentlyUpdated, _this.recentlyUpdated));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FocusResponse;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.inProgress),const DeepCollectionEquality().hash(_this.highPriority),const DeepCollectionEquality().hash(_this.overdue),const DeepCollectionEquality().hash(_this.upcoming),const DeepCollectionEquality().hash(_this.recentlyUpdated));
}

@override
String toString() {
  final _this = this as FocusResponse;
  return 'FocusResponse(inProgress: ${_this.inProgress}, highPriority: ${_this.highPriority}, overdue: ${_this.overdue}, upcoming: ${_this.upcoming}, recentlyUpdated: ${_this.recentlyUpdated})';
}


}

/// @nodoc
abstract mixin class $FocusResponseCopyWith<$Res>  {
  factory $FocusResponseCopyWith(FocusResponse value, $Res Function(FocusResponse) _then) = _$FocusResponseCopyWithImpl;
@useResult
$Res call({
 List<ItemSummary> inProgress, List<ItemSummary> highPriority, List<ItemSummary> overdue, List<ItemSummary> upcoming, List<ItemSummary> recentlyUpdated
});




}
/// @nodoc
class _$FocusResponseCopyWithImpl<$Res>
    implements $FocusResponseCopyWith<$Res> {
  _$FocusResponseCopyWithImpl(this._self, this._then);

  final FocusResponse _self;
  final $Res Function(FocusResponse) _then;

/// Create a copy of FocusResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? inProgress = null,Object? highPriority = null,Object? overdue = null,Object? upcoming = null,Object? recentlyUpdated = null,}) {
  return _then(FocusResponse(
inProgress: null == inProgress ? _self.inProgress : inProgress // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,highPriority: null == highPriority ? _self.highPriority : highPriority // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,overdue: null == overdue ? _self.overdue : overdue // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,upcoming: null == upcoming ? _self.upcoming : upcoming // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,recentlyUpdated: null == recentlyUpdated ? _self.recentlyUpdated : recentlyUpdated // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,
  ));
}

}


/// Adds pattern-matching-related methods to [FocusResponse].
extension FocusResponsePatterns on FocusResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FocusResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FocusResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FocusResponse value)  $default,){
final _that = this;
switch (_that) {
case _FocusResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FocusResponse value)?  $default,){
final _that = this;
switch (_that) {
case _FocusResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ItemSummary> inProgress,  List<ItemSummary> highPriority,  List<ItemSummary> overdue,  List<ItemSummary> upcoming,  List<ItemSummary> recentlyUpdated)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FocusResponse() when $default != null:
return $default(_that.inProgress,_that.highPriority,_that.overdue,_that.upcoming,_that.recentlyUpdated);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ItemSummary> inProgress,  List<ItemSummary> highPriority,  List<ItemSummary> overdue,  List<ItemSummary> upcoming,  List<ItemSummary> recentlyUpdated)  $default,) {final _that = this;
switch (_that) {
case _FocusResponse():
return $default(_that.inProgress,_that.highPriority,_that.overdue,_that.upcoming,_that.recentlyUpdated);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ItemSummary> inProgress,  List<ItemSummary> highPriority,  List<ItemSummary> overdue,  List<ItemSummary> upcoming,  List<ItemSummary> recentlyUpdated)?  $default,) {final _that = this;
switch (_that) {
case _FocusResponse() when $default != null:
return $default(_that.inProgress,_that.highPriority,_that.overdue,_that.upcoming,_that.recentlyUpdated);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FocusResponse implements FocusResponse {
  const _FocusResponse({required  List<ItemSummary> inProgress, required  List<ItemSummary> highPriority, required  List<ItemSummary> overdue, required  List<ItemSummary> upcoming, required  List<ItemSummary> recentlyUpdated}): _inProgress = inProgress,_highPriority = highPriority,_overdue = overdue,_upcoming = upcoming,_recentlyUpdated = recentlyUpdated;
  factory _FocusResponse.fromJson(Map<String, dynamic> json) => _$FocusResponseFromJson(json);

 final  List<ItemSummary> _inProgress;
@override List<ItemSummary> get inProgress {
  if (_inProgress is EqualUnmodifiableListView) return _inProgress;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_inProgress);
}

 final  List<ItemSummary> _highPriority;
@override List<ItemSummary> get highPriority {
  if (_highPriority is EqualUnmodifiableListView) return _highPriority;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_highPriority);
}

 final  List<ItemSummary> _overdue;
@override List<ItemSummary> get overdue {
  if (_overdue is EqualUnmodifiableListView) return _overdue;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_overdue);
}

 final  List<ItemSummary> _upcoming;
@override List<ItemSummary> get upcoming {
  if (_upcoming is EqualUnmodifiableListView) return _upcoming;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_upcoming);
}

 final  List<ItemSummary> _recentlyUpdated;
@override List<ItemSummary> get recentlyUpdated {
  if (_recentlyUpdated is EqualUnmodifiableListView) return _recentlyUpdated;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_recentlyUpdated);
}


/// Create a copy of FocusResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FocusResponseCopyWith<_FocusResponse> get copyWith => __$FocusResponseCopyWithImpl<_FocusResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FocusResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FocusResponse&&const DeepCollectionEquality().equals(other.inProgress, _inProgress)&&const DeepCollectionEquality().equals(other.highPriority, _highPriority)&&const DeepCollectionEquality().equals(other.overdue, _overdue)&&const DeepCollectionEquality().equals(other.upcoming, _upcoming)&&const DeepCollectionEquality().equals(other.recentlyUpdated, _recentlyUpdated));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_inProgress),const DeepCollectionEquality().hash(_highPriority),const DeepCollectionEquality().hash(_overdue),const DeepCollectionEquality().hash(_upcoming),const DeepCollectionEquality().hash(_recentlyUpdated));
}

@override
String toString() {
    return 'FocusResponse(inProgress: $inProgress, highPriority: $highPriority, overdue: $overdue, upcoming: $upcoming, recentlyUpdated: $recentlyUpdated)';
}


}

/// @nodoc
abstract mixin class _$FocusResponseCopyWith<$Res> implements $FocusResponseCopyWith<$Res> {
  factory _$FocusResponseCopyWith(_FocusResponse value, $Res Function(_FocusResponse) _then) = __$FocusResponseCopyWithImpl;
@override @useResult
$Res call({
 List<ItemSummary> inProgress, List<ItemSummary> highPriority, List<ItemSummary> overdue, List<ItemSummary> upcoming, List<ItemSummary> recentlyUpdated
});




}
/// @nodoc
class __$FocusResponseCopyWithImpl<$Res>
    implements _$FocusResponseCopyWith<$Res> {
  __$FocusResponseCopyWithImpl(this._self, this._then);

  final _FocusResponse _self;
  final $Res Function(_FocusResponse) _then;

/// Create a copy of FocusResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? inProgress = null,Object? highPriority = null,Object? overdue = null,Object? upcoming = null,Object? recentlyUpdated = null,}) {
  return _then(_FocusResponse(
inProgress: null == inProgress ? _self._inProgress : inProgress // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,highPriority: null == highPriority ? _self._highPriority : highPriority // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,overdue: null == overdue ? _self._overdue : overdue // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,upcoming: null == upcoming ? _self._upcoming : upcoming // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,recentlyUpdated: null == recentlyUpdated ? _self._recentlyUpdated : recentlyUpdated // ignore: cast_nullable_to_non_nullable
as List<ItemSummary>,
  ));
}


}


/// @nodoc
mixin _$RestoreResponse {

 Item get item;@JsonKey(unknownEnumValue: RestoreTarget.unknown) RestoreTarget get restoredTo; int get restoredCount;
/// Create a copy of RestoreResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RestoreResponseCopyWith<RestoreResponse> get copyWith => _$RestoreResponseCopyWithImpl<RestoreResponse>(this as RestoreResponse, _$identity);

  /// Serializes this RestoreResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RestoreResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RestoreResponse&&(identical(other.item, _this.item) || other.item == _this.item)&&(identical(other.restoredTo, _this.restoredTo) || other.restoredTo == _this.restoredTo)&&(identical(other.restoredCount, _this.restoredCount) || other.restoredCount == _this.restoredCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RestoreResponse;
  return Object.hash(runtimeType,_this.item,_this.restoredTo,_this.restoredCount);
}

@override
String toString() {
  final _this = this as RestoreResponse;
  return 'RestoreResponse(item: ${_this.item}, restoredTo: ${_this.restoredTo}, restoredCount: ${_this.restoredCount})';
}


}

/// @nodoc
abstract mixin class $RestoreResponseCopyWith<$Res>  {
  factory $RestoreResponseCopyWith(RestoreResponse value, $Res Function(RestoreResponse) _then) = _$RestoreResponseCopyWithImpl;
@useResult
$Res call({
 Item item,@JsonKey(unknownEnumValue: RestoreTarget.unknown) RestoreTarget restoredTo, int restoredCount
});


$ItemCopyWith<$Res> get item;

}
/// @nodoc
class _$RestoreResponseCopyWithImpl<$Res>
    implements $RestoreResponseCopyWith<$Res> {
  _$RestoreResponseCopyWithImpl(this._self, this._then);

  final RestoreResponse _self;
  final $Res Function(RestoreResponse) _then;

/// Create a copy of RestoreResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? item = null,Object? restoredTo = null,Object? restoredCount = null,}) {
  return _then(RestoreResponse(
item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as Item,restoredTo: null == restoredTo ? _self.restoredTo : restoredTo // ignore: cast_nullable_to_non_nullable
as RestoreTarget,restoredCount: null == restoredCount ? _self.restoredCount : restoredCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}
/// Create a copy of RestoreResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemCopyWith<$Res> get item {
  
  return $ItemCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}


/// Adds pattern-matching-related methods to [RestoreResponse].
extension RestoreResponsePatterns on RestoreResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RestoreResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RestoreResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RestoreResponse value)  $default,){
final _that = this;
switch (_that) {
case _RestoreResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RestoreResponse value)?  $default,){
final _that = this;
switch (_that) {
case _RestoreResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Item item, @JsonKey(unknownEnumValue: RestoreTarget.unknown)  RestoreTarget restoredTo,  int restoredCount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RestoreResponse() when $default != null:
return $default(_that.item,_that.restoredTo,_that.restoredCount);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Item item, @JsonKey(unknownEnumValue: RestoreTarget.unknown)  RestoreTarget restoredTo,  int restoredCount)  $default,) {final _that = this;
switch (_that) {
case _RestoreResponse():
return $default(_that.item,_that.restoredTo,_that.restoredCount);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Item item, @JsonKey(unknownEnumValue: RestoreTarget.unknown)  RestoreTarget restoredTo,  int restoredCount)?  $default,) {final _that = this;
switch (_that) {
case _RestoreResponse() when $default != null:
return $default(_that.item,_that.restoredTo,_that.restoredCount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RestoreResponse implements RestoreResponse {
  const _RestoreResponse({required this.item, @JsonKey(unknownEnumValue: RestoreTarget.unknown) required this.restoredTo, required this.restoredCount});
  factory _RestoreResponse.fromJson(Map<String, dynamic> json) => _$RestoreResponseFromJson(json);

@override final  Item item;
@override@JsonKey(unknownEnumValue: RestoreTarget.unknown) final  RestoreTarget restoredTo;
@override final  int restoredCount;

/// Create a copy of RestoreResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RestoreResponseCopyWith<_RestoreResponse> get copyWith => __$RestoreResponseCopyWithImpl<_RestoreResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RestoreResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RestoreResponse&&(identical(other.item, item) || other.item == item)&&(identical(other.restoredTo, restoredTo) || other.restoredTo == restoredTo)&&(identical(other.restoredCount, restoredCount) || other.restoredCount == restoredCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,item,restoredTo,restoredCount);
}

@override
String toString() {
    return 'RestoreResponse(item: $item, restoredTo: $restoredTo, restoredCount: $restoredCount)';
}


}

/// @nodoc
abstract mixin class _$RestoreResponseCopyWith<$Res> implements $RestoreResponseCopyWith<$Res> {
  factory _$RestoreResponseCopyWith(_RestoreResponse value, $Res Function(_RestoreResponse) _then) = __$RestoreResponseCopyWithImpl;
@override @useResult
$Res call({
 Item item,@JsonKey(unknownEnumValue: RestoreTarget.unknown) RestoreTarget restoredTo, int restoredCount
});


@override $ItemCopyWith<$Res> get item;

}
/// @nodoc
class __$RestoreResponseCopyWithImpl<$Res>
    implements _$RestoreResponseCopyWith<$Res> {
  __$RestoreResponseCopyWithImpl(this._self, this._then);

  final _RestoreResponse _self;
  final $Res Function(_RestoreResponse) _then;

/// Create a copy of RestoreResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? item = null,Object? restoredTo = null,Object? restoredCount = null,}) {
  return _then(_RestoreResponse(
item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as Item,restoredTo: null == restoredTo ? _self.restoredTo : restoredTo // ignore: cast_nullable_to_non_nullable
as RestoreTarget,restoredCount: null == restoredCount ? _self.restoredCount : restoredCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

/// Create a copy of RestoreResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemCopyWith<$Res> get item {
  
  return $ItemCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}


/// @nodoc
mixin _$DeleteResponse {

 bool get ok; int get affected;
/// Create a copy of DeleteResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DeleteResponseCopyWith<DeleteResponse> get copyWith => _$DeleteResponseCopyWithImpl<DeleteResponse>(this as DeleteResponse, _$identity);

  /// Serializes this DeleteResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DeleteResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DeleteResponse&&(identical(other.ok, _this.ok) || other.ok == _this.ok)&&(identical(other.affected, _this.affected) || other.affected == _this.affected));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DeleteResponse;
  return Object.hash(runtimeType,_this.ok,_this.affected);
}

@override
String toString() {
  final _this = this as DeleteResponse;
  return 'DeleteResponse(ok: ${_this.ok}, affected: ${_this.affected})';
}


}

/// @nodoc
abstract mixin class $DeleteResponseCopyWith<$Res>  {
  factory $DeleteResponseCopyWith(DeleteResponse value, $Res Function(DeleteResponse) _then) = _$DeleteResponseCopyWithImpl;
@useResult
$Res call({
 bool ok, int affected
});




}
/// @nodoc
class _$DeleteResponseCopyWithImpl<$Res>
    implements $DeleteResponseCopyWith<$Res> {
  _$DeleteResponseCopyWithImpl(this._self, this._then);

  final DeleteResponse _self;
  final $Res Function(DeleteResponse) _then;

/// Create a copy of DeleteResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? ok = null,Object? affected = null,}) {
  return _then(DeleteResponse(
ok: null == ok ? _self.ok : ok // ignore: cast_nullable_to_non_nullable
as bool,affected: null == affected ? _self.affected : affected // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [DeleteResponse].
extension DeleteResponsePatterns on DeleteResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DeleteResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DeleteResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DeleteResponse value)  $default,){
final _that = this;
switch (_that) {
case _DeleteResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DeleteResponse value)?  $default,){
final _that = this;
switch (_that) {
case _DeleteResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool ok,  int affected)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DeleteResponse() when $default != null:
return $default(_that.ok,_that.affected);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool ok,  int affected)  $default,) {final _that = this;
switch (_that) {
case _DeleteResponse():
return $default(_that.ok,_that.affected);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool ok,  int affected)?  $default,) {final _that = this;
switch (_that) {
case _DeleteResponse() when $default != null:
return $default(_that.ok,_that.affected);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DeleteResponse implements DeleteResponse {
  const _DeleteResponse({required this.ok, required this.affected});
  factory _DeleteResponse.fromJson(Map<String, dynamic> json) => _$DeleteResponseFromJson(json);

@override final  bool ok;
@override final  int affected;

/// Create a copy of DeleteResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DeleteResponseCopyWith<_DeleteResponse> get copyWith => __$DeleteResponseCopyWithImpl<_DeleteResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DeleteResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DeleteResponse&&(identical(other.ok, ok) || other.ok == ok)&&(identical(other.affected, affected) || other.affected == affected));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,ok,affected);
}

@override
String toString() {
    return 'DeleteResponse(ok: $ok, affected: $affected)';
}


}

/// @nodoc
abstract mixin class _$DeleteResponseCopyWith<$Res> implements $DeleteResponseCopyWith<$Res> {
  factory _$DeleteResponseCopyWith(_DeleteResponse value, $Res Function(_DeleteResponse) _then) = __$DeleteResponseCopyWithImpl;
@override @useResult
$Res call({
 bool ok, int affected
});




}
/// @nodoc
class __$DeleteResponseCopyWithImpl<$Res>
    implements _$DeleteResponseCopyWith<$Res> {
  __$DeleteResponseCopyWithImpl(this._self, this._then);

  final _DeleteResponse _self;
  final $Res Function(_DeleteResponse) _then;

/// Create a copy of DeleteResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? ok = null,Object? affected = null,}) {
  return _then(_DeleteResponse(
ok: null == ok ? _self.ok : ok // ignore: cast_nullable_to_non_nullable
as bool,affected: null == affected ? _self.affected : affected // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$PromoteSectionResponse {

 Item get parent; Item get child;
/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoteSectionResponseCopyWith<PromoteSectionResponse> get copyWith => _$PromoteSectionResponseCopyWithImpl<PromoteSectionResponse>(this as PromoteSectionResponse, _$identity);

  /// Serializes this PromoteSectionResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PromoteSectionResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoteSectionResponse&&(identical(other.parent, _this.parent) || other.parent == _this.parent)&&(identical(other.child, _this.child) || other.child == _this.child));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PromoteSectionResponse;
  return Object.hash(runtimeType,_this.parent,_this.child);
}

@override
String toString() {
  final _this = this as PromoteSectionResponse;
  return 'PromoteSectionResponse(parent: ${_this.parent}, child: ${_this.child})';
}


}

/// @nodoc
abstract mixin class $PromoteSectionResponseCopyWith<$Res>  {
  factory $PromoteSectionResponseCopyWith(PromoteSectionResponse value, $Res Function(PromoteSectionResponse) _then) = _$PromoteSectionResponseCopyWithImpl;
@useResult
$Res call({
 Item parent, Item child
});


$ItemCopyWith<$Res> get parent;$ItemCopyWith<$Res> get child;

}
/// @nodoc
class _$PromoteSectionResponseCopyWithImpl<$Res>
    implements $PromoteSectionResponseCopyWith<$Res> {
  _$PromoteSectionResponseCopyWithImpl(this._self, this._then);

  final PromoteSectionResponse _self;
  final $Res Function(PromoteSectionResponse) _then;

/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? parent = null,Object? child = null,}) {
  return _then(PromoteSectionResponse(
parent: null == parent ? _self.parent : parent // ignore: cast_nullable_to_non_nullable
as Item,child: null == child ? _self.child : child // ignore: cast_nullable_to_non_nullable
as Item,
  ));
}
/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemCopyWith<$Res> get parent {
  
  return $ItemCopyWith<$Res>(_self.parent, (value) {
    return _then(_self.copyWith(parent: value));
  });
}/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemCopyWith<$Res> get child {
  
  return $ItemCopyWith<$Res>(_self.child, (value) {
    return _then(_self.copyWith(child: value));
  });
}
}


/// Adds pattern-matching-related methods to [PromoteSectionResponse].
extension PromoteSectionResponsePatterns on PromoteSectionResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PromoteSectionResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PromoteSectionResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PromoteSectionResponse value)  $default,){
final _that = this;
switch (_that) {
case _PromoteSectionResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PromoteSectionResponse value)?  $default,){
final _that = this;
switch (_that) {
case _PromoteSectionResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Item parent,  Item child)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PromoteSectionResponse() when $default != null:
return $default(_that.parent,_that.child);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Item parent,  Item child)  $default,) {final _that = this;
switch (_that) {
case _PromoteSectionResponse():
return $default(_that.parent,_that.child);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Item parent,  Item child)?  $default,) {final _that = this;
switch (_that) {
case _PromoteSectionResponse() when $default != null:
return $default(_that.parent,_that.child);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PromoteSectionResponse implements PromoteSectionResponse {
  const _PromoteSectionResponse({required this.parent, required this.child});
  factory _PromoteSectionResponse.fromJson(Map<String, dynamic> json) => _$PromoteSectionResponseFromJson(json);

@override final  Item parent;
@override final  Item child;

/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PromoteSectionResponseCopyWith<_PromoteSectionResponse> get copyWith => __$PromoteSectionResponseCopyWithImpl<_PromoteSectionResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PromoteSectionResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoteSectionResponse&&(identical(other.parent, parent) || other.parent == parent)&&(identical(other.child, child) || other.child == child));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,parent,child);
}

@override
String toString() {
    return 'PromoteSectionResponse(parent: $parent, child: $child)';
}


}

/// @nodoc
abstract mixin class _$PromoteSectionResponseCopyWith<$Res> implements $PromoteSectionResponseCopyWith<$Res> {
  factory _$PromoteSectionResponseCopyWith(_PromoteSectionResponse value, $Res Function(_PromoteSectionResponse) _then) = __$PromoteSectionResponseCopyWithImpl;
@override @useResult
$Res call({
 Item parent, Item child
});


@override $ItemCopyWith<$Res> get parent;@override $ItemCopyWith<$Res> get child;

}
/// @nodoc
class __$PromoteSectionResponseCopyWithImpl<$Res>
    implements _$PromoteSectionResponseCopyWith<$Res> {
  __$PromoteSectionResponseCopyWithImpl(this._self, this._then);

  final _PromoteSectionResponse _self;
  final $Res Function(_PromoteSectionResponse) _then;

/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? parent = null,Object? child = null,}) {
  return _then(_PromoteSectionResponse(
parent: null == parent ? _self.parent : parent // ignore: cast_nullable_to_non_nullable
as Item,child: null == child ? _self.child : child // ignore: cast_nullable_to_non_nullable
as Item,
  ));
}

/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemCopyWith<$Res> get parent {
  
  return $ItemCopyWith<$Res>(_self.parent, (value) {
    return _then(_self.copyWith(parent: value));
  });
}/// Create a copy of PromoteSectionResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemCopyWith<$Res> get child {
  
  return $ItemCopyWith<$Res>(_self.child, (value) {
    return _then(_self.copyWith(child: value));
  });
}
}


/// @nodoc
mixin _$TagCount {

 String get tag; int get count;
/// Create a copy of TagCount
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TagCountCopyWith<TagCount> get copyWith => _$TagCountCopyWithImpl<TagCount>(this as TagCount, _$identity);

  /// Serializes this TagCount to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TagCount;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TagCount&&(identical(other.tag, _this.tag) || other.tag == _this.tag)&&(identical(other.count, _this.count) || other.count == _this.count));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TagCount;
  return Object.hash(runtimeType,_this.tag,_this.count);
}

@override
String toString() {
  final _this = this as TagCount;
  return 'TagCount(tag: ${_this.tag}, count: ${_this.count})';
}


}

/// @nodoc
abstract mixin class $TagCountCopyWith<$Res>  {
  factory $TagCountCopyWith(TagCount value, $Res Function(TagCount) _then) = _$TagCountCopyWithImpl;
@useResult
$Res call({
 String tag, int count
});




}
/// @nodoc
class _$TagCountCopyWithImpl<$Res>
    implements $TagCountCopyWith<$Res> {
  _$TagCountCopyWithImpl(this._self, this._then);

  final TagCount _self;
  final $Res Function(TagCount) _then;

/// Create a copy of TagCount
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tag = null,Object? count = null,}) {
  return _then(TagCount(
tag: null == tag ? _self.tag : tag // ignore: cast_nullable_to_non_nullable
as String,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [TagCount].
extension TagCountPatterns on TagCount {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TagCount value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TagCount() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TagCount value)  $default,){
final _that = this;
switch (_that) {
case _TagCount():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TagCount value)?  $default,){
final _that = this;
switch (_that) {
case _TagCount() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String tag,  int count)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TagCount() when $default != null:
return $default(_that.tag,_that.count);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String tag,  int count)  $default,) {final _that = this;
switch (_that) {
case _TagCount():
return $default(_that.tag,_that.count);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String tag,  int count)?  $default,) {final _that = this;
switch (_that) {
case _TagCount() when $default != null:
return $default(_that.tag,_that.count);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TagCount implements TagCount {
  const _TagCount({required this.tag, required this.count});
  factory _TagCount.fromJson(Map<String, dynamic> json) => _$TagCountFromJson(json);

@override final  String tag;
@override final  int count;

/// Create a copy of TagCount
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TagCountCopyWith<_TagCount> get copyWith => __$TagCountCopyWithImpl<_TagCount>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TagCountToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TagCount&&(identical(other.tag, tag) || other.tag == tag)&&(identical(other.count, count) || other.count == count));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,tag,count);
}

@override
String toString() {
    return 'TagCount(tag: $tag, count: $count)';
}


}

/// @nodoc
abstract mixin class _$TagCountCopyWith<$Res> implements $TagCountCopyWith<$Res> {
  factory _$TagCountCopyWith(_TagCount value, $Res Function(_TagCount) _then) = __$TagCountCopyWithImpl;
@override @useResult
$Res call({
 String tag, int count
});




}
/// @nodoc
class __$TagCountCopyWithImpl<$Res>
    implements _$TagCountCopyWith<$Res> {
  __$TagCountCopyWithImpl(this._self, this._then);

  final _TagCount _self;
  final $Res Function(_TagCount) _then;

/// Create a copy of TagCount
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tag = null,Object? count = null,}) {
  return _then(_TagCount(
tag: null == tag ? _self.tag : tag // ignore: cast_nullable_to_non_nullable
as String,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
