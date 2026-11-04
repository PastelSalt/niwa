// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'search_hit.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SearchHit {

 ItemSummary get item; String? get snippet;@JsonKey(unknownEnumValue: SearchMatch.unknown) SearchMatch get matchedIn; double get score;
/// Create a copy of SearchHit
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchHitCopyWith<SearchHit> get copyWith => _$SearchHitCopyWithImpl<SearchHit>(this as SearchHit, _$identity);

  /// Serializes this SearchHit to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SearchHit;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchHit&&(identical(other.item, _this.item) || other.item == _this.item)&&(identical(other.snippet, _this.snippet) || other.snippet == _this.snippet)&&(identical(other.matchedIn, _this.matchedIn) || other.matchedIn == _this.matchedIn)&&(identical(other.score, _this.score) || other.score == _this.score));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SearchHit;
  return Object.hash(runtimeType,_this.item,_this.snippet,_this.matchedIn,_this.score);
}

@override
String toString() {
  final _this = this as SearchHit;
  return 'SearchHit(item: ${_this.item}, snippet: ${_this.snippet}, matchedIn: ${_this.matchedIn}, score: ${_this.score})';
}


}

/// @nodoc
abstract mixin class $SearchHitCopyWith<$Res>  {
  factory $SearchHitCopyWith(SearchHit value, $Res Function(SearchHit) _then) = _$SearchHitCopyWithImpl;
@useResult
$Res call({
 ItemSummary item, String? snippet,@JsonKey(unknownEnumValue: SearchMatch.unknown) SearchMatch matchedIn, double score
});


$ItemSummaryCopyWith<$Res> get item;

}
/// @nodoc
class _$SearchHitCopyWithImpl<$Res>
    implements $SearchHitCopyWith<$Res> {
  _$SearchHitCopyWithImpl(this._self, this._then);

  final SearchHit _self;
  final $Res Function(SearchHit) _then;

/// Create a copy of SearchHit
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? item = null,Object? snippet = freezed,Object? matchedIn = null,Object? score = null,}) {
  return _then(SearchHit(
item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as ItemSummary,snippet: freezed == snippet ? _self.snippet : snippet // ignore: cast_nullable_to_non_nullable
as String?,matchedIn: null == matchedIn ? _self.matchedIn : matchedIn // ignore: cast_nullable_to_non_nullable
as SearchMatch,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as double,
  ));
}
/// Create a copy of SearchHit
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemSummaryCopyWith<$Res> get item {
  
  return $ItemSummaryCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}


/// Adds pattern-matching-related methods to [SearchHit].
extension SearchHitPatterns on SearchHit {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SearchHit value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SearchHit() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SearchHit value)  $default,){
final _that = this;
switch (_that) {
case _SearchHit():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SearchHit value)?  $default,){
final _that = this;
switch (_that) {
case _SearchHit() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ItemSummary item,  String? snippet, @JsonKey(unknownEnumValue: SearchMatch.unknown)  SearchMatch matchedIn,  double score)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchHit() when $default != null:
return $default(_that.item,_that.snippet,_that.matchedIn,_that.score);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ItemSummary item,  String? snippet, @JsonKey(unknownEnumValue: SearchMatch.unknown)  SearchMatch matchedIn,  double score)  $default,) {final _that = this;
switch (_that) {
case _SearchHit():
return $default(_that.item,_that.snippet,_that.matchedIn,_that.score);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ItemSummary item,  String? snippet, @JsonKey(unknownEnumValue: SearchMatch.unknown)  SearchMatch matchedIn,  double score)?  $default,) {final _that = this;
switch (_that) {
case _SearchHit() when $default != null:
return $default(_that.item,_that.snippet,_that.matchedIn,_that.score);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SearchHit implements SearchHit {
  const _SearchHit({required this.item, required this.snippet, @JsonKey(unknownEnumValue: SearchMatch.unknown) required this.matchedIn, required this.score});
  factory _SearchHit.fromJson(Map<String, dynamic> json) => _$SearchHitFromJson(json);

@override final  ItemSummary item;
@override final  String? snippet;
@override@JsonKey(unknownEnumValue: SearchMatch.unknown) final  SearchMatch matchedIn;
@override final  double score;

/// Create a copy of SearchHit
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchHitCopyWith<_SearchHit> get copyWith => __$SearchHitCopyWithImpl<_SearchHit>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchHitToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchHit&&(identical(other.item, item) || other.item == item)&&(identical(other.snippet, snippet) || other.snippet == snippet)&&(identical(other.matchedIn, matchedIn) || other.matchedIn == matchedIn)&&(identical(other.score, score) || other.score == score));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,item,snippet,matchedIn,score);
}

@override
String toString() {
    return 'SearchHit(item: $item, snippet: $snippet, matchedIn: $matchedIn, score: $score)';
}


}

/// @nodoc
abstract mixin class _$SearchHitCopyWith<$Res> implements $SearchHitCopyWith<$Res> {
  factory _$SearchHitCopyWith(_SearchHit value, $Res Function(_SearchHit) _then) = __$SearchHitCopyWithImpl;
@override @useResult
$Res call({
 ItemSummary item, String? snippet,@JsonKey(unknownEnumValue: SearchMatch.unknown) SearchMatch matchedIn, double score
});


@override $ItemSummaryCopyWith<$Res> get item;

}
/// @nodoc
class __$SearchHitCopyWithImpl<$Res>
    implements _$SearchHitCopyWith<$Res> {
  __$SearchHitCopyWithImpl(this._self, this._then);

  final _SearchHit _self;
  final $Res Function(_SearchHit) _then;

/// Create a copy of SearchHit
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? item = null,Object? snippet = freezed,Object? matchedIn = null,Object? score = null,}) {
  return _then(_SearchHit(
item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as ItemSummary,snippet: freezed == snippet ? _self.snippet : snippet // ignore: cast_nullable_to_non_nullable
as String?,matchedIn: null == matchedIn ? _self.matchedIn : matchedIn // ignore: cast_nullable_to_non_nullable
as SearchMatch,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

/// Create a copy of SearchHit
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ItemSummaryCopyWith<$Res> get item {
  
  return $ItemSummaryCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}

// dart format on
