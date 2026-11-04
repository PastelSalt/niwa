import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/models/models.dart';
import 'package:yaml/yaml.dart';

/// Contract check (plan A-02 MA1.P3): keeps the Dart models in step with
/// `packages/contracts/openapi.yaml`.
///
/// For every schema the app models, `test/fixtures/<Schema>.json`:
/// 1. matches the OpenAPI schema field-for-field and type-for-type, and
/// 2. round-trips through the Dart model unchanged.
///
/// Together these mean the model has exactly the contract's fields. Then, per
/// top-level field, the model is probed directly: `null` must parse only where
/// the contract allows it, optional fields may be absent, and every enum value
/// the contract lists must decode to a real (not `unknown`) Dart value.

typedef Json = Map<String, dynamic>;
typedef RoundTrip = Json Function(Json json);

/// Contract schema name → model round-trip.
final Map<String, RoundTrip> models = {
  'Item': (j) => Item.fromJson(j).toJson(),
  'ItemSummary': (j) => ItemSummary.fromJson(j).toJson(),
  'PublicUser': (j) => User.fromJson(j).toJson(),
  'AuthResponse': (j) => AuthResponse.fromJson(j).toJson(),
  'Workspace': (j) => Workspace.fromJson(j).toJson(),
  'Link': (j) => Link.fromJson(j).toJson(),
  'LinkWithItem': (j) => LinkWithItem.fromJson(j).toJson(),
  'ScheduleEntry': (j) => ScheduleEntry.fromJson(j).toJson(),
  'SearchHit': (j) => SearchHit.fromJson(j).toJson(),
  'Attachment': (j) => Attachment.fromJson(j).toJson(),
  'ErrorEnvelope': (j) => ErrorEnvelope.fromJson(j).toJson(),
  'FocusResponse': (j) => FocusResponse.fromJson(j).toJson(),
  'RestoreResponse': (j) => RestoreResponse.fromJson(j).toJson(),
  'DeleteResponse': (j) => DeleteResponse.fromJson(j).toJson(),
  'PromoteSectionResponse': (j) => PromoteSectionResponse.fromJson(j).toJson(),
  'TagCount': (j) => TagCount.fromJson(j).toJson(),
  'ItemLinksResponse': (j) => ItemLinksResponse.fromJson(j).toJson(),
  'UploadConfigResponse': (j) => UploadConfigResponse.fromJson(j).toJson(),
  'UploadSignatureResponse': (j) =>
      UploadSignatureResponse.fromJson(j).toJson(),
};

const _deepEq = DeepCollectionEquality();

late final Json _schemas;

/// YAML → plain Dart maps/lists.
Object? _plain(Object? node) => switch (node) {
  final YamlMap m => {
    for (final e in m.entries) e.key as String: _plain(e.value),
  },
  final YamlList l => [for (final v in l) _plain(v)],
  _ => node,
};

Json _resolve(Json schema) {
  final ref = schema[r'$ref'] as String?;
  if (ref == null) return schema;
  return _resolve(_schemas[ref.split('/').last] as Json);
}

/// JSON types a schema admits. Composition (`allOf`/`anyOf`/`oneOf`) is merged
/// as a union: zod-openapi expresses `.nullable()` on a `$ref` as
/// `allOf: [$ref, {type: [string, "null"]}]`. Empty set = any type.
Set<String> _types(Json schema) {
  final s = _resolve(schema);
  final out = <String>{};
  switch (s['type']) {
    case final String t:
      out.add(t);
    case final List<Object?> ts:
      out.addAll(ts.cast<String>());
  }
  for (final key in ['allOf', 'anyOf', 'oneOf']) {
    for (final part in (s[key] as List<Object?>?) ?? const []) {
      out.addAll(_types(part! as Json));
    }
  }
  return out;
}

List<Object?>? _enumValues(Json schema) {
  final s = _resolve(schema);
  if (s['enum'] case final List<Object?> values) return values;
  for (final key in ['allOf', 'anyOf', 'oneOf']) {
    for (final part in (s[key] as List<Object?>?) ?? const []) {
      final values = _enumValues(part! as Json);
      if (values != null) return values;
    }
  }
  return null;
}

/// Object properties of a schema, following `$ref` and `allOf`.
Json? _properties(Json schema) {
  final s = _resolve(schema);
  if (s['properties'] case final Json props) return props;
  for (final part in (s['allOf'] as List<Object?>?) ?? const []) {
    final props = _properties(part! as Json);
    if (props != null) return props;
  }
  return null;
}

Set<String> _required(Json schema) {
  final s = _resolve(schema);
  return {...?(s['required'] as List<Object?>?)?.cast<String>()};
}

String _jsonType(Object? v) => switch (v) {
  null => 'null',
  String() => 'string',
  bool() => 'boolean',
  int() => 'integer',
  double() => 'number',
  List<Object?>() => 'array',
  Map<String, Object?>() => 'object',
  _ => throw ArgumentError('Not JSON: $v'),
};

