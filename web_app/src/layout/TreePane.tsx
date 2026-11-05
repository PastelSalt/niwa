import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import LocalFloristOutlined from '@mui/icons-material/LocalFloristOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import SpaOutlined from '@mui/icons-material/SpaOutlined';
import WorkOutlineRounded from '@mui/icons-material/WorkOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ROOT_CONTAINERS, type ItemSummary } from '@niwa/contracts';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { messageOf } from '../api/client.ts';
import { preloadNoteEditorWhenIdle } from '../features/knowledge/editor/preload.ts';
import { ItemTypeIcon, LENS_PATH, newItemType, STATUS_LABEL } from '../features/items/itemMeta.tsx';
import { GARDEN_FILTERS, type GardenFilter } from './destinations.tsx';
import { ItemMenu } from '../features/items/ItemMenu.tsx';
import { useTree } from '../features/items/queries.ts';
import {
  ancestorsOf,
  buildTree,
  dropMove,
  indent,
  lensView,
  moveDown,
  moveUp,
  outdent,
  visibleChildren,
  type DropZone,
  type LensView,
  type TreeModel,
} from '../features/items/treeModel.ts';
import { useItemActions } from '../features/items/useItemActions.ts';
import { useSelectedItemId } from '../features/items/useSelectedItemId.ts';
import { usePersistentState } from '../lib/usePersistentState.ts';

/** Fixed tree pane width, wider on large screens (B-02 decision): 280 px, 320 px from 1440 px. */
export const TREE_WIDTH = { base: 280, wide: 320 } as const;
const WIDE_SCREEN = '@media (min-width: 1440px)';

/** The four root containers read as spaces, not notes (B-02 V2). */
const ROOT_ICON: Record<(typeof ROOT_CONTAINERS)[number], typeof AutoStoriesOutlined> = {
  Knowledge: AutoStoriesOutlined,
  Projects: WorkOutlineRounded,
  College: SchoolOutlined,
  Personal: SpaOutlined,
};
/** Every top-level item is a folder (B-01 B14); the classic names and My garden keep their own icons. */
function folderIcon(item: ItemSummary): ReactNode {
  if (item.parentId !== null) return null;
  const Icon =
    item.title === 'My garden'
      ? LocalFloristOutlined
      : (ROOT_CONTAINERS as readonly string[]).includes(item.title)
        ? ROOT_ICON[item.title as keyof typeof ROOT_ICON]
        : FolderOutlined;
  return <Icon fontSize="small" sx={{ color: 'primary.main' }} />;
}
const DRAG_TYPE = 'application/x-niwa-item';

/**
 * Garden's tree — CONCEPT.md §2, B-01 B9. One tree with an All · Notes · Tasks filter; the Notes and Tasks
 * filters dim the ancestors shown only for context.
 */
