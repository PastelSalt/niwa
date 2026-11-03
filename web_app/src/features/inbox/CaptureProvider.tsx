import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import NotesRounded from '@mui/icons-material/NotesRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ItemType, ProseMirrorDoc } from '@niwa/contracts';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { ItemTypeIcon, TYPE_LABEL } from '../items/itemMeta.tsx';
import { useItem } from '../items/queries.ts';
import { useSelectedItemId } from '../items/useSelectedItemId.ts';
import { useCapture } from './queries.ts';

interface CaptureApi {
  open: () => void;
}

const CaptureContext = createContext<CaptureApi>({ open: () => {} });
export const useQuickCapture = () => useContext(CaptureContext);

const TYPES: ItemType[] = ['idea', 'note', 'task', 'project'];

/** Plain text → a ProseMirror doc with one paragraph per line. */
function textToDoc(text: string): ProseMirrorDoc | undefined {
  const lines = text.split('\n').map((l) => l.trimEnd());
  if (!lines.some(Boolean)) return undefined;
  return {
    type: 'doc',
    content: lines.map((l) =>
      l ? { type: 'paragraph', content: [{ type: 'text', text: l }] } : { type: 'paragraph' },
    ),
  };
}

/** Quick capture from anywhere — `c` or the Capture button (CONCEPT.md §3.1). */
export function CaptureProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const api = useMemo<CaptureApi>(() => ({ open: () => setOpen(true) }), []);
  return (
    <CaptureContext.Provider value={api}>
      {children}
      {open && <CaptureDialog onClose={() => setOpen(false)} />}
    </CaptureContext.Provider>
  );
}

function CaptureDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showBody, setShowBody] = useState(false);
  const [type, setType] = useState<ItemType>('idea');
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);
  const selectedId = useSelectedItemId();
  const { data: selected } = useItem(selectedId);
  const [suggest, setSuggest] = useState(true);
  const capture = useCapture();
  const notify = useNotify();
  const navigate = useNavigate();

  // Captures are queued so fast Shift+Enter never races: the field clears at once, saves run in order,
  // and closing waits for anything still saving.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const saved = useRef(0);

  const save = useCallback(
    async (keepOpen: boolean) => {
      const t = title.trim();
      if (!t) {
        if (!keepOpen && saved.current > 0) onClose();
        return;
      }
      const input = {
        title: t,
        type,
        content: textToDoc(body),
        suggestedParentId: suggest && selected && !selected.inboxedAt ? selected.id : null,
      };
      setError(null);
      setTitle('');
      setBody('');
      titleRef.current?.focus();

      const job = queue.current.then(async () => {
        try {
          await capture.mutateAsync(input);
          saved.current++;
          setCount(saved.current);
        } catch (err) {
          setTitle((cur) => cur || t); // give the text back so nothing is lost
          setError(messageOf(err));
          throw err;
        }
      });
      queue.current = job.catch(() => {});
      if (keepOpen) return;

      try {
        await job;
        await queue.current;
      } catch {
        return; // stay open with the error shown
      }
      onClose();
      notify(saved.current > 1 ? `Captured ${saved.current} items to Inbox` : 'Captured to Inbox', {
        action: { label: 'Open Inbox', onClick: () => navigate('/inbox') },
      });
    },
    [title, type, body, suggest, selected, capture, onClose, notify, navigate],
  );

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { 'aria-label': 'Quick capture' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>Capture</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            inputRef={titleRef}
            autoFocus
            placeholder="What's on your mind?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void save(e.shiftKey);
              }
            }}
            slotProps={{ htmlInput: { maxLength: 300, 'aria-label': 'Capture title' } }}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={type}
              onChange={(_, v: ItemType | null) => v && setType(v)}
              aria-label="Type"
            >
              {TYPES.map((t) => (
                <ToggleButton key={t} value={t} aria-label={TYPE_LABEL[t]} sx={{ gap: 0.5, px: 1 }}>
                  <ItemTypeIcon type={t} sx={{ fontSize: 16 }} />
                  {TYPE_LABEL[t]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button
              size="small"
              startIcon={showBody ? <ExpandLessRounded /> : <NotesRounded />}
              onClick={() => setShowBody((v) => !v)}
            >
              {showBody ? 'Hide details' : 'Add details'}
            </Button>
          </Stack>
          <Collapse in={showBody}>
            <TextField
              multiline
              minRows={3}
              placeholder="Details (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              slotProps={{ htmlInput: { 'aria-label': 'Capture details' } }}
            />
          </Collapse>
          {selected && !selected.inboxedAt && (
            <FormControlLabel
              control={
                <Checkbox size="small" checked={suggest} onChange={(e) => setSuggest(e.target.checked)} />
              }
              label={<Typography variant="body2">Suggest filing under “{selected.title}”</Typography>}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            Enter to save · Shift+Enter to save and capture another{count > 0 ? ` · ${count} captured` : ''}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{count > 0 ? 'Done' : 'Cancel'}</Button>
        <Button
          variant="contained"
          onClick={() => void save(false)}
          disabled={!title.trim()}
          loading={capture.isPending}
        >
          Capture
        </Button>
      </DialogActions>
    </Dialog>
  );
}
