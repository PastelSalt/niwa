import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import UnarchiveOutlined from '@mui/icons-material/UnarchiveOutlined';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  isValidTag,
  normalizeTag,
  type Item,
  type ItemPriority,
  type ItemStatus,
  type ItemType,
  type UpdateItemInput,
} from '@niwa/contracts';
import { useState } from 'react';
import { DateField } from '../../components/DateField.tsx';
import { exactTime, friendlyDate, timeAgo } from '../../lib/friendlyTime.ts';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { ItemTypeIcon, PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL } from './itemMeta.tsx';
import { useTags, useTree, useUpdateItem } from './queries.ts';
import { ItemScheduleSection } from '../scheduler/ItemScheduleSection.tsx';
import { useItemActions } from './useItemActions.ts';

const TYPES: ItemType[] = ['note', 'idea', 'task', 'project'];
const STATUSES: ItemStatus[] = ['not_started', 'in_progress', 'blocked', 'completed'];
const PRIORITIES: ItemPriority[] = ['none', 'low', 'medium', 'high', 'critical'];

/** Editable item fields for the detail panel. Every change is a version-checked PATCH. */
/** Fields an item page can show on their own (B-01 B11: a chip's editor reuses these). */
export type FieldKey =
  | 'type'
  | 'status'
  | 'priority'
  | 'due'
  | 'estimate'
  | 'review'
  | 'tags'
  | 'source'
  | 'schedule'
  | 'actions'
  | 'timestamps';

export function ItemFields({ item, fields }: { item: Item; fields?: FieldKey[] }) {
  const show = (k: FieldKey) => !fields || fields.includes(k);
  const update = useUpdateItem();
  const notify = useNotify();
  const actions = useItemActions();
  const { data: tags = [] } = useTags();
  const { data: tree = [] } = useTree();
  const childCount = tree.filter((t) => t.parentId === item.id).length;

  const save = (input: Omit<UpdateItemInput, 'version'>) =>
    update.mutate(
      { id: item.id, input: { version: item.version, ...input } },
      { onError: (err) => notify(messageOf(err), { severity: 'error' }) },
    );

  const actionable = item.nature === 'actionable';

  return (
    <Stack spacing={2.25} sx={{ p: 2 }}>
      {show('type') && (
        <TextField
          select
          size="small"
          label="Type"
          value={item.type}
          onChange={(e) => save({ type: e.target.value as ItemType })}
        >
          {TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ItemTypeIcon type={t} fontSize="small" /> {TYPE_LABEL[t]}
              </Box>
            </MenuItem>
          ))}
        </TextField>
      )}

      {actionable && (
        <>
          {show('status') && (
            <TextField
              select
              size="small"
              label="Status"
              value={item.status}
              onChange={(e) => save({ status: e.target.value as ItemStatus })}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </MenuItem>
              ))}
            </TextField>
          )}
          {show('priority') && (
            <TextField
              select
              size="small"
              label="Priority"
              value={item.priority}
              onChange={(e) => save({ priority: e.target.value as ItemPriority })}
            >
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </MenuItem>
              ))}
            </TextField>
          )}
          {show('due') && (
            <DateField size="small" label="Due" value={item.dueAt} onChange={(dueAt) => save({ dueAt })} />
          )}
          {show('estimate') && (
            <EstimateField
              value={item.estimatedMinutes}
              onCommit={(estimatedMinutes) => save({ estimatedMinutes })}
            />
          )}
        </>
      )}

      {!actionable && show('review') && (
        <DateField
          size="small"
          label="Review on"
          value={item.reviewAt}
          onChange={(reviewAt) => save({ reviewAt })}
        />
      )}

      {show('tags') && (
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={tags.map((t) => t.tag)}
          value={item.tags}
          onChange={(_, next) => {
            const clean = [...new Set(next.map(normalizeTag).filter(isValidTag))];
            if (clean.join() !== item.tags.join()) save({ tags: clean });
          }}
          renderValue={(value, getItemProps) =>
            value.map((tag, index) => {
              const { key, ...rest } = getItemProps({ index });
              return <Chip key={key} size="small" label={`#${tag}`} {...rest} />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add tag" />}
        />
      )}

      {show('source') && <UrlField value={item.sourceUrl} onCommit={(sourceUrl) => save({ sourceUrl })} />}

      {show('schedule') && <ItemScheduleSection item={item} />}

      {show('actions') && <Divider />}

      {show('actions') && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<DriveFileMoveOutlined />} onClick={() => actions.openMove(item)}>
            Move
          </Button>
          {item.archivedAt ? (
            <Button
              size="small"
              startIcon={<UnarchiveOutlined />}
              onClick={() => void actions.setArchived(item, false)}
            >
              Unarchive
            </Button>
          ) : (
            <Button
              size="small"
              startIcon={<ArchiveOutlined />}
              onClick={() => void actions.setArchived(item, true)}
            >
              Archive
            </Button>
          )}
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlineRounded />}
            onClick={() => void actions.remove(item, childCount)}
          >
            Delete
          </Button>
        </Stack>
      )}

      {show('timestamps') && (
        <Typography variant="caption" color="text.secondary">
          <time dateTime={item.createdAt} title={exactTime(item.createdAt)}>
            Created {friendlyDate(item.createdAt, undefined, true)}
          </time>
          {' · '}
          <time dateTime={item.updatedAt} title={exactTime(item.updatedAt)}>
            edited {timeAgo(item.updatedAt)}
          </time>
          {item.completedAt && (
            <>
              {' · '}
              <time dateTime={item.completedAt} title={exactTime(item.completedAt)}>
                completed {timeAgo(item.completedAt)}
              </time>
            </>
          )}
        </Typography>
      )}
    </Stack>
  );
}

/** Local draft that resets whenever the saved value changes. */
function useSyncedDraft(saved: string) {
  const [draft, setDraft] = useState(saved);
  const [last, setLast] = useState(saved);
  if (saved !== last) {
    setLast(saved);
    setDraft(saved);
  }
  return [draft, setDraft] as const;
}

function EstimateField({ value, onCommit }: { value: number | null; onCommit: (v: number | null) => void }) {
  const [draft, setDraft] = useSyncedDraft(value?.toString() ?? '');
  const commit = () => {
    const n = draft.trim() === '' ? null : Math.round(Number(draft));
    if (n !== null && (!Number.isFinite(n) || n < 1 || n > 10_000)) return setDraft(value?.toString() ?? '');
    if (n !== value) onCommit(n);
  };
  return (
    <TextField
      size="small"
      label="Estimate (minutes)"
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      slotProps={{ htmlInput: { min: 1, max: 10000, step: 5 } }}
    />
  );
}

function UrlField({ value, onCommit }: { value: string | null; onCommit: (v: string | null) => void }) {
  const [draft, setDraft] = useSyncedDraft(value ?? '');
  const [invalid, setInvalid] = useState(false);
  const commit = () => {
    const v = draft.trim() || null;
    if (v && !/^https?:\/\/\S+$/i.test(v)) return setInvalid(true);
    setInvalid(false);
    if (v !== value) onCommit(v);
  };
  return (
    <TextField
      size="small"
      label="Source URL"
      value={draft}
      error={invalid}
      helperText={invalid ? 'Use a full http(s) link' : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
}
