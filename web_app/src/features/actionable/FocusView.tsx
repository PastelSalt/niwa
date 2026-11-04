import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { FocusResponse, ItemSummary } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { RowSkeletons } from '../items/RowSkeletons.tsx';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { Page } from '../../components/Page.tsx';
import { usePersistentState } from '../../lib/usePersistentState.ts';
import { DueChip, PriorityChip, StatusChip } from '../items/chips.tsx';
import { formatDay, todayLocal } from '../items/itemMeta.tsx';
import { ItemRow, ItemRowList } from '../items/ItemRow.tsx';
import { useFocus, useTree, useUpdateItem } from '../items/queries.ts';
import { ancestorsOf, buildTree, type TreeModel } from '../items/treeModel.ts';
import { dedupeFocus, FOCUS_SECTIONS } from './focusSections.ts';

/** Cross-project focus — specs §2.1 #3, §4.2. Each task once, in its most urgent section (B-02 V3). */
export function FocusView() {
  const today = todayLocal();
  const { data: raw, isLoading, error } = useFocus(today);
  const { data: treeItems } = useTree();
  const model = useMemo(() => buildTree(treeItems ?? []), [treeItems]);
  const data = useMemo(() => (raw ? dedupeFocus(raw) : undefined), [raw]);
  const [collapsed, setCollapsed] = usePersistentState<string[]>('niwa.focus.collapsed', []);

  if (error)
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {messageOf(error)}
      </Alert>
    );

  const empty = data && Object.values(data).every((list) => list.length === 0);

  return (
    <Page width="list">
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Focus
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        What matters across every project, today ({formatDay(today)}).
      </Typography>

      {isLoading && <RowSkeletons rows={4} />}

      {empty && (
        <EmptyState
          icon={<TaskAltOutlined />}
          title="A calm garden"
          description="Create projects and tasks in the tree on the left. Anything in progress, urgent or due soon will show up here."
        />
      )}

      {data &&
        !empty &&
        FOCUS_SECTIONS.filter((s) => data[s.key].length > 0).map((s) => {
          const open = !collapsed.includes(s.key);
          const listId = `focus-${s.key}`;
          return (
            <Box key={s.key} component="section" aria-label={s.title} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
                <ButtonBase
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() => setCollapsed((c) => (open ? [...c, s.key] : c.filter((k) => k !== s.key)))}
                  sx={{ gap: 0.5, borderRadius: 1, pr: 1, typography: 'subtitle2' }}
                >
                  <ExpandMoreRounded
                    fontSize="small"
                    sx={(t) => ({
                      transform: open ? 'none' : 'rotate(-90deg)',
                      transition: t.transitions.create('transform'),
                    })}
                  />
                  {s.title}
                  <Typography component="span" variant="caption" color="text.secondary">
                    {data[s.key].length}
                  </Typography>
                </ButtonBase>
              </Typography>
              {open && (
                <Box id={listId}>
                  <ItemRowList label={s.title}>
                    {data[s.key].map((item) => (
                      <FocusRow key={item.id} item={item} model={model} today={today} section={s.key} />
                    ))}
                  </ItemRowList>
                </Box>
              )}
            </Box>
          );
        })}
    </Page>
  );
}

function FocusRow({
  item,
  model,
  today,
  section,
}: {
  item: ItemSummary;
  model: TreeModel;
  today: string;
  section: keyof FocusResponse;
}) {
  const update = useUpdateItem();
  const notify = useNotify();
  // Optimistic: the control flips immediately; the server result (or an error) settles it.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const serverDone = item.status === 'completed';
  // Hold the optimistic value until the refreshed list agrees (avoids a flicker back).
  if (optimistic !== null && optimistic === serverDone) setOptimistic(null);
  const done = optimistic ?? serverDone;
  const path = ancestorsOf(model, item.id)
    .map((a) => a.title)
    .join(' › ');

  const toggle = () => {
    const next = !done;
    setOptimistic(next);
    update.mutate(
      { id: item.id, input: { version: item.version, status: next ? 'completed' : 'in_progress' } },
      {
        onSuccess: () => next && notify(`Completed “${item.title}”`),
        onError: (err) => {
          setOptimistic(null);
          notify(messageOf(err), { severity: 'error' });
        },
      },
    );
  };

  return (
    <ItemRow
      item={item}
      to={`/actionable/${item.id}`}
      done={done}
      completion={{ done, onToggle: toggle }}
      meta={path || 'Top level'}
      chips={
        <>
          {/* The section already says "In progress". */}
          {item.status !== 'not_started' && !done && section !== 'inProgress' && (
            <StatusChip status={item.status} />
          )}
          {item.priority !== 'low' && <PriorityChip priority={item.priority} />}
          {item.dueAt && <DueChip due={item.dueAt} today={today} done={done} />}
        </>
      }
    />
  );
}
