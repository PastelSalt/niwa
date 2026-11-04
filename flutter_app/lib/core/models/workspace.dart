import 'package:freezed_annotation/freezed_annotation.dart';

part 'workspace.freezed.dart';
part 'workspace.g.dart';

/// Contract `Workspace`.
@freezed
abstract class Workspace with _$Workspace {
  const factory({
    required String id,
    required String name,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Workspace;

  factory fromJson(Map<String, dynamic> json) => _$WorkspaceFromJson(json);
}
