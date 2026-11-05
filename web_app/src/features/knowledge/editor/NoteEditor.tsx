import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { Item, ItemSummary } from '@niwa/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { messageOf } from '../../../api/client.ts';
import { useAuth } from '../../../auth/AuthProvider.tsx';
import { useNotify } from '../../../components/Notifier.tsx';
import { useItemDialogs } from '../../items/ItemDialogs.tsx';
import { LENS_PATH } from '../../items/itemMeta.tsx';
import { itemKeys } from '../../items/queries.ts';
import { EditorToolbar } from './EditorToolbar.tsx';
import { AnchorGuard, AnchoredHeading, NiwaImage, NiwaLink } from './extensions.ts';
import { asEditorContent, headingsOf, type HeadingEntry } from './headings.ts';
import { LinkSuggestion } from './linkSuggestion.ts';
import { Outline } from './Outline.tsx';
import { useAutosave } from './useAutosave.ts';
import { useImageUploads } from './useImageUploads.tsx';

/**
 * The item's content body — TipTap storing ProseMirror JSON (specs §12.4).
 * Headings feed the outline; they never create items unless the user promotes one (CONCEPT.md §4).
 */
export function NoteEditor({ item }: { item: Item }) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const notify = useNotify();
  const dialogs = useItemDialogs();
  const navigate = useNavigate();
  const location = useLocation();
  const scheduleRef = useRef<() => void>(() => {});
  // Paste/drop handlers are created with the editor; they reach the latest upload function via a ref.
  const insertFilesRef = useRef<(files: File[], pos?: number) => void>(() => {});

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: false, link: { openOnClick: false, autolink: true } }),
        AnchoredHeading,
        AnchorGuard,
        NiwaLink,
        NiwaImage,
        LinkSuggestion.configure({
          getItems: () =>
            (qc.getQueryData<ItemSummary[]>(itemKeys.tree(false)) ?? []).filter((i) => i.id !== item.id),
          fetchHeadings: async (id) => {
            const { item: target } = await qc.fetchQuery({
              queryKey: itemKeys.item(id),
              queryFn: () => api.items.get(id),
            });
            return headingsOf(target.content);
          },
        }),
        Placeholder.configure({ placeholder: 'Write here…  Type [[ to link another page.' }),
      ],
      content: asEditorContent(item.content),
      onUpdate: () => scheduleRef.current(),
      editorProps: {
        attributes: { 'aria-label': 'Note body', role: 'textbox', 'aria-multiline': 'true' },
        handlePaste: (_view, event) => {
          const files = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
          if (!files.length) return false;
          insertFilesRef.current(files);
          return true;
        },
        handleDrop: (view, event, _slice, moved) => {
          const files = [...(event.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
          if (moved || !files.length) return false;
          event.preventDefault();
          insertFilesRef.current(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
          return true;
        },
      },
    },
    [item.id],
  );

  const autosave = useAutosave(item, editor);
  const images = useImageUploads(editor, item.id);
  useEffect(() => {
    scheduleRef.current = autosave.schedule;
    insertFilesRef.current = (files, pos) => void images.insertFiles(files, pos);
  }, [autosave.schedule, images]);

  // Deep link to a section: /items/:id#h-<anchorId> (CONCEPT.md §5.3).
  const hash = location.hash;
  useEffect(() => {
    if (!editor || !hash.startsWith('#h-')) return;
    const el = editor.view.dom.querySelector(`#${CSS.escape(hash.slice(1))}`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('niwa-flash');
      window.setTimeout(() => el.classList.remove('niwa-flash'), 1600);
    } else {
      notify('The linked section no longer exists.', { severity: 'warning' });
    }
  }, [editor, hash, notify]);

  if (!editor) return null;

  const promote = async (h: HeadingEntry) => {
    const ok = await dialogs.confirm({
      title: `Promote “${h.text}” to a child item?`,
      body: 'The section moves into a new child item and is replaced here by a link to it.',
      confirmLabel: 'Promote',
    });
    if (!ok) return;
    try {
      await autosave.flush();
      const res = await api.items.promoteSection(item.id, autosave.currentVersion(), h.anchorId);
      autosave.replaceWith(res.parent);
      qc.setQueryData(itemKeys.item(res.child.id), { item: res.child });
      void qc.invalidateQueries({ queryKey: ['tree'] });
      notify(`Promoted “${res.child.title}” to a child item`, {
        action: { label: 'Open', onClick: () => navigate(`${LENS_PATH[res.child.nature]}/${res.child.id}`) },
      });
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    }
  };

  const copyLink = (h: HeadingEntry) => {
    const url = `${window.location.origin}/items/${item.id}#h-${h.anchorId}`;
    void navigator.clipboard?.writeText(url).then(
      () => notify('Section link copied'),
      () => notify(url, { severity: 'info' }),
    );
  };

  return (
    <Box>
      <Outline editor={editor} onPromote={(h) => void promote(h)} onCopyLink={copyLink} />
      {autosave.conflict && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <>
              <Button color="inherit" size="small" onClick={autosave.keepMine}>
                Keep mine
              </Button>
              <Button color="inherit" size="small" onClick={autosave.loadLatest}>
                Load latest
              </Button>
            </>
          }
        >
          This note was changed somewhere else. Saving is paused.
        </Alert>
      )}
      <EditorToolbar
        editor={editor}
        status={autosave.status}
        images={{
          enabled: images.enabled,
          uploading: images.uploading,
          pick: images.pickImage,
          editAlt: images.editAlt,
        }}
      />
      {images.elements}
      <Box
        onBlur={() => void autosave.flush()}
        sx={(theme) => ({
          '& .ProseMirror': {
            outline: 'none',
            minHeight: 240,
            py: 2,
            ...theme.typography.body1,
            lineHeight: 1.7,
            '& > * + *': { mt: 1.25 },
            // Note headings sit below the item title on the type scale (V1.P1).
            '& h1': { ...theme.typography.h4, mt: 3 },
            '& h2': { ...theme.typography.h6, mt: 3 },
            '& h3': { ...theme.typography.subtitle1, mt: 2.5 },
            '& h1, & h2, & h3': {
              scrollMarginTop: 96,
              borderRadius: 1,
              transition: 'background-color 600ms',
            },
            '& .niwa-flash': { bgcolor: theme.alpha((theme.vars ?? theme).palette.secondary.main, 0.25) },
            '& p': { m: 0 },
            // Only the bottom margin: the top comes from the block rhythm above (V4).
            '& ul, & ol': { pl: 3, mb: 0 },
            '& li + li': { mt: 0.5 },
            '& li > p': { m: 0 },
            '& blockquote': {
              m: 0,
              pl: 2,
              borderLeft: 3,
              borderColor: 'divider',
              color: 'text.secondary',
            },
            '& code': {
              fontFamily: theme.niwa.monoFamily,
              fontSize: '0.875em',
              bgcolor: 'action.hover',
              px: 0.5,
              borderRadius: 0.5,
            },
            '& pre': {
              fontFamily: theme.niwa.monoFamily,
              bgcolor: 'action.hover',
              p: 1.5,
              borderRadius: 1,
              overflowX: 'auto',
              '& code': { bgcolor: 'transparent', p: 0 },
            },
            '& a:not([data-niwa-link])': { color: 'primary.main' },
            '& hr': { border: 0, borderTop: 1, borderColor: 'divider', my: 3 },
            '& img': { display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 1 },
            '& img.ProseMirror-selectednode': { outline: 3, outlineColor: 'primary.main', outlineOffset: 2 },
            '& p.is-editor-empty:first-of-type::before': {
              content: 'attr(data-placeholder)',
              color: 'text.disabled',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
          },
        })}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
