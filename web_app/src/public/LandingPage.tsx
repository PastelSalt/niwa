import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { Playground } from './Playground.tsx';
import { site, useDocumentTitle } from './site.ts';
import { useRegistrationOpen } from './useRegistrationOpen.ts';

/**
 * Landing page at `/` for signed-out visitors (NIWA-PLAN-B-01 B2). Every claim here is about a shipped
 * feature (PROJECT-SPECS §3–§4) — no numbers, testimonials or prices.
 */
export function LandingPage() {
  useDocumentTitle(`${site.name} — ${site.tagline}`);
  return (
    <>
      <Hero />
      <Lenses />
      <Screens />
      <Capture />
      <Privacy />
      <Maker />
    </>
  );
}

function Section({
  title,
  intro,
  children,
  id,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <Typography id={id} variant="h2" component="h2" sx={{ maxWidth: (t) => t.niwa.width.reading }}>
          {title}
        </Typography>
        {intro && (
          <Typography
            variant="lead"
            color="text.secondary"
            sx={{ mt: 1.5, maxWidth: (t) => t.niwa.width.reading }}
          >
            {intro}
          </Typography>
        )}
        <Box sx={{ mt: 4 }}>{children}</Box>
      </Container>
    </Box>
  );
}

function Hero() {
  const registrationOpen = useRegistrationOpen();
  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ py: { xs: 7, md: 11 } }}>
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: (t) => t.niwa.width.reading }}>
          <Typography id="hero-title" variant="h1" component="h1">
            {site.tagline}
          </Typography>
          <Typography variant="lead" color="text.secondary" sx={{ mt: 2.5 }}>
            NIWA keeps your notes, ideas, tasks and schedule in one tree. Plant an idea, grow it into a
            project, and see it as notes, tasks or a calendar — without copying anything between apps.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
            {registrationOpen && (
              <Button component={RouterLink} to="/register" variant="contained" size="large">
                Create account
              </Button>
            )}
            <Button
              component={RouterLink}
              to="/login"
              variant={registrationOpen ? 'outlined' : 'contained'}
              size="large"
            >
              Log in
            </Button>
          </Stack>
        </Box>
        <Box sx={{ mt: { xs: 5, md: 7 } }}>
          <Playground />
        </Box>
      </Container>
    </Box>
  );
}

