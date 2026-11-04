import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { Navigate, Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { LEGAL_LINKS } from '../../public/PublicLayout.tsx';
import { site } from '../../public/site.ts';
import { TrashSection } from '../items/TrashSection.tsx';
import { useOnboarding } from '../onboarding/OnboardingProvider.tsx';
import { ChangePassword, DeleteAccount, ExportData } from './AccountActions.tsx';

const SECTIONS = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'account', label: 'Account' },
  { key: 'ai', label: 'AI' },
  { key: 'trash', label: 'Trash' },
  { key: 'help', label: 'Help' },
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
    <Section title="Theme" description="Choose light or dark, or let NIWA follow your device.">
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
      <Button variant="outlined" onClick={() => void logout()}>
        Log out
      </Button>
    </Section>
  );
}

function HelpSection() {
  const { startTour } = useOnboarding();
  return (
    <Stack spacing={3}>
      <Section
        title="Tour"
        description="A one-minute walk through capture, the tree, the three lenses and search."
      >
        <Button variant="outlined" onClick={startTour}>
          Replay the tour
        </Button>
      </Section>
      <Section title="Contact and policies">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Questions or privacy requests: <Link href={`mailto:${site.contactEmail}`}>{site.contactEmail}</Link>
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {LEGAL_LINKS.map(([to, label]) => (
            <Link key={to} component={RouterLink} to={to} variant="body2">
              {label}
            </Link>
          ))}
          <Link href={site.sourceUrl} target="_blank" rel="noopener" variant="body2">
            Source code
          </Link>
        </Stack>
      </Section>
    </Stack>
  );
}

function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <Section title={title} description={text}>
      <Typography variant="body2" color="text.secondary">
        Not available yet.
      </Typography>
    </Section>
  );
}

/** Credit under every section (NIWA-PLAN-B-01 B1.P2); legal links join it with B3. */
function About() {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
      {site.name} — designed and built solo by{' '}
      <Link href={site.makerUrl} target="_blank" rel="noopener">
        {site.maker}
      </Link>
      .
    </Typography>
  );
}

export function SettingsPage() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const current = SECTIONS.find((s) => s.key === section)?.key;
  if (!current) return <Navigate to="/settings/appearance" replace />;

  const body: Record<SectionKey, ReactNode> = {
    appearance: <AppearanceSection />,
    account: (
      <Stack spacing={3}>
        <AccountSection />
        <Section title="Password">
          <ChangePassword />
        </Section>
        <Section title="Your data">
          <ExportData />
        </Section>
        <Section title="Delete account">
          <DeleteAccount />
        </Section>
      </Stack>
    ),
    ai: (
      <ComingSoon
        title="DeepSeek AI"
        text="Summaries, child breakdowns and tag suggestions — only when you ask, only for the item you choose."
      />
    ),
    trash: (
      <Section title="Trash">
        <TrashSection />
      </Section>
    ),
    help: <HelpSection />,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 760 }}>
      <Tabs
        value={current}
        onChange={(_, key: SectionKey) => navigate(`/settings/${key}`)}
        variant="scrollable"
        // Four tabs fit a 360 px phone once MUI's 90 px minimum width is lifted.
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { minWidth: { xs: 0, sm: 90 }, px: { xs: 1.5, sm: 2 } },
        }}
      >
        {SECTIONS.map((s) => (
          <Tab key={s.key} value={s.key} label={s.label} />
        ))}
      </Tabs>
      {body[current]}
      <About />
    </Box>
  );
}
