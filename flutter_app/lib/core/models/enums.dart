import 'package:json_annotation/json_annotation.dart';

part 'enums.g.dart';

// Contract enums (packages/contracts). Each has an `unknown` member that
// json_serializable falls back to (`unknownEnumValue`), so a newer server
// adding a value never crashes an older app. Never send `unknown` back.

@JsonEnum(alwaysCreate: true)
enum ItemType { project, task, note, idea, unknown }

@JsonEnum(alwaysCreate: true)
enum ItemNature { knowledge, actionable, unknown }

@JsonEnum(alwaysCreate: true, fieldRename: FieldRename.snake)
enum ItemStatus { notStarted, inProgress, blocked, completed, unknown }

@JsonEnum(alwaysCreate: true)
enum ItemPriority { none, low, medium, high, critical, unknown }

@JsonEnum(alwaysCreate: true)
enum LinkOrigin { content, manual, unknown }

@JsonEnum(alwaysCreate: true)
enum ScheduleKind { event, block, unknown }

@JsonEnum(alwaysCreate: true)
enum Recurrence { none, daily, weekly, monthly, unknown }

/// Where `/items/:id/restore` put the item (DATA_MODEL.md §5).
@JsonEnum(alwaysCreate: true)
enum RestoreTarget { original, inbox, unknown }

@JsonEnum(alwaysCreate: true)
enum SearchMatch { title, tags, content, unknown }

@JsonEnum(alwaysCreate: true)
enum AttachmentMime {
  @JsonValue('image/png')
  png,
  @JsonValue('image/jpeg')
  jpeg,
  @JsonValue('image/webp')
  webp,
  @JsonValue('image/gif')
  gif,
  unknown,
}

@JsonEnum(alwaysCreate: true, fieldRename: FieldRename.screamingSnake)
enum ErrorCode {
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  versionConflict,
  rateLimited,
  registrationClosed,
  invalidCredentials,
  aiKeyMissing,
  aiKeyInvalid,
  aiDisabled,
  upstreamError,
  notConfigured,
  internalError,
  unknown,
}

/// Wire spelling of contract enums, for request bodies and query strings.
/// `unknown` exists only for decoding; sending it is a bug.
String _wire<T extends Enum>(Map<T, String> map, T value) {
  if (value.name == 'unknown') {
    throw ArgumentError.value(value, 'value', 'unknown is decode-only');
  }
  return map[value]!;
}

extension ItemTypeWire on ItemType {
  String get wire => _wire(_$ItemTypeEnumMap, this);
}

extension ItemNatureWire on ItemNature {
  String get wire => _wire(_$ItemNatureEnumMap, this);
}

extension ItemStatusWire on ItemStatus {
  String get wire => _wire(_$ItemStatusEnumMap, this);
}

extension ItemPriorityWire on ItemPriority {
  String get wire => _wire(_$ItemPriorityEnumMap, this);
}

extension ScheduleKindWire on ScheduleKind {
  String get wire => _wire(_$ScheduleKindEnumMap, this);
}

extension RecurrenceWire on Recurrence {
  String get wire => _wire(_$RecurrenceEnumMap, this);
}

@JsonEnum(alwaysCreate: true)
enum OnboardingStatus { completed, skipped, unknown }
