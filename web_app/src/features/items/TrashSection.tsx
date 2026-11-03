import DeleteForeverOutlined from '@mui/icons-material/DeleteForeverOutlined';
import RestoreFromTrashOutlined from '@mui/icons-material/RestoreFromTrashOutlined';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { useItemDialogs } from './ItemDialogs.tsx';
import { ItemTypeIcon } from './itemMeta.tsx';
import { usePurgeItem, useRestoreItem, useTrash } from './queries.ts';

/** Settings → Trash: restore or delete permanently (specs §12.6). */
export function TrashSection() {
  const { data, isLoading, error } = useTrash();
  const restore = useRestoreItem();
  const purge = usePurgeItem();
  const notify = useNotify();
  const dialogs = useItemDialogs();

  const onRestore = async (item: ItemSummary) => {
    try {
      const res = await restore.mutateAsync(item.id);
      notify(
        res.restoredTo === 'inbox'
          ? `Restored “${item.title}” to the Inbox (its parent is gone)`
          : `Restored “${item.title}”${res.restoredCount > 1 ? ` and ${res.restoredCount - 1} inside it` : ''}`,
      );
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    }
  };

  const onPurge = async (item: ItemSummary) => {
    const ok = await dialogs.confirm({
      title: 'Delete permanently?',
      body: `“${item.title}” and everything inside it will be gone for good. This can't be undone.`,
      confirmLabel: 'Delete forever',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await purge.mutateAsync(item.id);
      notify(`Deleted ${res.affected} item${res.affected === 1 ? '' : 's'} permanently`, {
        severity: 'info',
      });
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Deleted items wait here with everything that was inside them. Restoring puts them back where they
        were.
      </Typography>
      {isLoading && <Skeleton variant="rounded" height={120} />}
      {error && <Alert severity="error">{messageOf(error)}</Alert>}
      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Trash is empty.
        </Typography>
      )}
      {data && data.length > 0 && (
        <Paper variant="outlined">
          <List dense disablePadding aria-label="Trash">
            {data.map((item) => (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <>
                    <Tooltip title="Restore">
                      <IconButton aria-label={`Restore ${item.title}`} onClick={() => void onRestore(item)}>
                        <RestoreFromTrashOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete permanently">
                      <IconButton
                        aria-label={`Delete ${item.title} permanently`}
                        edge="end"
                        color="error"
                        onClick={() => void onPurge(item)}
                      >
                        <DeleteForeverOutlined />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ItemTypeIcon type={item.type} fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={
                    item.deletedAt ? `Deleted ${new Date(item.deletedAt).toLocaleString()}` : undefined
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  );
}
