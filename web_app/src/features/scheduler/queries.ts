import type { CreateScheduleEntryInput, EditScope, Holiday, UpdateScheduleEntryInput } from '@niwa/contracts';
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

/**
 * Public holidays (B-01 B8) between two local days, inclusive. Keyed by the account's holiday setting so a
 * change in Settings refetches; empty (and no request) when no country is set.
 */
export function useHolidays(from: string, to: string) {
  const { api, user } = useAuth();
  const pref = user?.preferences.holidays;
  return useQuery({
    queryKey: ['holidays', pref?.country, pref?.region, pref?.observances, from, to] as const,
    queryFn: async () => (await api.holidays.range(from, to)).holidays,
    enabled: !!pref?.country,
    staleTime: 24 * 60 * 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Holidays grouped by day key. */
export function holidaysByDay(list: Holiday[] | undefined): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>();
  for (const h of list ?? []) map.set(h.date, [...(map.get(h.date) ?? []), h]);
  return map;
}
