import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Note {
  key: number;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  action?: { label: string; onClick: () => void };
}

type Notify = (message: string, opts?: Partial<Omit<Note, 'key' | 'message'>>) => void;

const NotifyContext = createContext<Notify>(() => {});

/** One snackbar at a time (MUI guidance); a new note replaces the current one. */
export function NotifierProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback<Notify>((message, opts) => {
    setNote({ key: Date.now(), message, severity: opts?.severity ?? 'success', action: opts?.action });
    setOpen(true);
  }, []);

  const value = useMemo(() => notify, [notify]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        key={note?.key}
        open={open}
        autoHideDuration={
          note?.action || note?.severity === 'warning' || note?.severity === 'error' ? 6000 : 3500
        }
        onClose={(_, reason) => reason !== 'clickaway' && setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 8, md: 0 } }}
      >
        <Alert
          severity={note?.severity}
          variant="filled"
          onClose={() => setOpen(false)}
          action={
            note?.action ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  note.action!.onClick();
                  setOpen(false);
                }}
              >
                {note.action.label}
              </Button>
            ) : undefined
          }
          sx={{ alignItems: 'center' }}
        >
          {note?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export const useNotify = () => useContext(NotifyContext);
