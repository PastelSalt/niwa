import type { CreateScheduleEntryInput, EditScope, UpdateScheduleEntryInput } from '@niwa/contracts';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider.tsx';

export const scheduleKeys = {
  range: (from: string, to: string) => ['schedule', from, to] as const,
  forItem: (itemId: string) => ['itemSchedule', itemId] as const,
};

const invalidate = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: ['schedule'] });
  void qc.invalidateQueries({ queryKey: ['itemSchedule'] });
};

export function useScheduleRange(from: string, to: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: scheduleKeys.range(from, to),
    queryFn: async () => (await api.schedule.range(from, to)).entries,
    placeholderData: (prev) => prev, // keep the grid filled while paging
  });
}

export function useItemSchedule(itemId: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: scheduleKeys.forItem(itemId),
    queryFn: async () => (await api.schedule.forItem(itemId)).entries,
  });
}

export function useCreateEntry() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScheduleEntryInput) => api.schedule.create(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateEntry() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, scope }: { id: string; input: UpdateScheduleEntryInput; scope?: EditScope }) =>
      api.schedule.update(id, input, scope),
    onSettled: () => invalidate(qc),
  });
}

export function useDeleteEntry() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope }: { id: string; scope?: EditScope }) => api.schedule.remove(id, scope),
    onSettled: () => invalidate(qc),
  });
}
