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
export function ItemFields({ item }: { item: Item }) {
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

      {actionable && (
        <>
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
          <DateField label="Due" value={item.dueAt} onCommit={(dueAt) => save({ dueAt })} />
          <EstimateField
            value={item.estimatedMinutes}
            onCommit={(estimatedMinutes) => save({ estimatedMinutes })}
          />
        </>
      )}

      {!actionable && (
        <DateField label="Review on" value={item.reviewAt} onCommit={(reviewAt) => save({ reviewAt })} />
      )}

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

      <UrlField value={item.sourceUrl} onCommit={(sourceUrl) => save({ sourceUrl })} />

      <ItemScheduleSection item={item} />

      <Divider />

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

      <Typography variant="caption" color="text.secondary">
        Created {new Date(item.createdAt).toLocaleString()} · Updated{' '}
        {new Date(item.updatedAt).toLocaleString()}
        {item.completedAt && ` · Completed ${new Date(item.completedAt).toLocaleDateString()}`}
      </Typography>
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

/** Native date input (date-only string, no timezone — specs §12.5). */
function DateField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string | null;
  onCommit: (v: string | null) => void;
}) {
  return (
    <TextField
      size="small"
      type="date"
      label={label}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value || null;
        if (v !== value) onCommit(v);
      }}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
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
