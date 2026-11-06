import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { messageOf } from '../../api/client.ts';
import { useSavePreferences } from '../../app/appearance.tsx';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { stitchSx } from '../../components/Surface.tsx';

/** Accounts made before the Scrapbook look (NIWA-PLAN-B-03 C1) get one chance to switch back. */
export const NEW_LOOK_SINCE = '2026-11-06T00:00:00.000Z';

/**
 * "NIWA has a new look" (B-03 C1): shown once on Today to accounts that had the old flat layout. Keeping it or
 * switching back both count as a choice, so the card never comes back.
 */
export function NewLookCard() {
  const { user } = useAuth();
  const save = useSavePreferences();
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  if (!user || user.preferences.layout.chosen || user.createdAt >= NEW_LOOK_SINCE) return null;

  const choose = (preset: 'scrapbook' | 'classic') => {
    setBusy(true);
    save({ layout: { preset, chosen: true } })
      .then(() => {
        if (preset === 'classic') notify('Back to Classic. You can change it in Settings › Appearance.');
      })
      .catch((err) => notify(messageOf(err), { severity: 'error' }))
      .finally(() => setBusy(false));
  };

  return (
    <Paper component="section" aria-labelledby="new-look" variant="outlined" sx={[{ p: 2.5 }, stitchSx]}>
      <Typography id="new-look" variant="subtitle1" component="h3">
        NIWA has a new look
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Paper cards on a patterned page. Patterns, spacing and the sidebar are all in Settings › Appearance.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Button variant="contained" disabled={busy} onClick={() => choose('scrapbook')}>
          Keep it
        </Button>
        <Button color="inherit" disabled={busy} onClick={() => choose('classic')}>
          Switch back to Classic
        </Button>
      </Box>
    </Paper>
  );
}
