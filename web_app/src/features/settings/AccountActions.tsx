import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Password } from '@niwa/contracts';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { messageOf } from '../../api/client.ts';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { useNotify } from '../../components/Notifier.tsx';

/** Change password (B-01 B4). Other devices are signed out; this one gets a fresh session. */
export function ChangePassword() {
  const { api } = useAuth();
  const notify = useNotify();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tooShort = next.length > 0 && !Password.safeParse(next).success;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.account.changePassword({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      notify('Password changed. Other devices have been signed out.');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 400 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={tooShort}
          helperText="At least 12 characters."
        />
        <div>
          <Button type="submit" variant="outlined" loading={busy} disabled={!current || !next || tooShort}>
            Change password
          </Button>
        </div>
      </Stack>
    </form>
  );
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

/** How much of the per-account limits is used (multi-user readiness). */
function Usage() {
  const { api } = useAuth();
  const { data } = useQuery({ queryKey: ['account-usage'], queryFn: () => api.account.usage() });
  if (!data) return null;
  const rows: [label: string, used: number, limit: number, text: string][] = [
    [
      'Items (Trash included)',
      data.items,
      data.itemLimit,
      `${data.items.toLocaleString()} of ${data.itemLimit.toLocaleString()}`,
    ],
    ['Images', data.imageBytes, data.imageByteLimit, `${mb(data.imageBytes)} of ${mb(data.imageByteLimit)}`],
  ];
  return (
    <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 400 }}>
      {rows.map(([label, used, limit, text]) => (
        <div key={label}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2">{label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (used / limit) * 100)}
            aria-label={`${label}: ${text}`}
            sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
          />
        </div>
      ))}
    </Stack>
  );
}

/** "Export my data" (B-01 B4): everything the account owns as one JSON file. */
export function ExportData() {
  const { api } = useAuth();
  const notify = useNotify();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const data = await api.account.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `niwa-export-${data.exportedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Usage />
      <Typography variant="body2" color="text.secondary">
        Download your notes, tasks, ideas, links and schedule as a JSON file. Images are listed with their
        links.
      </Typography>
      <Button variant="outlined" loading={busy} onClick={() => void download()}>
        Export my data
      </Button>
    </Stack>
  );
}

/** Delete account (B-01 B4): password-confirmed and permanent. */
export function DeleteAccount() {
  const { api } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setPassword('');
    setError(null);
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Clears the session; the guards then take the visitor out of the app.
      await api.account.delete(password);
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        Permanently deletes your account and everything in it, including images. This can't be undone — export
        your data first if you want a copy.
      </Typography>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        Delete account…
      </Button>
      <Dialog open={open} onClose={busy ? undefined : close} aria-labelledby="delete-account-title">
        <form onSubmit={(e) => void confirm(e)}>
          <DialogTitle id="delete-account-title">Delete your account?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Your notes, tasks, schedule and images will be deleted for good. Enter your password to confirm.
            </DialogContentText>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" color="error" variant="contained" loading={busy} disabled={!password}>
              Delete forever
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
