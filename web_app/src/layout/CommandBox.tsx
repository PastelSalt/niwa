import AddTaskRounded from '@mui/icons-material/AddTaskRounded';
import EventOutlined from '@mui/icons-material/EventOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import NoteAddOutlined from '@mui/icons-material/NoteAddOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import InputAdornment from '@mui/material/InputAdornment';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import { createContext, useCallback, useContext, useId, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuickCapture } from '../features/inbox/CaptureProvider.tsx';
import { ItemTypeIcon, LENS_PATH } from '../features/items/itemMeta.tsx';
import { useTree } from '../features/items/queries.ts';
import { ancestorsOf, buildTree } from '../features/items/treeModel.ts';
import { useItemActions } from '../features/items/useItemActions.ts';
import { dayKey } from '../lib/dates.ts';
import { DESTINATIONS } from './destinations.tsx';

/**
 * The command box (NIWA-PLAN-B-01 B9): one place to jump to an item or a screen, create something, or search.
 * Opens with Ctrl+K (⌘K), `/`, or the top bar's search field. Enter on plain text searches everything.
 */

interface Command {
  id: string;
  group: 'Go to' | 'Create' | 'Items' | 'Search';
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
}

const CommandBoxContext = createContext<{ open: () => void } | null>(null);

export function useCommandBox() {
  const ctx = useContext(CommandBoxContext);
  if (!ctx) throw new Error('useCommandBox must be used inside <CommandBoxProvider>');
  return ctx;
}

export function CommandBoxProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open: show }), [show]);
  return (
    <CommandBoxContext.Provider value={value}>
      {children}
      {open && <CommandBox onClose={() => setOpen(false)} />}
    </CommandBoxContext.Provider>
  );
}

const MAX_ITEMS = 8;

function CommandBox({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const actions = useItemActions();
  const capture = useQuickCapture();
  const { data: items } = useTree();
  const model = useMemo(() => buildTree(items ?? []), [items]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const q = query.trim().toLowerCase();

  const commands = useMemo(() => {
    const go = (path: string) => () => navigate(path);
    const all: Command[] = [
      ...DESTINATIONS.filter((d) => d.inNav || d.key === 'settings').map((d) => ({
        id: `go-${d.key}`,
        group: 'Go to' as const,
        label: d.label,
        hint: d.shortcut ? `g ${d.shortcut}` : undefined,
        icon: d.icon,
        run: go(d.path),
      })),
      {
        id: 'new-page',
        group: 'Create',
        label: 'New page',
        icon: <NoteAddOutlined />,
        run: () => actions.openCreate({ parentId: null, type: 'note' }),
      },
      {
        id: 'new-task',
        group: 'Create',
        label: 'New task',
        icon: <AddTaskRounded />,
        run: () => actions.openCreate({ parentId: null, type: 'task' }),
      },
      {
        id: 'capture',
        group: 'Create',
        label: 'Capture a thought',
        hint: 'c',
        icon: <LightbulbOutlined />,
        run: capture.open,
      },
      {
        id: 'calendar',
        group: 'Create',
        label: 'Add to calendar',
        icon: <EventOutlined />,
        run: go(`/scheduler/day/${dayKey(new Date())}?new=1`),
      },
    ];
    const matches = (c: Command) => !q || c.label.toLowerCase().includes(q);
    const found: Command[] = q
      ? (items ?? [])
          .filter((i) => i.title.toLowerCase().includes(q))
          // Titles that start with the query first, then shorter titles.
          .sort((a, b) => {
            const sa = a.title.toLowerCase().startsWith(q) ? 0 : 1;
            const sb = b.title.toLowerCase().startsWith(q) ? 0 : 1;
            return sa - sb || a.title.length - b.title.length;
          })
          .slice(0, MAX_ITEMS)
          .map((i) => ({
            id: `item-${i.id}`,
            group: 'Items' as const,
            label: i.title,
            hint: ancestorsOf(model, i.id)
              .map((a) => a.title)
              .join(' › '),
            icon: <ItemTypeIcon type={i.type} completed={i.status === 'completed'} fontSize="small" />,
            run: go(`${LENS_PATH[i.nature]}/${i.id}`),
          }))
      : [];
    const search: Command[] = q
      ? [
          {
            id: 'search',
            group: 'Search',
            label: `Search everything for “${query.trim()}”`,
            icon: <SearchRounded />,
            run: go(`/search?q=${encodeURIComponent(query.trim())}`),
          },
        ]
      : [];
    // With a query, items lead; otherwise the places and actions.
    return q ? [...found, ...all.filter(matches), ...search] : all;
  }, [q, query, items, model, navigate, actions, capture.open]);

  const index = Math.min(active, Math.max(commands.length - 1, 0));
  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-label="Command box"
      slotProps={{ paper: { sx: { alignSelf: 'flex-start', mt: { xs: 2, sm: 10 } } } }}
    >
      <InputBase
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, commands.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            run(commands[index]);
          }
        }}
        placeholder="Search, jump to anything, or create…"
        inputProps={{
          'aria-label': 'Search or jump to',
          role: 'combobox',
          'aria-expanded': true,
          'aria-controls': listId,
          'aria-activedescendant': commands[index] ? `${listId}-${commands[index]!.id}` : undefined,
        }}
        startAdornment={
          <InputAdornment position="start">
            <SearchRounded />
          </InputAdornment>
        }
        sx={{ px: 2, py: 1.5, typography: 'body1', borderBottom: 1, borderColor: 'divider' }}
      />
      <Box
        component="ul"
        id={listId}
        role="listbox"
        aria-label="Results"
        sx={{ m: 0, p: 1, listStyle: 'none', maxHeight: '60vh', overflow: 'auto' }}
      >
        {commands.length === 0 && (
          <Typography component="li" variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
            Nothing matches.
          </Typography>
        )}
        {commands.map((c, i) => (
          <Box key={c.id} component="li" role="presentation">
            {(i === 0 || commands[i - 1]!.group !== c.group) && (
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
                sx={{ px: 1.5, pt: 1, pb: 0.5 }}
              >
                {c.group}
              </Typography>
            )}
            <Box
              id={`${listId}-${c.id}`}
              role="option"
              aria-selected={i === index}
              onMouseMove={() => setActive(i)}
              onClick={() => run(c)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: i === index ? 'action.selected' : 'transparent',
                '& > svg, & > .icon svg': { color: 'text.secondary' },
              }}
            >
              <Box className="icon" sx={{ display: 'flex', color: 'text.secondary' }}>
                {c.icon}
              </Box>
              {c.group === 'Items' ? (
                // Items: the title gets the full line, the path sits under it.
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" noWrap>
                    {c.label}
                  </Typography>
                  {c.hint && (
                    <Typography variant="caption" color="text.secondary" component="div" noWrap>
                      {c.hint}
                    </Typography>
                  )}
                </Box>
              ) : (
                <>
                  <Typography variant="body1" sx={{ flex: 1, minWidth: 0 }} noWrap>
                    {c.label}
                  </Typography>
                  {c.hint && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {c.hint}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
