import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { isValidTag, normalizeTag, type ItemSummary, type ItemType } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { ItemTypeIcon, LENS_PATH, TYPE_LABEL } from '../items/itemMeta.tsx';
import { useTags, useTree } from '../items/queries.ts';
import { ancestorsOf, buildTree } from '../items/treeModel.ts';
import { useFileItem } from './queries.ts';

const TYPES: ItemType[] = ['idea', 'note', 'task', 'project'];
const KEEP = 'keep';

/** Filing panel: parent, type, due, tags — one item or many (CONCEPT.md §3.2–3.3). */
export function FileDialog({
  items,
  onClose,
  onDone,
}: {
  items: ItemSummary[];
  onClose: () => void;
  onDone?: () => void;
}) {
  const single = items.length === 1 ? items[0]! : null;
  const { data: tree = [] } = useTree();
  const { data: tags = [] } = useTags();
  const model = useMemo(() => buildTree(tree), [tree]);
  const suggested = single?.suggestedParentId
    ? (tree.find((t) => t.id === single.suggestedParentId) ?? null)
    : null;
  const [parent, setParent] = useState<ItemSummary | null>(suggested);
  const [type, setType] = useState<ItemType | typeof KEEP>(single ? single.type : KEEP);
  const [dueAt, setDueAt] = useState(single?.dueAt ?? '');
  const [tagList, setTagList] = useState<string[]>(single?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileItem = useFileItem();
  const notify = useNotify();
  const navigate = useNavigate();

  const path = (o: ItemSummary) =>
    ancestorsOf(model, o.id)
      .map((a) => a.title)
      .join(' › ');

  const submit = async () => {
    if (!parent) return setError('Choose where to file it.');
    setBusy(true);
    setError(null);
    let filed = 0;
    try {
      for (const it of items) {
        await fileItem.mutateAsync({
          id: it.id,
          input: {
            version: it.version,
            parentId: parent.id,
            ...(type !== KEEP && { type }),
            ...(single && { dueAt: dueAt || null, tags: tagList }),
          },
        });
        filed++;
      }
      notify(filed === 1 ? `Filed under “${parent.title}”` : `Filed ${filed} items under “${parent.title}”`, {
        action: { label: 'Open', onClick: () => navigate(`${LENS_PATH[parent.nature]}/${parent.id}`) },
      });
      onDone?.();
      onClose();
    } catch (err) {
      setError(`${filed ? `Filed ${filed}, then: ` : ''}${messageOf(err)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{single ? `File “${single.title}”` : `File ${items.length} items`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Autocomplete
            options={tree}
            value={parent}
            onChange={(_, v) => setParent(v)}
            getOptionLabel={(o) => o.title}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, o) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <ItemTypeIcon type={o.type} fontSize="small" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {o.title}
                      </Typography>
                      {path(o) && (
                        <Typography variant="caption" color="text.secondary" noWrap component="p">
                          {path(o)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="File under"
                autoFocus
                helperText={suggested ? 'Suggested when you captured it' : undefined}
              />
            )}
          />
          <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as ItemType)}>
            {!single && <MenuItem value={KEEP}>Keep each item’s type</MenuItem>}
            {TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ItemTypeIcon type={t} fontSize="small" /> {TYPE_LABEL[t]}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          {single && (
            <>
              <TextField
                type="date"
                label="Due"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Autocomplete
                multiple
                freeSolo
                options={tags.map((t) => t.tag)}
                value={tagList}
                onChange={(_, next) => setTagList([...new Set(next.map(normalizeTag).filter(isValidTag))])}
                renderValue={(value, getItemProps) =>
                  value.map((tag, index) => {
                    const { key, ...rest } = getItemProps({ index });
                    return <Chip key={key} size="small" label={`#${tag}`} {...rest} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Tags" />}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void submit()} disabled={!parent} loading={busy}>
          File
        </Button>
      </DialogActions>
    </Dialog>
  );
}
