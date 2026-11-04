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
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { ApiError } from '@niwa/api-client';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { SectionHeader } from '../../components/SectionHeader.tsx';
import { Page } from '../../components/Page.tsx';
import { DueChip, HintChip, PriorityChip, StatusChip, TagChip } from './chips.tsx';
import { ItemRow, ItemRowList } from './ItemRow.tsx';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { FileDialog } from '../inbox/FileDialog.tsx';
import { EditorPlaceholder } from '../knowledge/editor/EditorPlaceholder.tsx';
import { preloadNoteEditor } from '../knowledge/editor/preload.ts';
import { LinksPanel } from '../knowledge/LinksPanel.tsx';
// The editor (TipTap) is the heaviest dependency; it's preloaded when a tree shows (see preload.ts).
const NoteEditor = lazy(async () => ({ default: (await preloadNoteEditor()).NoteEditor }));
import { EditableTitle } from './EditableTitle.tsx';
import { ItemFields } from './ItemFields.tsx';
import {
  DEFAULT_TYPE_FOR,
  ItemTypeIcon,
  LENS_PATH,
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

  const rename = (title: string) =>
    update.mutate(
      { id: item.id, input: { version: item.version, title } },
      { onError: (err) => notify(messageOf(err), { severity: 'error' }) },
    );

  return (
    <Page width="reading">
      {/* Where it lives — the title itself is the heading below, so it isn't repeated here. */}
      <Breadcrumbs aria-label="Path" sx={{ mb: 1, minHeight: 21, '& ol': { flexWrap: 'wrap' } }}>
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

      {/* The type lives in Details (one place); the chips are the same quiet set the lists use (V3/V4). */}
      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5, mb: 4 }}>
        {item.nature === 'actionable' && <StatusChip status={item.status} />}
        <PriorityChip priority={item.priority} />
        {item.dueAt && <DueChip due={item.dueAt} today={today} done={item.status === 'completed'} />}
        {item.archivedAt && <HintChip label="Archived" />}
        {item.tags.map((t) => (
          <TagChip key={t} tag={t} />
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
        <Suspense fallback={<EditorPlaceholder />}>
          <NoteEditor key={item.id} item={item} />
        </Suspense>
      </Box>

      <SectionHeader
        title="Inside"
        count={children.length}
        action={
          <Button
            size="small"
            startIcon={<AddRounded />}
            onClick={() => actions.openCreate({ parentId: item.id, type: DEFAULT_TYPE_FOR[item.nature] })}
          >
            Add child
          </Button>
        }
      />
      {children.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing inside yet. Children are for anything that deserves its own title, status or link.
        </Typography>
      ) : (
        <ItemRowList label="Children">
          {children.map((c) => (
            <ItemRow
              key={c.id}
              item={c}
              meta={c.nature === 'actionable' ? STATUS_LABEL[c.status] : TYPE_LABEL[c.type]}
              chips={
                c.nature === 'actionable' && (
                  <>
                    <PriorityChip priority={c.priority} />
                    {c.dueAt && <DueChip due={c.dueAt} today={today} done={c.status === 'completed'} />}
                  </>
                )
              }
            />
          ))}
        </ItemRowList>
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
