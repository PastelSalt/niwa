import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import SubdirectoryArrowRightRounded from '@mui/icons-material/SubdirectoryArrowRightRounded';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEditorState, type Editor } from '@tiptap/react';
import { useState } from 'react';
import { usePersistentState } from '../../../lib/usePersistentState.ts';
import type { HeadingEntry } from './headings.ts';

interface OutlineProps {
  editor: Editor;
  onPromote: (heading: HeadingEntry) => void;
  onCopyLink: (heading: HeadingEntry) => void;
}

/** Derived document outline from H1–H3 (specs §5). Never creates items by itself. */
export function Outline({ editor, onPromote, onCopyLink }: OutlineProps) {
  const [open, setOpen] = usePersistentState('niwa.outline.open', true);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; heading: HeadingEntry } | null>(null);

  const headings = useEditorState({
    editor,
    selector: ({ editor: e }): HeadingEntry[] => {
      const out: HeadingEntry[] = [];
      e.state.doc.forEach((node) => {
        if (node.type.name === 'heading' && node.attrs.anchorId) {
          out.push({
            anchorId: node.attrs.anchorId,
            level: node.attrs.level,
            text: node.textContent || 'Untitled heading',
          });
        }
      });
      return out;
    },
  });

  if (headings.length === 0) return null;

  const jump = (h: HeadingEntry) => {
    const el = editor.view.dom.querySelector(`[data-anchor-id="${CSS.escape(h.anchorId)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(window.history.state, '', `#h-${h.anchorId}`);
  };

  return (
    <Paper variant="outlined" component="nav" aria-label="Outline" sx={{ mb: 2 }}>
      <ButtonBase
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        sx={{ width: '100%', justifyContent: 'space-between', px: 1.5, py: 1, borderRadius: 1 }}
      >
        <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1.5 }}>
          Outline · {headings.length}
        </Typography>
        {open ? <ExpandLessRounded fontSize="small" /> : <ExpandMoreRounded fontSize="small" />}
      </ButtonBase>
      <Collapse in={open}>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, px: 1, pb: 1 }}>
          {headings.map((h) => (
            <Box
              component="li"
              key={h.anchorId}
              sx={{
                display: 'flex',
                alignItems: 'center',
                pl: (h.level - 1) * 2,
                '& .outline-actions': { opacity: 0 },
                '&:hover .outline-actions, &:focus-within .outline-actions': { opacity: 1 },
              }}
            >
              <ButtonBase
                onClick={() => jump(h)}
                sx={{
                  flex: 1,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography variant="body2" noWrap sx={{ fontWeight: h.level === 1 ? 600 : 400 }}>
                  {h.text}
                </Typography>
              </ButtonBase>
              <IconButton
                className="outline-actions"
                size="small"
                aria-label={`Actions for heading ${h.text}`}
                onClick={(e) => setMenu({ anchor: e.currentTarget, heading: h })}
              >
                <MoreHorizRounded fontSize="inline" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Collapse>
      <Menu
        anchorEl={menu?.anchor}
        open={!!menu}
        onClose={() => setMenu(null)}
        slotProps={{ list: { dense: true } }}
      >
        <MenuItem
          onClick={() => {
            if (menu) onCopyLink(menu.heading);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <LinkRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy link to section</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) onPromote(menu.heading);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <SubdirectoryArrowRightRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Promote to child item</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}
