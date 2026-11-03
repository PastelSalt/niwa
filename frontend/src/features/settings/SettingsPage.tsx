import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthProvider.tsx';

const SECTIONS = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'account', label: 'Account' },
  { key: 'ai', label: 'AI' },
  { key: 'trash', label: 'Trash' },
] as const;
type SectionKey = (typeof SECTIONS)[number]['key'];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

function AppearanceSection() {
  const { mode, setMode } = useColorScheme();
  return (
    <Section title="Theme" description="Light and dark are both first-class. System follows your device.">
      <ToggleButtonGroup
        exclusive
        value={mode ?? 'system'}
        onChange={(_, next: 'light' | 'dark' | 'system' | null) => next && setMode(next)}
        aria-label="Theme"
      >
        <ToggleButton value="light" aria-label="Light">
          <LightModeOutlined fontSize="small" sx={{ mr: 1 }} /> Light
        </ToggleButton>
        <ToggleButton value="dark" aria-label="Dark">
          <DarkModeOutlined fontSize="small" sx={{ mr: 1 }} /> Dark
        </ToggleButton>
        <ToggleButton value="system" aria-label="System">
          <SettingsBrightnessOutlined fontSize="small" sx={{ mr: 1 }} /> System
        </ToggleButton>
      </ToggleButtonGroup>
    </Section>
  );
}

function AccountSection() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <Section title="Account">
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2">
          <Box component="span" sx={{ color: 'text.secondary' }}>
            Email ·{' '}
          </Box>
          {user.email}
        </Typography>
        <Typography variant="body2">
          <Box component="span" sx={{ color: 'text.secondary' }}>
            Gardening since ·{' '}
          </Box>
          {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
        </Typography>
      </Stack>
      <Button variant="outlined" color="error" onClick={() => void logout()}>
        Log out
      </Button>
    </Section>
  );
}

function ComingSoon({ title, milestone, text }: { title: string; milestone: string; text: string }) {
  return (
    <Section title={title} description={text}>
      <Typography variant="body2" color="text.secondary">
        Arrives in {milestone}.
      </Typography>
    </Section>
  );
}

export function SettingsPage() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const current = SECTIONS.find((s) => s.key === section)?.key;
  if (!current) return <Navigate to="/settings/appearance" replace />;

  const body: Record<SectionKey, ReactNode> = {
    appearance: <AppearanceSection />,
    account: <AccountSection />,
    ai: (
      <ComingSoon
        title="DeepSeek AI"
        milestone="M8"
        text="Summaries, child breakdowns and tag suggestions — only when you ask, only for the item you choose."
      />
    ),
    trash: (
      <ComingSoon title="Trash" milestone="M3" text="Restore deleted items or delete them permanently." />
    ),
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 760 }}>
      <Tabs
        value={current}
        onChange={(_, key: SectionKey) => navigate(`/settings/${key}`)}
        variant="scrollable"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {SECTIONS.map((s) => (
          <Tab key={s.key} value={s.key} label={s.label} />
        ))}
      </Tabs>
      {body[current]}
    </Box>
  );
}
