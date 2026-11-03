import LinkOffRounded from '@mui/icons-material/LinkOffRounded';
import Box from '@mui/material/Box';
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { useNavigate } from 'react-router';
import { ItemTypeIcon } from '../../items/itemMeta.tsx';
import { useTree } from '../../items/queries.ts';
import type { NiwaLinkAttrs } from './extensions.ts';

/** Inline item link chip. Shows the target's live title; click opens it (and its section). */
export function NiwaLinkView({ node, selected }: ReactNodeViewProps) {
  const { itemId, anchorId, title, sectionTitle } = node.attrs as NiwaLinkAttrs;
  const { data: items } = useTree();
  const navigate = useNavigate();
  const target = items?.find((i) => i.id === itemId);
  const missing = !!items && !target;

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Box
        component="a"
        href={`/items/${itemId}${anchorId ? `#h-${anchorId}` : ''}`}
        data-niwa-link=""
        data-item-id={itemId}
        contentEditable={false}
        title={missing ? 'This item was deleted or is in the Inbox' : undefined}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          if (!missing) navigate(`/items/${itemId}${anchorId ? `#h-${anchorId}` : ''}`);
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: 0.125,
          mx: 0.25,
          borderRadius: 1,
          fontSize: '0.95em',
          lineHeight: 1.5,
          verticalAlign: 'baseline',
          textDecoration: 'none',
          cursor: missing ? 'default' : 'pointer',
          color: missing ? 'text.disabled' : 'primary.main',
          bgcolor: 'action.hover',
          outline: selected ? 2 : 0,
          outlineColor: 'primary.main',
          '&:hover': { bgcolor: missing ? 'action.hover' : 'action.selected' },
        }}
      >
        {missing ? (
          <LinkOffRounded sx={{ fontSize: '1em' }} />
        ) : (
          target && <ItemTypeIcon type={target.type} sx={{ fontSize: '1em' }} />
        )}
        <span>{target?.title ?? title}</span>
        {anchorId && (
          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>
            › {sectionTitle ?? 'section'}
          </Box>
        )}
      </Box>
    </NodeViewWrapper>
  );
}
