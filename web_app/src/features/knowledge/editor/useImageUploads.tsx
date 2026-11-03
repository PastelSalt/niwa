import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useQuery } from '@tanstack/react-query';
import type { Editor } from '@tiptap/react';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { messageOf } from '../../../api/client.ts';
import { useAuth } from '../../../auth/AuthProvider.tsx';
import { useNotify } from '../../../components/Notifier.tsx';
import { altFromName, uploadImage, UploadError } from './uploadImage.ts';

/**
 * Images in a note body: toolbar picker, paste and drop, upload status, and alt text
 * (alt text also feeds search — DATA_MODEL.md §9).
 */
export function useImageUploads(editor: Editor | null, itemId: string) {
  const { api } = useAuth();
  const notify = useNotify();
  const { data: config } = useQuery({
    queryKey: ['uploadConfig'],
    queryFn: () => api.uploads.config(),
    staleTime: Infinity,
  });
  const enabled = !!config?.enabled;
  const [uploading, setUploading] = useState(0);
  const [altFor, setAltFor] = useState<{ value: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertFiles = useCallback(
    async (files: File[], pos?: number) => {
      if (!editor) return;
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (!images.length) return;
      if (!enabled) {
        notify('Image uploads are not set up on this server yet.', { severity: 'warning' });
        return;
      }
      for (const file of images) {
        setUploading((n) => n + 1);
        try {
          const { attachment, src } = await uploadImage(api, itemId, file);
          const node = {
            type: 'image',
            attrs: { src, alt: altFromName(file.name), attachmentId: attachment.id },
          };
          if (pos !== undefined) editor.chain().focus().insertContentAt(pos, node).run();
          else editor.chain().focus().insertContent(node).run();
        } catch (err) {
          notify(err instanceof UploadError ? err.message : messageOf(err), { severity: 'error' });
        } finally {
          setUploading((n) => n - 1);
        }
      }
    },
    [editor, enabled, api, itemId, notify],
  );

  const pickImage = useCallback(() => inputRef.current?.click(), []);

  const editAlt = useCallback(() => {
    if (!editor?.isActive('image')) return;
    setAltFor({ value: (editor.getAttributes('image').alt as string | undefined) ?? '' });
  }, [editor]);

  const elements: ReactNode = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        aria-hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          void insertFiles(files);
        }}
      />
      {altFor && (
        <Dialog open onClose={() => setAltFor(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Image description</DialogTitle>
          <DialogContent>
            <DialogContentText variant="body2" sx={{ mb: 2 }}>
              Describe the image for screen readers and search. Leave empty if it’s purely decorative.
            </DialogContentText>
            <TextField
              autoFocus
              label="Alt text"
              value={altFor.value}
              onChange={(e) => setAltFor({ value: e.target.value })}
              slotProps={{ htmlInput: { maxLength: 300 } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAltFor(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                editor?.chain().focus().updateAttributes('image', { alt: altFor.value.trim() }).run();
                setAltFor(null);
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );

  return { enabled, uploading, insertFiles, pickImage, editAlt, elements };
}
