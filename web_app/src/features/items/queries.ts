import { ApiError } from '@niwa/api-client';
import type { CreateItemInput, Item, ItemSummary, MoveItemInput, UpdateItemInput } from '@niwa/contracts';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider.tsx';

/** Server state for the item tree (TanStack Query). One cache key per concern. */
export const itemKeys = {
  tree: (includeArchived: boolean) => ['tree', { includeArchived }] as const,
  item: (id: string) => ['item', id] as const,
  focus: (today: string) => ['focus', today] as const,
  trash: ['trash'] as const,
  tags: ['tags'] as const,
};

/** Anything that changes the tree shape or item fields. */
function invalidateTreeViews(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ['tree'] });
  void qc.invalidateQueries({ queryKey: ['focus'] });
  void qc.invalidateQueries({ queryKey: itemKeys.tags });
  void qc.invalidateQueries({ queryKey: ['review'] });
  void qc.invalidateQueries({ queryKey: ['links'] });
}

/**
 * Write a fresh server item into every cache that holds it — the item itself and its row in the
 * tree lists — so the next version-checked write (move, archive, keyboard reorder) isn't stale.
 */
export function storeItem(qc: QueryClient, item: Item) {
  qc.setQueryData(itemKeys.item(item.id), { item });
  const { content: _content, ...summary } = item;
  qc.setQueriesData<ItemSummary[]>({ queryKey: ['tree'] }, (rows) =>
    rows?.map((r) => (r.id === item.id ? { ...r, ...summary } : r)),
  );
}

/** Highest version any cache knows for an item (tree rows can lag behind the item query). */
export function latestVersion(qc: QueryClient, id: string, fallback: number): number {
  const fromItem = qc.getQueryData<{ item: Item }>(itemKeys.item(id))?.item.version ?? 0;
  const fromTree = qc
    .getQueriesData<ItemSummary[]>({ queryKey: ['tree'] })
    .reduce((v, [, rows]) => Math.max(v, rows?.find((r) => r.id === id)?.version ?? 0), 0);
  return Math.max(fallback, fromItem, fromTree);
}

export function useTree(includeArchived = false) {
  const { api } = useAuth();
  return useQuery({
    queryKey: itemKeys.tree(includeArchived),
    queryFn: async () => (await api.items.tree(includeArchived)).items,
  });
}

export function useItem(id: string | undefined) {
  const { api } = useAuth();
  return useQuery({
    queryKey: itemKeys.item(id ?? ''),
    queryFn: () => api.items.get(id!),
    enabled: !!id,
    select: (d) => d.item,
  });
}

export function useFocus(today: string) {
  const { api } = useAuth();
  return useQuery({ queryKey: itemKeys.focus(today), queryFn: () => api.items.focus(today) });
}

export function useTrash() {
  const { api } = useAuth();
  return useQuery({ queryKey: itemKeys.trash, queryFn: async () => (await api.items.trash()).items });
}

export function useTags() {
  const { api } = useAuth();
  return useQuery({ queryKey: itemKeys.tags, queryFn: async () => (await api.tags.list()).tags });
}

export function useCreateItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => api.items.create(input),
    onSuccess: ({ item }) => {
      storeItem(qc, item);
      invalidateTreeViews(qc);
    },
  });
}

/** Version-checked patch. Pass the version you last saw; conflicts refresh the cache. */
export function useUpdateItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateItemInput }) =>
      api.items.update(id, { ...input, version: latestVersion(qc, id, input.version) }),
    onSuccess: ({ item }) => {
      storeItem(qc, item);
      invalidateTreeViews(qc);
    },
    onError: (err, { id }) => {
      if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
        void qc.invalidateQueries({ queryKey: itemKeys.item(id) });
        invalidateTreeViews(qc);
      }
    },
  });
}

export function useMoveItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveItemInput }) =>
      api.items.move(id, { ...input, version: latestVersion(qc, id, input.version) }),
    onSuccess: ({ item }) => {
      storeItem(qc, item);
      invalidateTreeViews(qc);
    },
    onError: () => invalidateTreeViews(qc),
  });
}

export function useArchiveItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ item, archived }: { item: Pick<ItemSummary, 'id' | 'version'>; archived: boolean }) =>
      archived
        ? api.items.archive(item.id, latestVersion(qc, item.id, item.version))
        : api.items.unarchive(item.id, latestVersion(qc, item.id, item.version)),
    onSuccess: ({ item }) => {
      storeItem(qc, item);
      invalidateTreeViews(qc);
    },
  });
}

export function useDeleteItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.items.remove(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: itemKeys.item(id) });
      invalidateTreeViews(qc);
      void qc.invalidateQueries({ queryKey: itemKeys.trash });
    },
  });
}

export function useRestoreItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.items.restore(id),
    onSuccess: ({ item }) => {
      storeItem(qc, item);
      invalidateTreeViews(qc);
      void qc.invalidateQueries({ queryKey: itemKeys.trash });
    },
  });
}

export function usePurgeItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.items.purge(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: itemKeys.trash }),
  });
}
