import AddRounded from '@mui/icons-material/AddRounded';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import FormatIndentDecreaseRounded from '@mui/icons-material/FormatIndentDecreaseRounded';
import FormatIndentIncreaseRounded from '@mui/icons-material/FormatIndentIncreaseRounded';
import UnarchiveOutlined from '@mui/icons-material/UnarchiveOutlined';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import type { ReactNode } from 'react';
import type { GardenFilter } from '../../layout/destinations.tsx';
import { newItemType } from './itemMeta.tsx';
import { indent, moveDown, moveUp, outdent, type TreeModel } from './treeModel.ts';
import { useItemActions } from './useItemActions.ts';

interface ItemMenuProps {
  item: ItemSummary;
  model: TreeModel;
  lens: GardenFilter;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

/** Per-item commands. Shortcuts shown are handled by the tree's keyboard handler. */
export function ItemMenu({ item, model, lens, anchorEl, onClose }: ItemMenuProps) {
  const actions = useItemActions();
  const up = moveUp(model, item);
  const down = moveDown(model, item);
  const right = indent(model, item);
  const left = outdent(model, item);
  const childCount = model.children.get(item.id)?.length ?? 0;

  const entry = (
    label: string,
    icon: ReactNode,
    run: () => void,
    opts: { shortcut?: string; disabled?: boolean } = {},
  ) => (
    <MenuItem
      disabled={opts.disabled}
      onClick={() => {
        onClose();
        run();
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{label}</ListItemText>
      {opts.shortcut && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
          {opts.shortcut}
        </Typography>
      )}
    </MenuItem>
  );

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
      slotProps={{ list: { dense: true } }}
    >
      {entry('Add child', <AddRounded fontSize="small" />, () =>
        actions.openCreate({ parentId: item.id, type: newItemType(item, lens) }),
      )}
      <Divider />
      {entry('Move up', <ArrowUpwardRounded fontSize="small" />, () => void actions.move(up), {
        shortcut: 'Alt+↑',
        disabled: !up,
      })}
      {entry('Move down', <ArrowDownwardRounded fontSize="small" />, () => void actions.move(down), {
        shortcut: 'Alt+↓',
        disabled: !down,
      })}
      {entry('Indent', <FormatIndentIncreaseRounded fontSize="small" />, () => void actions.move(right), {
        shortcut: 'Tab',
        disabled: !right,
      })}
      {entry('Outdent', <FormatIndentDecreaseRounded fontSize="small" />, () => void actions.move(left), {
        shortcut: 'Shift+Tab',
        disabled: !left,
      })}
      {entry('Move to…', <DriveFileMoveOutlined fontSize="small" />, () => actions.openMove(item))}
      <Divider />
      {item.archivedAt
        ? entry(
            'Unarchive',
            <UnarchiveOutlined fontSize="small" />,
            () => void actions.setArchived(item, false),
          )
        : entry('Archive', <ArchiveOutlined fontSize="small" />, () => void actions.setArchived(item, true))}
      {entry(
        'Delete',
        <DeleteOutlineRounded fontSize="small" color="error" />,
        () => void actions.remove(item, childCount),
        {
          shortcut: 'Del',
        },
      )}
    </Menu>
  );
}
