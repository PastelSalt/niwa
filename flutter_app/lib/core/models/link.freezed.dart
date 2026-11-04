// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'link.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Link {

 String get id; String get sourceId; String get targetId; String? get targetAnchorId; String? get label;@JsonKey(unknownEnumValue: LinkOrigin.unknown) LinkOrigin get origin; String? get targetSection; DateTime get createdAt;
/// Create a copy of Link
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LinkCopyWith<Link> get copyWith => _$LinkCopyWithImpl<Link>(this as Link, _$identity);

  /// Serializes this Link to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Link;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Link&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.sourceId, _this.sourceId) || other.sourceId == _this.sourceId)&&(identical(other.targetId, _this.targetId) || other.targetId == _this.targetId)&&(identical(other.targetAnchorId, _this.targetAnchorId) || other.targetAnchorId == _this.targetAnchorId)&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.origin, _this.origin) || other.origin == _this.origin)&&(identical(other.targetSection, _this.targetSection) || other.targetSection == _this.targetSection)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Link;
  return Object.hash(runtimeType,_this.id,_this.sourceId,_this.targetId,_this.targetAnchorId,_this.label,_this.origin,_this.targetSection,_this.createdAt);
}

@override
String toString() {
  final _this = this as Link;
  return 'Link(id: ${_this.id}, sourceId: ${_this.sourceId}, targetId: ${_this.targetId}, targetAnchorId: ${_this.targetAnchorId}, label: ${_this.label}, origin: ${_this.origin}, targetSection: ${_this.targetSection}, createdAt: ${_this.createdAt})';
}


}

