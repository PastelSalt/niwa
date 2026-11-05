import AddRounded from '@mui/icons-material/AddRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import type { Item, ItemType } from '@niwa/contracts';
import { useState } from 'react';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { friendlyDate } from '../../lib/friendlyTime.ts';
import { DueChip, HintChip, PriorityChip, StatusChip, TagChip } from './chips.tsx';
import { ItemFields, type FieldKey } from './ItemFields.tsx';
import { ItemTypeIcon, TYPE_LABEL } from './itemMeta.tsx';
import { useUpdateItem } from './queries.ts';

/**
 * Under an item's title (NIWA-PLAN-B-01 B11): its type with **Turn into…**, a chip for every field that's set
 * (click to edit), and **+ Add** for the rest. Replaces the always-open Details panel as the everyday way to
 * edit an item; the panel is still there from the top bar.
 */

const FIELD_LABEL: Partial<Record<FieldKey, string>> = {
  status: 'Status',
  priority: 'Priority',
  due: 'Due date',
  review: 'Review date',
  tags: 'Tags',
  estimate: 'Time estimate',
  source: 'Source link',
  schedule: 'Time on the calendar',
};

const TYPES: ItemType[] = ['note', 'idea', 'task', 'project'];
const TURN_INTO_HINT: Record<ItemType, string> = {
  note: 'For writing',
  idea: 'A thought to grow later',
  task: 'Something to do, with a date and status',
  project: 'A goal made of tasks',
};

export function FieldBar({ item, today }: { item: Item; today: string }) {
  const update = useUpdateItem();
  const notify = useNotify();
  const [editing, setEditing] = useState<{ key: FieldKey; anchor: HTMLElement } | null>(null);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const [typeAnchor, setTypeAnchor] = useState<HTMLElement | null>(null);
  const actionable = item.nature === 'actionable';
  const open = (key: FieldKey) => (e: React.MouseEvent<HTMLElement>) =>
    setEditing({ key, anchor: e.currentTarget });

  const isSet: Partial<Record<FieldKey, boolean>> = {
    status: actionable,
    priority: actionable && item.priority !== 'none',
    due: actionable && !!item.dueAt,
    review: !actionable && !!item.reviewAt,
    tags: item.tags.length > 0,
    estimate: actionable && !!item.estimatedMinutes,
    source: !!item.sourceUrl,
  };
  const applies = (k: FieldKey) =>
    actionable ? k !== 'review' : !['status', 'priority', 'due', 'estimate'].includes(k);
  const unset = (Object.keys(FIELD_LABEL) as FieldKey[]).filter((k) => applies(k) && !isSet[k]);

  const turnInto = (type: ItemType) => {
    setTypeAnchor(null);
    if (type === item.type) return;
    update.mutate(
      { id: item.id, input: { version: item.version, type } },
      {
        onSuccess: () => notify(`Now a ${TYPE_LABEL[type].toLowerCase()}`),
        onError: (err) => notify(messageOf(err), { severity: 'error' }),
      },
    );
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={0.75}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 1.5, mb: 4 }}
      >
        <Button
          size="small"
          color="inherit"
          startIcon={<ItemTypeIcon type={item.type} fontSize="small" />}
          endIcon={<ExpandMoreRounded />}
          onClick={(e) => setTypeAnchor(e.currentTarget)}
          aria-label={`${TYPE_LABEL[item.type]} — turn into…`}
          aria-haspopup="menu"
          sx={{ color: 'text.secondary', px: 1 }}
        >
          {TYPE_LABEL[item.type]}
        </Button>
        {isSet.status && (
          <StatusChip status={item.status} onClick={open('status')} aria-label="Status — change" />
        )}
        {isSet.priority && <PriorityChip priority={item.priority} onClick={open('priority')} />}
        {isSet.due && (
          <DueChip due={item.dueAt!} today={today} done={item.status === 'completed'} onClick={open('due')} />
        )}
        {isSet.review && (
          <HintChip label={`Review ${friendlyDate(`${item.reviewAt}T12:00:00`)}`} onClick={open('review')} />
        )}
        {isSet.estimate && <HintChip label={`~${item.estimatedMinutes} min`} onClick={open('estimate')} />}
        {item.tags.map((t) => (
          <TagChip key={t} tag={t} onClick={open('tags')} />
        ))}
        {isSet.source && <HintChip label="Source link" onClick={open('source')} />}
        {item.archivedAt && <HintChip label="Archived" />}
        {unset.length > 0 && (
          <Button
            size="small"
            startIcon={<AddRounded />}
            onClick={(e) => setAddAnchor(e.currentTarget)}
            aria-haspopup="menu"
            sx={{ px: 1 }}
          >
            Add
          </Button>
        )}
      </Stack>

      <Menu anchorEl={typeAnchor} open={!!typeAnchor} onClose={() => setTypeAnchor(null)}>
        <MenuItem disabled sx={{ opacity: '1 !important', typography: 'caption' }}>
          Turn into…
        </MenuItem>
        {TYPES.map((t) => (
          <MenuItem key={t} selected={t === item.type} onClick={() => turnInto(t)}>
            <ListItemIcon>
              <ItemTypeIcon type={t} fontSize="small" />
            </ListItemIcon>
            <span>
              {TYPE_LABEL[t]}
              <br />
              <small style={{ opacity: 0.75 }}>{TURN_INTO_HINT[t]}</small>
            </span>
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={addAnchor} open={!!addAnchor} onClose={() => setAddAnchor(null)}>
        {unset.map((k) => (
          <MenuItem
            key={k}
            onClick={() => {
              const anchor = addAnchor!;
              setAddAnchor(null);
              setEditing({ key: k, anchor });
            }}
          >
            {FIELD_LABEL[k]}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={!!editing}
        anchorEl={editing?.anchor}
        onClose={() => setEditing(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 320, maxWidth: 'calc(100vw - 32px)' } } }}
      >
        {editing && <ItemFields item={item} fields={[editing.key]} />}
      </Popover>
    </>
  );
}
