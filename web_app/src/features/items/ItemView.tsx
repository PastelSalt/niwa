import AddRounded from '@mui/icons-material/AddRounded';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LocalFloristOutlined from '@mui/icons-material/LocalFloristOutlined';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { ApiError } from '@niwa/api-client';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { Page } from '../../components/Page.tsx';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { FileDialog } from '../inbox/FileDialog.tsx';
import { LinksPanel } from '../knowledge/LinksPanel.tsx';
// The editor (TipTap) is the heaviest dependency; load it with the first item view.
const NoteEditor = lazy(async () => ({
  default: (await import('../knowledge/editor/NoteEditor.tsx')).NoteEditor,
}));
import { EditableTitle } from './EditableTitle.tsx';
import { ItemFields } from './ItemFields.tsx';
import {
  DEFAULT_TYPE_FOR,
  formatDay,
  ItemTypeIcon,
  LENS_PATH,
  PRIORITY_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
  todayLocal,
  TYPE_LABEL,
} from './itemMeta.tsx';
import { useItem, useTree, useUpdateItem } from './queries.ts';
import { ancestorsOf, buildTree } from './treeModel.ts';
import { useItemActions } from './useItemActions.ts';

/** Main view of one item: path, title, key facts and its children (all natures — CONCEPT.md §2). */
export function ItemView({ id }: { id: string }) {
  const { data: item, isLoading, error } = useItem(id);
  const { data: treeItems } = useTree();
  const model = useMemo(() => buildTree(treeItems ?? []), [treeItems]);
  const update = useUpdateItem();
  const notify = useNotify();
  const actions = useItemActions();
  const theme = useTheme();
  // No side detail panel on phones — show the fields inline.
  const isPhone = useMediaQuery(theme.breakpoints.down('md'));
  const [filing, setFiling] = useState(false);

  if (isLoading) {
    return (
      <Page width="reading">
        <Skeleton width={180} />
        <Skeleton width="60%" height={48} />
        <Skeleton width="40%" />
      </Page>
    );
  }
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        icon={<LocalFloristOutlined />}
        title="This item isn't here"
        description="It may have been moved to Trash. You can restore it from Settings → Trash."
        action={
          <Button component={RouterLink} to="/settings/trash" variant="outlined">
            Open Trash
          </Button>
        }
      />
    );
  }
  if (error || !item)
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {messageOf(error)}
      </Alert>
    );

  const path = ancestorsOf(model, item.id);
  const children = model.children.get(item.id) ?? [];
  const today = todayLocal();
  const overdue = !!item.dueAt && item.dueAt < today && item.status !== 'completed';

  const rename = (title: string) =>
    update.mutate(
      { id: item.id, input: { version: item.version, title } },
      { onError: (err) => notify(messageOf(err), { severity: 'error' }) },
    );

  return (
    <Page width="reading">
      <Breadcrumbs aria-label="Path" sx={{ mb: 1, '& ol': { flexWrap: 'wrap' } }}>
        {path.map((a) => (
          <Link
            key={a.id}
            component={RouterLink}
            to={`${LENS_PATH[a.nature]}/${a.id}`}
            underline="hover"
            color="text.secondary"
            variant="body2"
          >
            {a.title}
          </Link>
        ))}
        <Typography variant="body2" color="text.primary">
          {item.title}
        </Typography>
      </Breadcrumbs>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <ItemTypeIcon
          type={item.type}
          completed={item.status === 'completed'}
          fontSize="feature"
          sx={{ mt: 0.5 }}
        />
        <EditableTitle value={item.title} onCommit={rename} sx={{ typography: 'h2' }} />
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5, mb: 4 }}>
        <Chip size="small" variant="outlined" label={TYPE_LABEL[item.type]} />
        {item.nature === 'actionable' && (
          <Chip
            size="small"
            variant="outlined"
            // Body-colour text with a coloured dot: status colours alone don't reach 4.5:1 as chip text.
            icon={
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: STATUS_DOT[item.status],
                  ml: '8px !important',
                }}
              />
            }
            label={STATUS_LABEL[item.status]}
          />
        )}
        {item.priority !== 'none' && (
          <Chip
            size="small"
            // Filled blossom keeps dark text (6.8:1); outlined pink text would be too faint.
            variant={item.priority === 'critical' || item.priority === 'high' ? 'filled' : 'outlined'}
            color={item.priority === 'critical' || item.priority === 'high' ? 'secondary' : 'default'}
            label={`${PRIORITY_LABEL[item.priority]} priority`}
          />
        )}
        {item.dueAt && (
          <Chip
            size="small"
            variant="outlined"
            color={overdue ? 'error' : 'default'}
            label={`Due ${formatDay(item.dueAt)}`}
          />
        )}
        {item.archivedAt && <Chip size="small" label="Archived" />}
        {item.tags.map((t) => (
          <Chip key={t} size="small" label={`#${t}`} sx={{ bgcolor: 'action.hover' }} />
        ))}
      </Stack>

      {item.inboxedAt && (
        <Alert
          severity="info"
          icon={<InboxOutlined />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setFiling(true)}>
              File
            </Button>
          }
        >
          In your Inbox — not in the tree yet.
        </Alert>
      )}
      {filing && item.inboxedAt && <FileDialog items={[item]} onClose={() => setFiling(false)} />}

      {/* Content body (the "details") — separate from the child-item tree (specs §5). */}
      <Box sx={{ mb: 4 }}>
        <Suspense fallback={<Skeleton variant="rounded" height={240} aria-label="Loading editor" />}>
          <NoteEditor key={item.id} item={item} />
        </Suspense>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" component="h2" sx={{ flex: 1 }}>
          Inside ({children.length})
        </Typography>
        <Button
          size="small"
          startIcon={<AddRounded />}
          onClick={() => actions.openCreate({ parentId: item.id, type: DEFAULT_TYPE_FOR[item.nature] })}
        >
          Add child
        </Button>
      </Box>
      {children.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing inside yet. Children are for anything that deserves its own title, status or link.
        </Typography>
      ) : (
        <Paper variant="outlined">
          <List dense disablePadding aria-label="Children">
            {children.map((c) => (
              <ListItem key={c.id} disablePadding divider>
                <ListItemButton component={RouterLink} to={`${LENS_PATH[c.nature]}/${c.id}`}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ItemTypeIcon type={c.type} completed={c.status === 'completed'} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={c.title}
                    secondary={
                      c.nature === 'actionable'
                        ? [STATUS_LABEL[c.status], c.dueAt ? `due ${formatDay(c.dueAt)}` : null]
                            .filter(Boolean)
                            .join(' · ')
                        : TYPE_LABEL[c.type]
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* No side detail panel on phones: the fields live here, collapsed so the note comes first. */}
      {isPhone && (
        <Accordion
          variant="outlined"
          disableGutters
          sx={{ mt: 4, borderRadius: 1, '&::before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography variant="subtitle2">Details</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <ItemFields item={item} />
          </AccordionDetails>
        </Accordion>
      )}

      <Box sx={{ mt: 4 }}>
        <LinksPanel itemId={item.id} />
      </Box>
    </Page>
  );
}