/// @nodoc
abstract mixin class $LinkCopyWith<$Res>  {
  factory $LinkCopyWith(Link value, $Res Function(Link) _then) = _$LinkCopyWithImpl;
@useResult
$Res call({
 String id, String sourceId, String targetId, String? targetAnchorId, String? label,@JsonKey(unknownEnumValue: LinkOrigin.unknown) LinkOrigin origin, String? targetSection, DateTime createdAt
});




}
/// @nodoc
class _$LinkCopyWithImpl<$Res>
    implements $LinkCopyWith<$Res> {
  _$LinkCopyWithImpl(this._self, this._then);

  final Link _self;
  final $Res Function(Link) _then;

/// Create a copy of Link
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? sourceId = null,Object? targetId = null,Object? targetAnchorId = freezed,Object? label = freezed,Object? origin = null,Object? targetSection = freezed,Object? createdAt = null,}) {
  return _then(Link(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,sourceId: null == sourceId ? _self.sourceId : sourceId // ignore: cast_nullable_to_non_nullable
as String,targetId: null == targetId ? _self.targetId : targetId // ignore: cast_nullable_to_non_nullable
as String,targetAnchorId: freezed == targetAnchorId ? _self.targetAnchorId : targetAnchorId // ignore: cast_nullable_to_non_nullable
as String?,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,origin: null == origin ? _self.origin : origin // ignore: cast_nullable_to_non_nullable
as LinkOrigin,targetSection: freezed == targetSection ? _self.targetSection : targetSection // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [Link].
extension LinkPatterns on Link {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Link value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Link() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Link value)  $default,){
final _that = this;
switch (_that) {
case _Link():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Link value)?  $default,){
final _that = this;
switch (_that) {
case _Link() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String sourceId,  String targetId,  String? targetAnchorId,  String? label, @JsonKey(unknownEnumValue: LinkOrigin.unknown)  LinkOrigin origin,  String? targetSection,  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Link() when $default != null:
return $default(_that.id,_that.sourceId,_that.targetId,_that.targetAnchorId,_that.label,_that.origin,_that.targetSection,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String sourceId,  String targetId,  String? targetAnchorId,  String? label, @JsonKey(unknownEnumValue: LinkOrigin.unknown)  LinkOrigin origin,  String? targetSection,  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _Link():
return $default(_that.id,_that.sourceId,_that.targetId,_that.targetAnchorId,_that.label,_that.origin,_that.targetSection,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String sourceId,  String targetId,  String? targetAnchorId,  String? label, @JsonKey(unknownEnumValue: LinkOrigin.unknown)  LinkOrigin origin,  String? targetSection,  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _Link() when $default != null:
return $default(_that.id,_that.sourceId,_that.targetId,_that.targetAnchorId,_that.label,_that.origin,_that.targetSection,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Link implements Link {
  const _Link({required this.id, required this.sourceId, required this.targetId, required this.targetAnchorId, required this.label, @JsonKey(unknownEnumValue: LinkOrigin.unknown) required this.origin, required this.targetSection, required this.createdAt});
  factory _Link.fromJson(Map<String, dynamic> json) => _$LinkFromJson(json);

@override final  String id;
@override final  String sourceId;
@override final  String targetId;
@override final  String? targetAnchorId;
@override final  String? label;
@override@JsonKey(unknownEnumValue: LinkOrigin.unknown) final  LinkOrigin origin;
@override final  String? targetSection;
@override final  DateTime createdAt;

/// Create a copy of Link
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LinkCopyWith<_Link> get copyWith => __$LinkCopyWithImpl<_Link>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LinkToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Link&&(identical(other.id, id) || other.id == id)&&(identical(other.sourceId, sourceId) || other.sourceId == sourceId)&&(identical(other.targetId, targetId) || other.targetId == targetId)&&(identical(other.targetAnchorId, targetAnchorId) || other.targetAnchorId == targetAnchorId)&&(identical(other.label, label) || other.label == label)&&(identical(other.origin, origin) || other.origin == origin)&&(identical(other.targetSection, targetSection) || other.targetSection == targetSection)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,sourceId,targetId,targetAnchorId,label,origin,targetSection,createdAt);
}

@override
String toString() {
    return 'Link(id: $id, sourceId: $sourceId, targetId: $targetId, targetAnchorId: $targetAnchorId, label: $label, origin: $origin, targetSection: $targetSection, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$LinkCopyWith<$Res> implements $LinkCopyWith<$Res> {
  factory _$LinkCopyWith(_Link value, $Res Function(_Link) _then) = __$LinkCopyWithImpl;
@override @useResult
$Res call({
 String id, String sourceId, String targetId, String? targetAnchorId, String? label,@JsonKey(unknownEnumValue: LinkOrigin.unknown) LinkOrigin origin, String? targetSection, DateTime createdAt
});




}
/// @nodoc
class __$LinkCopyWithImpl<$Res>
    implements _$LinkCopyWith<$Res> {
  __$LinkCopyWithImpl(this._self, this._then);

  final _Link _self;
  final $Res Function(_Link) _then;

/// Create a copy of Link
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? sourceId = null,Object? targetId = null,Object? targetAnchorId = freezed,Object? label = freezed,Object? origin = null,Object? targetSection = freezed,Object? createdAt = null,}) {
  return _then(_Link(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,sourceId: null == sourceId ? _self.sourceId : sourceId // ignore: cast_nullable_to_non_nullable
as String,targetId: null == targetId ? _self.targetId : targetId // ignore: cast_nullable_to_non_nullable
as String,targetAnchorId: freezed == targetAnchorId ? _self.targetAnchorId : targetAnchorId // ignore: cast_nullable_to_non_nullable
as String?,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,origin: null == origin ? _self.origin : origin // ignore: cast_nullable_to_non_nullable
as LinkOrigin,targetSection: freezed == targetSection ? _self.targetSection : targetSection // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$LinkWithItem {

 Link get link; ItemSummary get item;
/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LinkWithItemCopyWith<LinkWithItem> get copyWith => _$LinkWithItemCopyWithImpl<LinkWithItem>(this as LinkWithItem, _$identity);

  /// Serializes this LinkWithItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LinkWithItem;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LinkWithItem&&(identical(other.link, _this.link) || other.link == _this.link)&&(identical(other.item, _this.item) || other.item == _this.item));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LinkWithItem;
  return Object.hash(runtimeType,_this.link,_this.item);
}

@override
String toString() {
  final _this = this as LinkWithItem;
  return 'LinkWithItem(link: ${_this.link}, item: ${_this.item})';
}


}

/// @nodoc
abstract mixin class $LinkWithItemCopyWith<$Res>  {
  factory $LinkWithItemCopyWith(LinkWithItem value, $Res Function(LinkWithItem) _then) = _$LinkWithItemCopyWithImpl;
@useResult
$Res call({
 Link link, ItemSummary item
});


$LinkCopyWith<$Res> get link;$ItemSummaryCopyWith<$Res> get item;

}
/// @nodoc
class _$LinkWithItemCopyWithImpl<$Res>
    implements $LinkWithItemCopyWith<$Res> {
  _$LinkWithItemCopyWithImpl(this._self, this._then);

  final LinkWithItem _self;
  final $Res Function(LinkWithItem) _then;

/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? link = null,Object? item = null,}) {
  return _then(LinkWithItem(
link: null == link ? _self.link : link // ignore: cast_nullable_to_non_nullable
as Link,item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as ItemSummary,
  ));
}
/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LinkCopyWith<$Res> get link {
  
  return $LinkCopyWith<$Res>(_self.link, (value) {
    return _then(_self.copyWith(link: value));
  });
}/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemSummaryCopyWith<$Res> get item {
  
  return $ItemSummaryCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}


/// Adds pattern-matching-related methods to [LinkWithItem].
extension LinkWithItemPatterns on LinkWithItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LinkWithItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LinkWithItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LinkWithItem value)  $default,){
final _that = this;
switch (_that) {
case _LinkWithItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LinkWithItem value)?  $default,){
final _that = this;
switch (_that) {
case _LinkWithItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Link link,  ItemSummary item)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LinkWithItem() when $default != null:
return $default(_that.link,_that.item);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Link link,  ItemSummary item)  $default,) {final _that = this;
switch (_that) {
case _LinkWithItem():
return $default(_that.link,_that.item);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Link link,  ItemSummary item)?  $default,) {final _that = this;
switch (_that) {
case _LinkWithItem() when $default != null:
return $default(_that.link,_that.item);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LinkWithItem implements LinkWithItem {
  const _LinkWithItem({required this.link, required this.item});
  factory _LinkWithItem.fromJson(Map<String, dynamic> json) => _$LinkWithItemFromJson(json);

@override final  Link link;
@override final  ItemSummary item;

/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LinkWithItemCopyWith<_LinkWithItem> get copyWith => __$LinkWithItemCopyWithImpl<_LinkWithItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LinkWithItemToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LinkWithItem&&(identical(other.link, link) || other.link == link)&&(identical(other.item, item) || other.item == item));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,link,item);
}

@override
String toString() {
    return 'LinkWithItem(link: $link, item: $item)';
}


}

/// @nodoc
abstract mixin class _$LinkWithItemCopyWith<$Res> implements $LinkWithItemCopyWith<$Res> {
  factory _$LinkWithItemCopyWith(_LinkWithItem value, $Res Function(_LinkWithItem) _then) = __$LinkWithItemCopyWithImpl;
@override @useResult
$Res call({
 Link link, ItemSummary item
});


@override $LinkCopyWith<$Res> get link;@override $ItemSummaryCopyWith<$Res> get item;

}
/// @nodoc
class __$LinkWithItemCopyWithImpl<$Res>
    implements _$LinkWithItemCopyWith<$Res> {
  __$LinkWithItemCopyWithImpl(this._self, this._then);

  final _LinkWithItem _self;
  final $Res Function(_LinkWithItem) _then;

/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? link = null,Object? item = null,}) {
  return _then(_LinkWithItem(
link: null == link ? _self.link : link // ignore: cast_nullable_to_non_nullable
as Link,item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as ItemSummary,
  ));
}