/// Problems with [value] against [schema], as `path: message` strings.
List<String> _validate(Object? value, Json schema, String path) {
  final s = _resolve(schema);
  final types = _types(s);
  final actual = _jsonType(value);
  final typeOk =
      types.isEmpty ||
      types.contains(actual) ||
      (actual == 'integer' && types.contains('number'));
  if (!typeOk) return ['$path: $actual, contract allows $types'];

  final problems = <String>[];
  final values = _enumValues(s);
  if (value != null && values != null && !values.contains(value)) {
    problems.add('$path: "$value" not in $values');
  }
  if (value is Map<String, Object?>) {
    final props = _properties(s);
    if (props != null) {
      // Open objects (e.g. ProseMirrorDoc) may carry extra keys.
      final open = s.containsKey('additionalProperties');
      final extra = value.keys.toSet().difference(props.keys.toSet());
      if (!open && extra.isNotEmpty) {
        problems.add('$path: fields not in contract: $extra');
      }
      final missing = _required(s).difference(value.keys.toSet());
      if (missing.isNotEmpty) problems.add('$path: missing required $missing');
      for (final MapEntry(:key, value: v) in value.entries) {
        if (props[key] case final Json prop) {
          problems.addAll(_validate(v, prop, '$path.$key'));
        }
      }
    }
  }
  if (value is List<Object?>) {
    if (s['items'] case final Json items) {
      for (final (i, v) in value.indexed) {
        problems.addAll(_validate(v, items, '$path[$i]'));
      }
    }
  }
  return problems;
}

Json _fixture(String name) =>
    jsonDecode(File('test/fixtures/$name.json').readAsStringSync()) as Json;

/// A field to probe: its path from the model root, schema and whether the
/// enclosing object requires it.
typedef _Field = ({List<String> path, Json schema, bool required});

/// Top-level fields, plus fields of inline nested objects (e.g.
/// `ErrorEnvelope.error.code`). Nested `$ref` models are probed by their own
/// group.
Iterable<_Field> _fields(Json schema, [List<String> prefix = const []]) sync* {
  final props = _properties(schema) ?? const {};
  final required = _required(schema);
  for (final MapEntry(key: name, value: prop as Json) in props.entries) {
    final path = [...prefix, name];
    yield (path: path, schema: prop, required: required.contains(name));
    if (!prop.containsKey(r'$ref') && prop['properties'] != null) {
      yield* _fields(prop, path);
    }
  }
}

/// Copy of [json] with the value at [path] replaced ([remove]: deleted).
Json _withAt(
  Json json,
  List<String> path,
  Object? value, {
  bool remove = false,
}) {
  final copy = {...json};
  final [head, ...rest] = path;
  if (rest.isEmpty) {
    remove ? copy.remove(head) : copy[head] = value;
  } else {
    copy[head] = _withAt(copy[head] as Json, rest, value, remove: remove);
  }
  return copy;
}

/// The value at [path], or [_absent] if a key on the way is missing.
Object? _at(Json json, List<String> path) {
  Object? node = json;
  for (final key in path) {
    if (node is! Map<String, Object?> || !node.containsKey(key)) return _absent;
    node = node[key];
  }
  return node;
}

const Object _absent = #absent;

void main() {
  final doc =
      _plain(
            loadYaml(
              File('../packages/contracts/openapi.yaml').readAsStringSync(),
            ),
          )!
          as Json;
  _schemas = (doc['components'] as Json)['schemas'] as Json;

  for (final MapEntry(key: name, value: roundTrip) in models.entries) {
    group(name, () {
      final schema = _schemas[name] as Json?;
      test('exists in openapi.yaml', () => expect(schema, isNotNull));
      if (schema == null) return;
      final fixture = _fixture(name);

      test('fixture matches the contract', () {
        expect(_validate(fixture, schema, name), isEmpty);
        // Every contract field is exercised, optional ones included.
        expect(fixture.keys.toSet(), _properties(schema)!.keys.toSet());
      });

      test('round-trips through the Dart model', () {
        final out = jsonDecode(jsonEncode(roundTrip(fixture)));
        expect(_deepEq.equals(out, fixture), isTrue, reason: '$out');
      });

      for (final f in _fields(schema)) {
        final label = f.path.join('.');
        if (f.required) {
          final types = _types(f.schema);
          final nullable = types.isEmpty || types.contains('null');
          test('$label: null ${nullable ? 'accepted' : 'rejected'}', () {
            final json = _withAt(fixture, f.path, null);
            if (nullable) {
              expect(_at(roundTrip(json), f.path), isNull);
            } else {
              expect(() => roundTrip(json), throwsA(anything));
            }
          });
        } else {
          test('$label: optional, may be absent', () {
            final json = _withAt(fixture, f.path, null, remove: true);
            expect(_at(roundTrip(json), f.path), same(_absent));
          });
        }

        // String enums only; `z.literal(true)` shows up as a boolean enum.
        final values = _enumValues(f.schema)?.whereType<String>().toList();
        if (values != null && values.isNotEmpty) {
          test('$label: every contract value decodes', () {
            for (final v in values) {
              final out = roundTrip(_withAt(fixture, f.path, v));
              expect(_at(out, f.path), v);
            }
          });
          test('$label: unknown value falls back', () {
            final json = _withAt(fixture, f.path, 'added_by_newer_server');
            // The `unknown` member, in whatever case the enum serialises with.
            final out = _at(roundTrip(json), f.path)! as String;
            expect(out.toLowerCase(), 'unknown');
          });
        }
      }
    });
  }
}
