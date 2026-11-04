import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { useState } from 'react';
import { Page } from '../../components/Page.tsx';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { HintChip } from '../items/chips.tsx';
import { TYPE_LABEL } from '../items/itemMeta.tsx';
import { ItemRow, ItemRowList } from '../items/ItemRow.tsx';
import { useTree } from '../items/queries.ts';
import { useItemActions } from '../items/useItemActions.ts';
import { useQuickCapture } from './CaptureProvider.tsx';
import { FileDialog } from './FileDialog.tsx';
import { useInbox } from './queries.ts';

/** Compact capture time ("now", "5m", "3h", "Nov 3"); the full time is in the tooltip. */
function capturedAgo(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Neutral capture list — everything before it's filed (specs §3, §12.8). */
export function InboxPage() {
  const { data: items, isLoading, error } = useInbox();
  const { data: tree = [] } = useTree();
  const capture = useQuickCapture();
  const actions = useItemActions();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filing, setFiling] = useState<ItemSummary[] | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const list = items ?? [];
  const chosen = list.filter((i) => selected.has(i.id));
  const titleOf = (id: string | null) => (id ? tree.find((t) => t.id === id)?.title : undefined);

  return (
    <Page width="list">
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h2" sx={{ flex: 1 }}>
          Inbox{' '}
          {list.length > 0 && (
            <Typography component="span" color="text.secondary">
              · {list.length}
            </Typography>
          )}
        </Typography>
        <Button variant="contained" startIcon={<AddRounded />} onClick={capture.open}>
          Capture
        </Button>
      </Stack>

      {chosen.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, mb: 1.5 }}
          role="toolbar"
          aria-label="Selection"
        >
          <Typography variant="body2" sx={{ flex: 1 }}>
            {chosen.length} selected
          </Typography>
          <Button size="small" startIcon={<DriveFileMoveOutlined />} onClick={() => setFiling(chosen)}>
            File selected
          </Button>
          <Button size="small" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </Paper>
      )}

      {isLoading && <Skeleton variant="rounded" height={160} />}
      {error && <Alert severity="error">{messageOf(error)}</Alert>}
      {items && list.length === 0 && (
        <EmptyState
          icon={<InboxOutlined />}
          title="Inbox zero"
          description="Press c anywhere to capture a thought. It waits here until you decide where it belongs."
        />
      )}
      {list.length > 0 && (
        <ItemRowList label="Inbox items">
          {list.map((it) => {
            const suggested = titleOf(it.suggestedParentId);
            return (
              <ItemRow
                key={it.id}
                item={it}
                selection={{ checked: selected.has(it.id), onChange: () => toggle(it.id) }}
                meta={
                  <>
                    {TYPE_LABEL[it.type]}
                    {it.inboxedAt && (
                      <>
                        {' · '}
                        <time dateTime={it.inboxedAt} title={new Date(it.inboxedAt).toLocaleString()}>
                          {capturedAgo(it.inboxedAt)}
                        </time>
                      </>
                    )}
                  </>
                }
                chips={suggested && <HintChip label={`→ ${suggested}`} />}
                actions={[
                  {
                    label: 'File',
                    ariaLabel: `File ${it.title}`,
                    icon: <DriveFileMoveOutlined fontSize="small" />,
                    onClick: () => setFiling([it]),
                    primary: true,
                  },
                  {
                    label: 'Delete',
                    ariaLabel: `Delete ${it.title}`,
                    icon: <DeleteOutlineRounded fontSize="small" />,
                    onClick: () => void actions.remove(it, 0),
                  },
                ]}
              />
            );
          })}
        </ItemRowList>
      )}

      {filing && (
        <FileDialog items={filing} onClose={() => setFiling(null)} onDone={() => setSelected(new Set())} />
      )}
    </Page>
  );
}
