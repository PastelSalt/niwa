import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show FutureProviderFamily;
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';

/// Outgoing links and backlinks for an item (links panel).
final FutureProviderFamily<ItemLinksResponse, String> itemLinksProvider =
    FutureProvider.family(
      (ref, id) => ref.watch(itemsRepositoryProvider).links(id),
    );
