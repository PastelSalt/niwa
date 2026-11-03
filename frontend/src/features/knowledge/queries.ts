import type { CreateLinkInput } from '@niwa/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider.tsx';

export const knowledgeKeys = {
  links: (id: string) => ['links', id] as const,
  review: (today: string) => ['review', today] as const,
};

export function useLinks(itemId: string) {
  const { api } = useAuth();
  return useQuery({ queryKey: knowledgeKeys.links(itemId), queryFn: () => api.items.links(itemId) });
}

export function useReview(today: string) {
  const { api } = useAuth();
  return useQuery({
    queryKey: knowledgeKeys.review(today),
    queryFn: async () => (await api.items.review(today)).items,
  });
}

export function useCreateLink() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLinkInput) => api.links.create(input),
    onSuccess: (_r, input) => {
      void qc.invalidateQueries({ queryKey: knowledgeKeys.links(input.sourceId) });
      void qc.invalidateQueries({ queryKey: knowledgeKeys.links(input.targetId) });
    },
  });
}

export function useRemoveLink() {
  const { api } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.links.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['links'] }),
  });
}
