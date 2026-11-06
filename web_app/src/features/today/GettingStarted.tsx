import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DEFAULT_PREFERENCES } from '@niwa/contracts';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { visuallyHidden } from '../../lib/a11y.ts';
import { usePersistentState } from '../../lib/usePersistentState.ts';
import { useQuickCapture } from '../inbox/CaptureProvider.tsx';
import { useInbox } from '../inbox/queries.ts';
import { useTree } from '../items/queries.ts';
import { stitchSx } from '../../components/Surface.tsx';

interface Step {
  key: string;
  label: string;
  done: boolean;
  action: ReactNode;
}

/**
 * Getting started (NIWA-PLAN-B-01 B15): four small things to do instead of a tour to read. Each step ticks
 * itself from what's really in the garden; the card hides when they're all done, or when dismissed.
 */
export function GettingStarted() {
  const { user } = useAuth();
  const capture = useQuickCapture();
  const { data: tree } = useTree();
  const { data: inbox } = useInbox();
  const [hidden, setHidden] = usePersistentState(`niwa.gettingStarted.hidden.${user?.id ?? ''}`, false);
  if (hidden || !tree || !inbox || !user) return null;

  // Anything beyond the top-level folders counts as the garden having content.
  const content = tree.filter((i) => i.parentId !== null);
  const prefs = user.preferences;
  const steps: Step[] = [
    {
      key: 'capture',
      label: 'Capture a thought — press c anywhere',
      done: inbox.length > 0 || content.length > 0,
      action: (
        <Button size="small" onClick={capture.open}>
          Capture
        </Button>
      ),
    },
    {
      key: 'file',
      label: 'Sort it from the Inbox into your garden',
      done: content.length > 0,
      action: (
        <Button size="small" component={RouterLink} to="/inbox?sort=1">
          Open Inbox
        </Button>
      ),
    },
    {
      key: 'plan',
      label: 'Give a task a date',
      done: content.some((i) => i.nature === 'actionable' && !!i.dueAt),
      action: (
        <Button size="small" component={RouterLink} to="/actionable">
          Tasks
        </Button>
      ),
    },
    {
      key: 'look',
      label: 'Pick a colour theme or font you like',
      done: prefs.theme !== DEFAULT_PREFERENCES.theme || prefs.font !== DEFAULT_PREFERENCES.font,
      action: (
        <Button size="small" component={RouterLink} to="/settings/appearance">
          Appearance
        </Button>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <Paper
      component="section"
      aria-labelledby="getting-started"
      variant="outlined"
      sx={[{ p: 2.5 }, stitchSx]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography id="getting-started" variant="subtitle1" component="h3" sx={{ flex: 1 }}>
          Getting started
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {doneCount} of {steps.length}
        </Typography>
        <Button size="small" color="inherit" onClick={() => setHidden(true)}>
          Hide
        </Button>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(doneCount / steps.length) * 100}
        aria-label="Getting started progress"
        sx={{ my: 1.5, height: 6, borderRadius: 3 }}
      />
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {steps.map((s) => (
          <Box
            component="li"
            key={s.key}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minHeight: 40 }}
          >
            {s.done ? (
              <CheckCircleRounded fontSize="small" sx={{ color: 'success.main' }} aria-hidden />
            ) : (
              <RadioButtonUncheckedRounded fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden />
            )}
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                color: s.done ? 'text.secondary' : 'text.primary',
                textDecoration: s.done ? 'line-through' : 'none',
              }}
            >
              <Box component="span" sx={visuallyHidden}>
                {s.done ? 'Done: ' : 'To do: '}
              </Box>
              {s.label}
            </Typography>
            {!s.done && s.action}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
