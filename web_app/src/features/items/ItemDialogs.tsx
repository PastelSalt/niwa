import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ItemSummary, ItemType } from '@niwa/contracts';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { ItemTypeIcon, LENS_PATH, TYPE_LABEL } from './itemMeta.tsx';
import { useCreateItem, useMoveItem, useTree } from './queries.ts';
import { ancestorsOf, buildTree, isDescendant } from './treeModel.ts';

interface CreateRequest {
  parentId: string | null;
  type: ItemType;
}

interface ItemDialogsApi {
  openCreate(req: CreateRequest): void;
  openMove(item: ItemSummary): void;
  confirm(opts: { title: string; body: ReactNode; confirmLabel: string; danger?: boolean }): Promise<boolean>;
}

const DialogsContext = createContext<ItemDialogsApi | null>(null);

export function useItemDialogs(): ItemDialogsApi {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error('useItemDialogs must be used inside <ItemDialogsProvider>');
  return ctx;
}

type ConfirmState = Parameters<ItemDialogsApi['confirm']>[0] & { resolve: (ok: boolean) => void };

export function ItemDialogsProvider({ children }: { children: ReactNode }) {
  const [create, setCreate] = useState<CreateRequest | null>(null);
  const [move, setMove] = useState<ItemSummary | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const api = useMemo<ItemDialogsApi>(
    () => ({
      openCreate: setCreate,
      openMove: setMove,
      confirm: (opts) => new Promise((resolve) => setConfirm({ ...opts, resolve })),
    }),
    [],
  );

  const closeConfirm = (ok: boolean) => {
    confirm?.resolve(ok);
    setConfirm(null);
  };

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {create && <CreateItemDialog request={create} onClose={() => setCreate(null)} />}
      {move && <MoveItemDialog item={move} onClose={() => setMove(null)} />}
      <Dialog open={!!confirm} onClose={() => closeConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">{confirm?.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeConfirm(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirm?.danger ? 'error' : 'primary'}
            onClick={() => closeConfirm(true)}
            autoFocus
          >
            {confirm?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </DialogsContext.Provider>
  );
}

const TYPES: ItemType[] = ['note', 'idea', 'task', 'project'];

function CreateItemDialog({ request, onClose }: { request: CreateRequest; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ItemType>(request.type);
  const createItem = useCreateItem();
  const notify = useNotify();
  const navigate = useNavigate();
  const { data: items = [] } = useTree();
  const parent = request.parentId ? items.find((i) => i.id === request.parentId) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { item } = await createItem.mutateAsync({
        parentId: request.parentId,
        title: title.trim(),
        type,
      });
      onClose();
      navigate(`${LENS_PATH[item.nature]}/${item.id}`);
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle>{parent ? `New item in “${parent.title}”` : 'New top-level item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              slotProps={{ htmlInput: { maxLength: 300 } }}
            />
            <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as ItemType)}>
              {TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ItemTypeIcon type={t} fontSize="small" /> {TYPE_LABEL[t]}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!title.trim()} loading={createItem.isPending}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

const TOP_LEVEL = { id: '__top__', title: 'Top level' } as const;

function MoveItemDialog({ item, onClose }: { item: ItemSummary; onClose: () => void }) {
  const { data: items = [] } = useTree();
  const model = useMemo(() => buildTree(items), [items]);
  const moveItem = useMoveItem();
  const notify = useNotify();
  const [target, setTarget] = useState<ItemSummary | typeof TOP_LEVEL | null>(null);

  const options = useMemo(
    () => [
      TOP_LEVEL,
      ...items.filter(
        (i) => i.id !== item.id && i.id !== item.parentId && !isDescendant(model, i.id, item.id),
      ),
    ],
    [items, item, model],
  );

  const path = (o: ItemSummary | typeof TOP_LEVEL) =>
    o.id === TOP_LEVEL.id
      ? ''
      : ancestorsOf(model, o.id)
          .map((a) => a.title)
          .join(' › ');

  const submit = async () => {
    if (!target) return;
    try {
      await moveItem.mutateAsync({
        id: item.id,
        input: { version: item.version, parentId: target.id === TOP_LEVEL.id ? null : target.id },
      });
      notify(`Moved “${item.title}”`);
      onClose();
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move “{item.title}”</DialogTitle>
      <DialogContent>
        <Autocomplete
          sx={{ pt: 1 }}
          options={options}
          value={target}
          onChange={(_, v) => setTarget(v)}
          getOptionLabel={(o) => o.title}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderOption={(props, o) => {
            const { key, ...rest } = props;
            return (
              <li key={key} {...rest}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  {'type' in o && <ItemTypeIcon type={o.type} fontSize="small" />}
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
          renderInput={(params) => <TextField {...params} label="New parent" autoFocus />}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!target} loading={moveItem.isPending}>
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
}