/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LinkCopyWith<$Res> get link {
  
  return $LinkCopyWith<$Res>(_self.link, (value) {
    return _then(_self.copyWith(link: value));
  });
}/// Create a copy of LinkWithItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemSummaryCopyWith<$Res> get item {
  
  return $ItemSummaryCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}


/// @nodoc
mixin _$ItemLinksResponse {

 List<LinkWithItem> get outgoing; List<LinkWithItem> get backlinks;
/// Create a copy of ItemLinksResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ItemLinksResponseCopyWith<ItemLinksResponse> get copyWith => _$ItemLinksResponseCopyWithImpl<ItemLinksResponse>(this as ItemLinksResponse, _$identity);

  /// Serializes this ItemLinksResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ItemLinksResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ItemLinksResponse&&const DeepCollectionEquality().equals(other.outgoing, _this.outgoing)&&const DeepCollectionEquality().equals(other.backlinks, _this.backlinks));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ItemLinksResponse;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.outgoing),const DeepCollectionEquality().hash(_this.backlinks));
}

@override
String toString() {
  final _this = this as ItemLinksResponse;
  return 'ItemLinksResponse(outgoing: ${_this.outgoing}, backlinks: ${_this.backlinks})';
}


}

/// @nodoc
abstract mixin class $ItemLinksResponseCopyWith<$Res>  {
  factory $ItemLinksResponseCopyWith(ItemLinksResponse value, $Res Function(ItemLinksResponse) _then) = _$ItemLinksResponseCopyWithImpl;
@useResult
$Res call({
 List<LinkWithItem> outgoing, List<LinkWithItem> backlinks
});




}
/// @nodoc
class _$ItemLinksResponseCopyWithImpl<$Res>
    implements $ItemLinksResponseCopyWith<$Res> {
  _$ItemLinksResponseCopyWithImpl(this._self, this._then);

  final ItemLinksResponse _self;
  final $Res Function(ItemLinksResponse) _then;

/// Create a copy of ItemLinksResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? outgoing = null,Object? backlinks = null,}) {
  return _then(ItemLinksResponse(
outgoing: null == outgoing ? _self.outgoing : outgoing // ignore: cast_nullable_to_non_nullable
as List<LinkWithItem>,backlinks: null == backlinks ? _self.backlinks : backlinks // ignore: cast_nullable_to_non_nullable
as List<LinkWithItem>,
  ));
}

}


