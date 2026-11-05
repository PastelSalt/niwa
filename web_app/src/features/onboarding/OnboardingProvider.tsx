import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { OnboardingStatus } from '@niwa/contracts';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { addClassicFolders, addExampleNotes } from './examples.ts';
import { TOUR_STEPS, TOUR_VERSION } from './tour.ts';

interface OnboardingContextValue {
  /** Starts the tour from the first step (Settings › Help, Help menu). */
  startTour(): void;
}

const OnboardingContext = createContext<OnboardingContextValue>({ startTour: () => {} });
export const useOnboarding = () => useContext(OnboardingContext);

/**
 * First-run welcome + tour (NIWA-PLAN-B-01 B7). The welcome shows once per account — finishing or
 * skipping is saved on the account, so web and phone agree. Replaying never changes data.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { api, user } = useAuth();
  const queryClient = useQueryClient();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [addExamples, setAddExamples] = useState(false);
  const [classicFolders, setClassicFolders] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const showWelcome = !!user && user.onboarding === null && !welcomeDismissed && step === null;

  const record = useCallback(
    (status: OnboardingStatus) => {
      // Best effort: if it fails, the welcome simply shows again next time.
      void api.account.setOnboarding({ status, version: TOUR_VERSION }).catch(() => null);
    },
    [api],
  );

  const startTour = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setStep(0);
  }, []);

  const finish = useCallback(
    (status: OnboardingStatus) => {
      setStep(null);
      if (user?.onboarding?.version !== TOUR_VERSION || user.onboarding.status !== status) record(status);
      returnFocus.current?.focus?.();
    },
    [record, user],
  );

  const begin = async (take: boolean) => {
    setWelcomeDismissed(true);
    if (classicFolders) await addClassicFolders(api).catch(() => null);
    if (addExamples) await addExampleNotes(api).catch(() => null);
    if (classicFolders || addExamples) void queryClient.invalidateQueries({ queryKey: ['tree'] });
    if (take) startTour();
    else record('skipped');
  };

  const value = useMemo(() => ({ startTour }), [startTour]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <Dialog open={showWelcome} onClose={() => void begin(false)} aria-labelledby="welcome-title">
        <DialogTitle id="welcome-title">Welcome to your garden</DialogTitle>
        <DialogContent>
          <DialogContentText>
            NIWA keeps notes, ideas, tasks and your calendar in one garden. Today shows what's on and what's
            next, with a short Getting started list. Press Ctrl K any time to find or make anything.
          </DialogContentText>
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox checked={classicFolders} onChange={(e) => setClassicFolders(e.target.checked)} />
            }
            label="Start with folders: Knowledge, Projects, College and Personal"
          />
          <FormControlLabel
            control={<Checkbox checked={addExamples} onChange={(e) => setAddExamples(e.target.checked)} />}
            label="Add a few example pages to explore (you can delete them)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void begin(true)}>Take the tour</Button>
          <Button variant="contained" onClick={() => void begin(false)} autoFocus>
            Let’s go
          </Button>
        </DialogActions>
      </Dialog>
      {step !== null && (
        <TourOverlay
          index={step}
          onNext={() => (step + 1 < TOUR_STEPS.length ? setStep(step + 1) : finish('completed'))}
          onBack={() => setStep(Math.max(0, step - 1))}
          onSkip={() => finish('skipped')}
        />
      )}
    </OnboardingContext.Provider>
  );
}

function findTarget(targets: string[]): HTMLElement | null {
  for (const t of targets) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${t}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

function TourOverlay({
  index,
  onNext,
  onBack,
  onSkip,
}: {
  index: number;
  onNext(): void;
  onBack(): void;
  onSkip(): void;
}) {
  const step = TOUR_STEPS[index]!;
  const navigate = useNavigate();
  const location = useLocation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const last = index === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (step.path && !location.pathname.startsWith(step.path)) navigate(step.path);
  }, [step, location.pathname, navigate]);

  // Re-measure after navigation and on resize/scroll so the highlight follows the element.
  useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      const el = findTarget(step.targets);
      setAnchor(el);
      setRect(el?.getBoundingClientRect() ?? null);
    };
    frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, location.pathname]);

  useEffect(() => nextRef.current?.focus(), [index]);

  const card = (
    <Paper
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      elevation={8}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onSkip();
      }}
      sx={{ p: 2.5, maxWidth: (t) => t.niwa.width.card, m: 1.5, border: 1, borderColor: 'divider' }}
    >
      <Typography variant="caption" color="text.secondary" aria-live="polite">
        Step {index + 1} of {TOUR_STEPS.length}
      </Typography>
      <Typography id="tour-title" variant="h6" component="h2" sx={{ mt: 0.5 }}>
        {step.title}
      </Typography>
      <Typography id="tour-body" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {step.body}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
        <Button size="small" onClick={onSkip}>
          Skip tour
        </Button>
        <Box sx={{ flex: 1 }} />
        {index > 0 && (
          <Button size="small" onClick={onBack}>
            Back
          </Button>
        )}
        <Button size="small" variant="contained" onClick={onNext} ref={nextRef}>
          {last ? 'Done' : 'Next'}
        </Button>
      </Stack>
    </Paper>
  );

  return (
    <>
      <Backdrop open sx={{ zIndex: (t) => t.zIndex.modal }} onClick={onSkip} />
      {rect && (
        <Box
          aria-hidden
          sx={{
            position: 'fixed',
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderRadius: 2,
            border: 2,
            borderColor: 'primary.main',
            zIndex: (t) => t.zIndex.modal + 1,
            pointerEvents: 'none',
            '@media (prefers-reduced-motion: no-preference)': { transition: 'all 150ms ease-out' },
          }}
        />
      )}
      {/* A target filling most of the screen (the tree on phones) leaves no room beside it: centre the card. */}
      {anchor && rect && rect.height < window.innerHeight * 0.6 ? (
        <Popper
          open
          anchorEl={anchor}
          placement="auto"
          sx={{ zIndex: (t) => t.zIndex.modal + 2 }}
          // `auto` puts the card on the side with the most room, so it never covers the highlighted element
          // (rail items get it to their right, the top bar gets it below, the tall tree pane beside it).
          modifiers={[{ name: 'preventOverflow', options: { padding: 8 } }]}
        >
          {card}
        </Popper>
      ) : (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            zIndex: (t) => t.zIndex.modal + 2,
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          {card}
        </Box>
      )}
    </>
  );
}