export function TreePane({ lens, fullWidth = false }: { lens: GardenFilter; fullWidth?: boolean }) {
  const [showArchived, setShowArchived] = usePersistentState('niwa.tree.showArchived', false);
  const { data: items, isLoading, error } = useTree(showArchived);
  const model = useMemo(() => buildTree(items ?? []), [items]);
  const view = useMemo(() => lensView(model, lens), [model, lens]);
  const selectedId = useSelectedItemId();
  const navigate = useNavigate();
  const actions = useItemActions();
  const [expanded, setExpanded] = usePersistentState<string[]>(`niwa.tree.expanded.${lens}`, []);

  // Reveal the selected item.
  // A tree on screen means a note is likely next: fetch the editor in the background (B-02 V4).
  useEffect(() => preloadNoteEditorWhenIdle(), []);
  useEffect(() => {
    if (!selectedId || !model.byId.has(selectedId)) return;
    const path = ancestorsOf(model, selectedId).map((a) => a.id);
    setExpanded((prev) => (path.every((id) => prev.includes(id)) ? prev : [...new Set([...prev, ...path])]));
  }, [selectedId, model, setExpanded]);

  const open = (item: ItemSummary) => navigate(`${LENS_PATH[item.nature]}/${item.id}`);

  return (
    <Box
      component="aside"
      aria-label="Garden tree"
      data-tour="tree"
      sx={{
        width: fullWidth ? '100%' : TREE_WIDTH.base,
        [WIDE_SCREEN]: { width: fullWidth ? '100%' : TREE_WIDTH.wide },
        flexShrink: 0,
        borderRight: fullWidth ? 0 : 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        minHeight: fullWidth ? '100%' : 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1, pb: 0.5, gap: 0.5 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={lens}
          aria-label="Show in the garden"
          sx={{
            flex: 1,
            '& .MuiToggleButton-root': { flex: 1, py: 0.25, typography: 'caption', fontWeight: 600 },
          }}
        >
          {GARDEN_FILTERS.map((f) => (
            <ToggleButton key={f.key} value={f.key} component={RouterLink} to={f.path}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Tooltip title={showArchived ? 'Hide archived' : 'Show archived'}>
          <IconButton
            size="small"
            aria-label="Show archived"
            aria-pressed={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            color={showArchived ? 'primary' : 'default'}
          >
            <ArchiveOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="New top-level item">
          <IconButton
            size="small"
            aria-label="New top-level item"
            onClick={() => actions.openCreate({ parentId: null, type: newItemType(null, lens) })}
          >
            <AddRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1, pb: 2 }}>
        {isLoading && (
          <Box sx={{ px: 1 }}>
            {[70, 55, 80, 60].map((w) => (
              <Skeleton key={w} width={`${w}%`} height={32} />
            ))}
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ m: 1 }}>
            {messageOf(error)}
          </Alert>
        )}
        {items && (
          <SimpleTreeView
            aria-label="Garden"
            expandedItems={expanded}
            onExpandedItemsChange={(_, ids) => setExpanded(ids)}
            selectedItems={selectedId && view.visible.has(selectedId) ? selectedId : null}
            onSelectedItemsChange={(_, id) => {
              const item = id ? model.byId.get(id) : undefined;
              if (item) open(item);
            }}
            expansionTrigger="iconContainer"
            itemChildrenIndentation={12}
            sx={{
              // Indentation guides: a hairline down each open group, under the parent's chevron.
              '& .MuiTreeItem-groupTransition': {
                ml: '13px',
                borderLeft: 1,
                borderColor: 'divider',
              },
              '& .MuiTreeItem-content': { borderRadius: 1, minHeight: 36 },
            }}
          >
            <TreeNodes
              parentId={null}
              model={model}
              view={view}
              lens={lens}
              onExpand={(id) => setExpanded((p) => [...new Set([...p, id])])}
            />
          </SimpleTreeView>
        )}
      </Box>
    </Box>
  );
}

interface NodesProps {
  parentId: string | null;
  model: TreeModel;
  view: LensView;
  lens: GardenFilter;
  onExpand: (id: string) => void;
}

function TreeNodes({ parentId, model, view, lens, onExpand }: NodesProps) {
  const actions = useItemActions();

  const onKeyDown =
    (item: ItemSummary) => (e: KeyboardEvent<HTMLLIElement> & { defaultMuiPrevented?: boolean }) => {
      if (e.target !== e.currentTarget) return; // only the focused row handles keys
      const run = (m: ReturnType<typeof moveUp>) => {
        e.preventDefault();
        e.defaultMuiPrevented = true;
        void actions.move(m);
      };
      if (e.altKey && e.key === 'ArrowUp') run(moveUp(model, item));
      else if (e.altKey && e.key === 'ArrowDown') run(moveDown(model, item));
      else if (e.key === 'Tab' && !e.shiftKey) {
        // When indent isn't possible, let Tab move focus out of the tree as usual.
        const m = indent(model, item);
        if (m) {
          onExpand(m.input.parentId!); // the previous sibling becomes the parent
          run(m);
        }
      } else if (e.key === 'Tab' && e.shiftKey) {
        const m = outdent(model, item);
        if (m) run(m);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        e.defaultMuiPrevented = true;
        void actions.remove(item, model.children.get(item.id)?.length ?? 0);
      }
    };

  return (
    <>
      {visibleChildren(model, view, parentId).map((item) => (
        <TreeItem
          key={item.id}
          itemId={item.id}
          aria-label={view.dimmed.has(item.id) ? `${item.title} (context)` : item.title}
          label={
            <NodeLabel
              item={item}
              model={model}
              lens={lens}
              dimmed={view.dimmed.has(item.id)}
              onExpand={onExpand}
            />
          }
          onKeyDown={onKeyDown(item)}
          slotProps={{ content: { style: { paddingTop: 0, paddingBottom: 0 } } }}
        >
          {model.children.has(item.id) ? (
            <TreeNodes parentId={item.id} model={model} view={view} lens={lens} onExpand={onExpand} />
          ) : null}
        </TreeItem>
      ))}
    </>
  );
}

interface LabelProps {
  item: ItemSummary;
  model: TreeModel;
  lens: GardenFilter;
  dimmed: boolean;
  onExpand: (id: string) => void;
}

function NodeLabel({ item, model, lens, dimmed, onExpand }: LabelProps) {
  const actions = useItemActions();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [drop, setDrop] = useState<DropZone | null>(null);

  const zoneOf = (e: DragEvent<HTMLElement>): DropZone => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    return y < 0.28 ? 'before' : y > 0.72 ? 'after' : 'inside';
  };

  const stop = (e: MouseEvent) => e.stopPropagation();
  const folder = folderIcon(item);
  const root = !!folder;

  return (
    <Box
      draggable
      data-testid={`tree-label-${item.id}`}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, item.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDrop(zoneOf(e));
      }}
      onDragLeave={() => setDrop(null)}
      onDrop={(e) => {
        e.preventDefault();
        setDrop(null);
        const dragged = model.byId.get(e.dataTransfer.getData(DRAG_TYPE));
        const zone = zoneOf(e);
        if (!dragged) return;
        const m = dropMove(model, dragged, item, zone);
        if (m && zone === 'inside') onExpand(item.id);
        void actions.move(m);
      }}
      sx={(theme) => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.75,
        minWidth: 0,
        borderRadius: 1,
        opacity: dimmed ? 0.55 : 1,
        boxShadow:
          drop === 'before'
            ? `inset 0 2px 0 ${(theme.vars ?? theme).palette.primary.main}`
            : drop === 'after'
              ? `inset 0 -2px 0 ${(theme.vars ?? theme).palette.primary.main}`
              : 'none',
        bgcolor:
          drop === 'inside' ? theme.alpha((theme.vars ?? theme).palette.primary.main, 0.16) : 'transparent',
        // Row actions float over the end of the row on hover/focus, so titles use the full width otherwise.
        '& .node-actions': { opacity: 0 },
        '&:hover .node-actions, &:focus-within .node-actions': { opacity: 1 },
        // Keyboard focus sits on the tree item, an ancestor of this label.
        '.Mui-focused & .node-actions': { opacity: 1 },
      })}
    >
      {folder ? (
        folder
      ) : (
        <ItemTypeIcon type={item.type} completed={item.status === 'completed'} fontSize="small" />
      )}
      <Typography
        variant="body1"
        noWrap
        title={dimmed ? `${item.title} — shown for context` : item.title}
        sx={{
          flex: 1,
          minWidth: 0,
          fontWeight: root ? 600 : 400,
          fontStyle: item.archivedAt ? 'italic' : 'normal',
          textDecoration:
            item.status === 'completed' && item.nature === 'actionable' ? 'line-through' : 'none',
          color: item.status === 'completed' ? 'text.secondary' : 'text.primary',
        }}
      >
        {item.title}
      </Typography>
      {item.nature === 'actionable' && item.status !== 'not_started' && item.status !== 'completed' && (
        <Box
          component="span"
          aria-label={STATUS_LABEL[item.status]}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: item.status === 'blocked' ? 'warning.main' : 'info.main',
            flexShrink: 0,
          }}
        />
      )}
      <Box
        className="node-actions"
        sx={(theme) => ({
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          pl: 2,
          borderRadius: 1,
          // Fade in from the row colour so the title runs under it softly.
          background: `linear-gradient(to right, transparent, ${(theme.vars ?? theme).palette.background.paper} 16px)`,
        })}
      >
        <IconButton
          size="small"
          aria-label={`Add child to ${item.title}`}
          onClick={(e) => {
            stop(e);
            actions.openCreate({ parentId: item.id, type: newItemType(item, lens) });
          }}
          sx={{ p: 0.25 }}
        >
          <AddRounded fontSize="inline" />
        </IconButton>
        <IconButton
          size="small"
          aria-label={`More actions for ${item.title}`}
          onClick={(e) => {
            stop(e);
            setMenuAnchor(e.currentTarget);
          }}
          sx={{ p: 0.25 }}
        >
          <MoreHorizRounded fontSize="inline" />
        </IconButton>
      </Box>
      {menuAnchor && (
        <ItemMenu
          item={item}
          model={model}
          lens={lens}
          anchorEl={menuAnchor}
          onClose={() => setMenuAnchor(null)}
        />
      )}
    </Box>
  );
}
