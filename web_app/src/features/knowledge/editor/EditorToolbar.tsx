import CodeRounded from '@mui/icons-material/CodeRounded';
import DataObjectRounded from '@mui/icons-material/DataObjectRounded';
import FormatBoldRounded from '@mui/icons-material/FormatBoldRounded';
import FormatItalicRounded from '@mui/icons-material/FormatItalicRounded';
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded';
import FormatListNumberedRounded from '@mui/icons-material/FormatListNumberedRounded';
import FormatQuoteRounded from '@mui/icons-material/FormatQuoteRounded';
import FormatStrikethroughRounded from '@mui/icons-material/FormatStrikethroughRounded';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import InsertLinkRounded from '@mui/icons-material/InsertLinkRounded';
import ShortTextRounded from '@mui/icons-material/ShortTextRounded';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEditorState, type Editor } from '@tiptap/react';
import type { ReactNode } from 'react';
import type { SaveStatus } from './useAutosave.ts';

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Not saved',
  conflict: 'Changed elsewhere',
};

/** Formatting bar. `useEditorState` keeps re-renders to the active-state flags only. */
interface ImageControls {
  enabled: boolean;
  uploading: number;
  pick: () => void;
  editAlt: () => void;
}

export function EditorToolbar({
  editor,
  status,
  images,
}: {
  editor: Editor;
  status: SaveStatus;
  images: ImageControls;
}) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      image: e.isActive('image'),
    }),
  });

  const btn = (label: string, shortcut: string, active: boolean, run: () => void, icon: ReactNode) => (
    <Tooltip title={`${label}${shortcut ? ` · ${shortcut}` : ''}`}>
      <ToggleButton
        value={label}
        size="small"
        selected={active}
        aria-label={label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run}
        sx={{ border: 0, px: 0.75, py: 0.5, minWidth: 32 }}
      >
        {icon}
      </ToggleButton>
    </Tooltip>
  );
  const chain = () => editor.chain().focus();
  const heading = (level: 1 | 2 | 3) => (
    <Typography component="span" sx={{ typography: 'body2', fontWeight: 700, lineHeight: 1 }}>
      H{level}
    </Typography>
  );

  return (
    <Box
      role="toolbar"
      aria-label="Formatting"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.25,
        py: 0.5,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {btn('H1 heading', 'Ctrl+Alt+1', s.h1, () => chain().toggleHeading({ level: 1 }).run(), heading(1))}
      {btn('H2 heading', 'Ctrl+Alt+2', s.h2, () => chain().toggleHeading({ level: 2 }).run(), heading(2))}
      {btn('H3 heading', 'Ctrl+Alt+3', s.h3, () => chain().toggleHeading({ level: 3 }).run(), heading(3))}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      {btn(
        'Bold',
        'Ctrl+B',
        s.bold,
        () => chain().toggleBold().run(),
        <FormatBoldRounded fontSize="small" />,
      )}
      {btn(
        'Italic',
        'Ctrl+I',
        s.italic,
        () => chain().toggleItalic().run(),
        <FormatItalicRounded fontSize="small" />,
      )}
      {btn(
        'Strikethrough',
        '',
        s.strike,
        () => chain().toggleStrike().run(),
        <FormatStrikethroughRounded fontSize="small" />,
      )}
      {btn(
        'Inline code',
        'Ctrl+E',
        s.code,
        () => chain().toggleCode().run(),
        <CodeRounded fontSize="small" />,
      )}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      {btn(
        'Bullet list',
        '',
        s.bullet,
        () => chain().toggleBulletList().run(),
        <FormatListBulletedRounded fontSize="small" />,
      )}
      {btn(
        'Numbered list',
        '',
        s.ordered,
        () => chain().toggleOrderedList().run(),
        <FormatListNumberedRounded fontSize="small" />,
      )}
      {btn(
        'Quote',
        '',
        s.quote,
        () => chain().toggleBlockquote().run(),
        <FormatQuoteRounded fontSize="small" />,
      )}
      {btn(
        'Code block',
        '',
        s.codeBlock,
        () => chain().toggleCodeBlock().run(),
        <DataObjectRounded fontSize="small" />,
      )}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      {btn(
        'Link to item',
        '[[',
        false,
        () => chain().insertContent('[[').run(),
        <InsertLinkRounded fontSize="small" />,
      )}
      {images.enabled ? (
        btn('Insert image', 'or paste / drop', false, images.pick, <ImageOutlined fontSize="small" />)
      ) : (
        <Tooltip title="Image uploads aren’t set up on this server (Cloudinary)">
          <span>
            <ToggleButton
              value="image"
              size="small"
              disabled
              aria-label="Insert image"
              sx={{ border: 0, px: 0.75, py: 0.5, minWidth: 32 }}
            >
              <ImageOutlined fontSize="small" />
            </ToggleButton>
          </span>
        </Tooltip>
      )}
      {s.image && btn('Image description', '', false, images.editAlt, <ShortTextRounded fontSize="small" />)}
      <Typography
        variant="caption"
        role="status"
        aria-live="polite"
        color={status === 'error' || status === 'conflict' ? 'error' : 'text.secondary'}
        sx={{ ml: 'auto', pr: 0.5 }}
      >
        {images.uploading > 0
          ? `Uploading ${images.uploading > 1 ? `${images.uploading} images` : 'image'}…`
          : STATUS_TEXT[status]}
      </Typography>
    </Box>
  );
}