/// Adds pattern-matching-related methods to [ItemLinksResponse].
extension ItemLinksResponsePatterns on ItemLinksResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ItemLinksResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ItemLinksResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ItemLinksResponse value)  $default,){
final _that = this;
switch (_that) {
case _ItemLinksResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ItemLinksResponse value)?  $default,){
final _that = this;
switch (_that) {
case _ItemLinksResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<LinkWithItem> outgoing,  List<LinkWithItem> backlinks)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ItemLinksResponse() when $default != null:
return $default(_that.outgoing,_that.backlinks);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<LinkWithItem> outgoing,  List<LinkWithItem> backlinks)  $default,) {final _that = this;
switch (_that) {
case _ItemLinksResponse():
return $default(_that.outgoing,_that.backlinks);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<LinkWithItem> outgoing,  List<LinkWithItem> backlinks)?  $default,) {final _that = this;
switch (_that) {
case _ItemLinksResponse() when $default != null:
return $default(_that.outgoing,_that.backlinks);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ItemLinksResponse implements ItemLinksResponse {
  const _ItemLinksResponse({required  List<LinkWithItem> outgoing, required  List<LinkWithItem> backlinks}): _outgoing = outgoing,_backlinks = backlinks;
  factory _ItemLinksResponse.fromJson(Map<String, dynamic> json) => _$ItemLinksResponseFromJson(json);

 final  List<LinkWithItem> _outgoing;
@override List<LinkWithItem> get outgoing {
  if (_outgoing is EqualUnmodifiableListView) return _outgoing;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_outgoing);
}

 final  List<LinkWithItem> _backlinks;
@override List<LinkWithItem> get backlinks {
  if (_backlinks is EqualUnmodifiableListView) return _backlinks;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_backlinks);
}


/// Create a copy of ItemLinksResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ItemLinksResponseCopyWith<_ItemLinksResponse> get copyWith => __$ItemLinksResponseCopyWithImpl<_ItemLinksResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ItemLinksResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ItemLinksResponse&&const DeepCollectionEquality().equals(other.outgoing, _outgoing)&&const DeepCollectionEquality().equals(other.backlinks, _backlinks));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_outgoing),const DeepCollectionEquality().hash(_backlinks));
}

@override
String toString() {
    return 'ItemLinksResponse(outgoing: $outgoing, backlinks: $backlinks)';
}


}

/// @nodoc
abstract mixin class _$ItemLinksResponseCopyWith<$Res> implements $ItemLinksResponseCopyWith<$Res> {
  factory _$ItemLinksResponseCopyWith(_ItemLinksResponse value, $Res Function(_ItemLinksResponse) _then) = __$ItemLinksResponseCopyWithImpl;
@override @useResult
$Res call({
 List<LinkWithItem> outgoing, List<LinkWithItem> backlinks
});




}
/// @nodoc
class __$ItemLinksResponseCopyWithImpl<$Res>
    implements _$ItemLinksResponseCopyWith<$Res> {
  __$ItemLinksResponseCopyWithImpl(this._self, this._then);

  final _ItemLinksResponse _self;
  final $Res Function(_ItemLinksResponse) _then;

/// Create a copy of ItemLinksResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? outgoing = null,Object? backlinks = null,}) {
  return _then(_ItemLinksResponse(
outgoing: null == outgoing ? _self._outgoing : outgoing // ignore: cast_nullable_to_non_nullable
as List<LinkWithItem>,backlinks: null == backlinks ? _self._backlinks : backlinks // ignore: cast_nullable_to_non_nullable
as List<LinkWithItem>,
  ));
}


}

// dart format on
