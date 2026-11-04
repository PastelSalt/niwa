import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/** Text-shaped stand-in while the editor loads — a toolbar and a few lines, not a grey block (B-02 V4). */
export function EditorPlaceholder() {
  return (
    <Box role="status" aria-label="Loading editor" sx={{ pt: 0.5 }}>
      <Skeleton variant="rounded" height={32} sx={{ mb: 2.5, maxWidth: 420 }} />
      {[92, 100, 84, 96, 60].map((w, i) => (
        <Skeleton key={i} variant="text" width={`${w}%`} sx={{ typography: 'body1', mb: 0.5 }} />
      ))}
    </Box>
  );
}
