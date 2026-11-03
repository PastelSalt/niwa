import type { CaptureInput, FileItemInput } from '@niwa/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { latestVersion, storeItem } from '../items/queries.ts';

export const inboxKeys = { list: ['inbox'] as const };

export function useInbox() {
  const { api } = useAuth();
  return useQuery({ queryKey: inboxKeys.list, queryFn: async () => (await api.inbox.list()).items });
}

export function useCapture() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CaptureInput) => api.inbox.capture(input),
    onSuccess: ({ item }) => {
      storeItem(qc, item);
      void qc.invalidateQueries({ queryKey: inboxKeys.list });
    },
  });
}

/** File one inbox item into the tree. */
export function useFileItem() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FileItemInput }) =>
      api.inbox.file(id, { ...input, version: latestVersion(qc, id, input.version) }),
    onSuccess: ({ item }) => storeItem(qc, item),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: inboxKeys.list });
      void qc.invalidateQueries({ queryKey: ['tree'] });
      void qc.invalidateQueries({ queryKey: ['focus'] });
    },
  });
}