function FeatureCard({ icon, title, points }: { icon: ReactNode; title: string; points: string[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Box
        sx={(t) => ({
          color: 'primary.main',
          display: 'flex',
          '& svg': { fontSize: t.niwa.iconSize.feature },
        })}
      >
        {icon}
      </Box>
      <Typography variant="h6" component="h3" sx={{ mt: 1.5 }}>
        {title}
      </Typography>
      <Stack component="ul" spacing={1} sx={{ mt: 1.5, mb: 0, pl: 0, listStyle: 'none' }}>
        {points.map((p) => (
          <Stack component="li" key={p} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <CheckCircleOutlined fontSize="small" sx={{ mt: '1px', color: 'primary.main' }} aria-hidden />
            <Typography variant="body2" color="text.secondary">
              {p}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

const grid = {
  display: 'grid',
  gap: 2.5,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
} as const;

function Lenses() {
  return (
    <Section
      id="lenses-title"
      title="One garden, three ways to look at it"
      intro="Every page, idea, project and task lives in one tree, nested as deep as you like. Today brings together what's on and what's next."
    >
      <Box sx={grid}>
        <FeatureCard
          icon={<MenuBookOutlined />}
          title="Notes"
          points={[
            'Rich pages with headings, lists and images',
            'Link pages together and see what links back',
            'A review queue for notes you want to revisit',
          ]}
        />
        <FeatureCard
          icon={<TaskAltOutlined />}
          title="Tasks"
          points={[
            'Projects and tasks with status, priority and due dates',
            'Next up: what is overdue, in progress, urgent or due soon, across every project',
            'Move and reorder anything, at any depth',
          ]}
        />
        <FeatureCard
          icon={<CalendarMonthOutlined />}
          title="Calendar"
          points={[
            'Month, week and day views',
            'Give your tasks time, or add events that repeat',
            "Your country's public holidays",
          ]}
        />
      </Box>
    </Section>
  );
}

/**
 * Real screenshots of the app (B2.P2), with example content made for them; retaken after the B-02 refresh
 * with `pnpm --filter @niwa/web visual-audit -- --mock --landing-shots`.
 */
function Screens() {
  const shots = [
    {
      src: '/screens/knowledge-light.webp',
      alt: 'A course note open in the garden, light theme: the tree with its All, Notes and Tasks filter on the left, and the page with its review date, tags, headings and a list.',
      caption: 'A page in the garden, light theme',
    },
    {
      src: '/screens/today-dark.webp',
      alt: 'The Today screen in dark theme: a short getting-started list, today’s calendar and the next few tasks with their priority and due date.',
      caption: 'Today, dark theme',
    },
  ];
  return (
    <Section id="screens-title" title="See it">
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        {shots.map((s) => (
          <Box component="figure" key={s.src} sx={{ m: 0 }}>
            <Box
              component="img"
              src={s.src}
              alt={s.alt}
              width={1280}
              height={800}
              loading="lazy"
              decoding="async"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
              }}
            />
            <Typography component="figcaption" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {s.caption}
            </Typography>
          </Box>
        ))}
      </Box>
    </Section>
  );
}

function Capture() {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderBlock: 1, borderColor: 'divider' }}>
      <Section
        id="capture-title"
        title="Capture first, organise later"
        intro="Write a thought down the moment you have it, and decide where it belongs when you have time."
      >
        <Box sx={{ ...grid, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
          <FeatureCard
            icon={<InboxOutlined />}
            title="Inbox"
            points={[
              'Quick capture from anywhere in the app',
              'Sort captures into your garden one at a time, or in bulk',
            ]}
          />
          <FeatureCard
            icon={<SearchOutlined />}
            title="Search"
            points={[
              'Press Ctrl K to find, open or create anything',
              'One search across titles, tags and page text',
            ]}
          />
        </Box>
      </Section>
    </Box>
  );
}

function Privacy() {
  return (
    <Section id="privacy-title" title="Your garden stays yours">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={(t) => ({
            color: 'primary.main',
            display: 'flex',
            '& svg': { fontSize: t.niwa.iconSize.emptyState },
          })}
        >
          <LockOutlined aria-hidden />
        </Box>
        <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 2.5, maxWidth: (t) => t.niwa.width.reading }}>
          <Typography component="li">
            Every account has its own private workspace. Nothing is shared between accounts.
          </Typography>
          <Typography component="li">
            No analytics, no advertising and no tracking cookies — the only cookie keeps you signed in.
          </Typography>
          <Typography component="li">Passwords are stored only as a secure hash.</Typography>
          <Typography component="li">
            The full details are in the{' '}
            <Link component={RouterLink} to="/privacy">
              Privacy Policy
            </Link>
            .
          </Typography>
        </Stack>
      </Stack>
    </Section>
  );
}

function Maker() {
  const registrationOpen = useRegistrationOpen();
  return (
    <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
      <Section id="maker-title" title="Made by one person">
        <Typography color="text.secondary" sx={{ maxWidth: (t) => t.niwa.width.reading }}>
          NIWA is designed and developed solo by{' '}
          <Link href={site.makerUrl} target="_blank" rel="noopener">
            {site.maker}
          </Link>
          . It started as a personal tool and is now open to anyone who wants a calm place for their ideas.
        </Typography>
        {registrationOpen && (
          <Button component={RouterLink} to="/register" variant="contained" size="large" sx={{ mt: 3 }}>
            Plant your garden
          </Button>
        )}
      </Section>
    </Box>
  );
}
