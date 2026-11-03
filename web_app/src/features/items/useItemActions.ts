import type { ItemSummary } from '@niwa/contracts';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { useItemDialogs } from './ItemDialogs.tsx';
import { useArchiveItem, useDeleteItem, useMoveItem, useRestoreItem } from './queries.ts';
import type { MoveItemInput } from '@niwa/contracts';

/** Shared item commands for the tree menu, keyboard and detail panel. */
export function useItemActions() {
  const notify = useNotify();
  const dialogs = useItemDialogs();
  const navigate = useNavigate();
  const location = useLocation();
  const deleteItem = useDeleteItem();
  const restoreItem = useRestoreItem();
  const archiveItem = useArchiveItem();
  const moveItem = useMoveItem();

  const move = useCallback(
    async (m: { id: string; input: MoveItemInput } | null) => {
      if (!m) return;
      try {
        await moveItem.mutateAsync(m);
      } catch (err) {
        notify(messageOf(err), { severity: 'error' });
      }
    },
    [moveItem, notify],
  );

  const remove = useCallback(
    async (item: ItemSummary, childCount: number) => {
      if (childCount > 0) {
        const ok = await dialogs.confirm({
          title: `Delete “${item.title}”?`,
          body: `This also moves ${childCount === 1 ? 'its 1 child' : `everything inside it`} to Trash. You can restore it from Settings → Trash.`,
          confirmLabel: 'Move to Trash',
          danger: true,
        });
        if (!ok) return;
      }
      try {
        const res = await deleteItem.mutateAsync(item.id);
        if (location.pathname.endsWith(item.id)) navigate(location.pathname.replace(`/${item.id}`, ''));
        notify(res.affected > 1 ? `Moved ${res.affected} items to Trash` : `Moved “${item.title}” to Trash`, {
          severity: 'info',
          action: {
            label: 'Undo',
            onClick: () =>
              void restoreItem.mutateAsync(item.id).catch((e) => notify(messageOf(e), { severity: 'error' })),
          },
        });
      } catch (err) {
        notify(messageOf(err), { severity: 'error' });
      }
    },
    [deleteItem, restoreItem, dialogs, notify, navigate, location.pathname],
  );

  const setArchived = useCallback(
    async (item: ItemSummary, archived: boolean) => {
      try {
        await archiveItem.mutateAsync({ item, archived });
        notify(archived ? `Archived “${item.title}”` : `Unarchived “${item.title}”`, {
          severity: 'info',
          action: archived
            ? {
                label: 'Undo',
                onClick: () =>
                  void archiveItem.mutateAsync({
                    item: { id: item.id, version: item.version + 1 },
                    archived: false,
                  }),
              }
            : undefined,
        });
      } catch (err) {
        notify(messageOf(err), { severity: 'error' });
      }
    },
    [archiveItem, notify],
  );

  return { move, remove, setArchived, openCreate: dialogs.openCreate, openMove: dialogs.openMove };
}
