import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/auth/secure_refresh_token_store.dart';
import 'package:niwa/core/config/env.dart';
import 'package:niwa/features/inbox/data/inbox_repository.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/knowledge/data/links_repository.dart';
import 'package:niwa/features/knowledge/data/uploads_repository.dart';
import 'package:niwa/features/scheduler/data/schedule_repository.dart';
import 'package:niwa/features/search/data/search_repository.dart';
import 'package:niwa/features/settings/data/workspace_repository.dart';

/// Overridden in tests with `MemoryRefreshTokenStore`.
final refreshTokenStoreProvider = Provider<RefreshTokenStore>(
  (ref) => const SecureRefreshTokenStore(),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final api = ApiClient(
    baseUrl: Env.apiBase,
    refreshTokens: ref.watch(refreshTokenStoreProvider),
  );
  ref.onDispose(api.close);
  return api;
});

final itemsRepositoryProvider = Provider<ItemsRepository>(
  (ref) => ItemsRepository(ref.watch(apiClientProvider)),
);
final tagsRepositoryProvider = Provider<TagsRepository>(
  (ref) => TagsRepository(ref.watch(apiClientProvider)),
);
final inboxRepositoryProvider = Provider<InboxRepository>(
  (ref) => InboxRepository(ref.watch(apiClientProvider)),
);
final searchRepositoryProvider = Provider<SearchRepository>(
  (ref) => SearchRepository(ref.watch(apiClientProvider)),
);
final scheduleRepositoryProvider = Provider<ScheduleRepository>(
  (ref) => ScheduleRepository(ref.watch(apiClientProvider)),
);
final linksRepositoryProvider = Provider<LinksRepository>(
  (ref) => LinksRepository(ref.watch(apiClientProvider)),
);
final uploadsRepositoryProvider = Provider<UploadsRepository>(
  (ref) => UploadsRepository(ref.watch(apiClientProvider)),
);
final workspaceRepositoryProvider = Provider<WorkspaceRepository>(
  (ref) => WorkspaceRepository(ref.watch(apiClientProvider)),
);
