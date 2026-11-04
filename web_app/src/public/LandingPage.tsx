import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
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
        <Typography id={id} variant="h4" component="h2" sx={{ maxWidth: 640 }}>
          {title}
        </Typography>
        {intro && (
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 640, fontSize: '1.05rem' }}>
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
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 5, md: 8 },
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              id="hero-title"
              variant="h2"
              component="h1"
              sx={{ fontSize: { xs: '2.25rem', md: '3.25rem' }, letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              {site.tagline}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2.5, fontSize: '1.15rem', maxWidth: 520 }}>
              NIWA keeps your notes, ideas, tasks and schedule in one tree. Plant an idea, grow it into a
              project, and look at it through three lenses — without copying anything between apps.
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
          <ExampleTree />
        </Box>
      </Container>
    </Box>
  );
}

type ExampleRow = { depth: number; title: string; icon: ReactNode; color: string; note?: string };

/** An illustration of the item tree using the specs' own example (§3.1) — not real user data. */
function ExampleTree() {
  const rows: ExampleRow[] = [
    { depth: 0, title: 'College', icon: <FolderOutlined />, color: 'text.secondary' },
    { depth: 1, title: 'CS 301', icon: <AccountTreeOutlined />, color: 'itemType.project' },
    {
      depth: 2,
      title: 'Week 1 lecture notes',
      icon: <DescriptionOutlined />,
      color: 'itemType.note',
      note: 'Knowledge',
    },
    {
      depth: 2,
      title: 'Problem set 1',
      icon: <TaskAltOutlined />,
      color: 'itemType.task',
      note: 'Actionable · Scheduler',
    },
    {
      depth: 2,
      title: 'Idea: study group',
      icon: <LightbulbOutlined />,
      color: 'itemType.idea',
      note: 'Knowledge',
    },
  ];
  return (
    <Paper
      variant="outlined"
      role="img"
      aria-label="Example item tree: a College folder holding the CS 301 project, with lecture notes, a problem set task and an idea inside it."
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Typography variant="overline" color="text.secondary" aria-hidden>
        Example
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 1 }} aria-hidden>
        {rows.map((r) => (
          <Stack
            key={r.title}
            direction="row"
            spacing={1.25}
            sx={{
              alignItems: 'center',
              pl: r.depth * 3,
              py: 0.75,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box sx={{ color: r.color, display: 'flex', '& svg': { fontSize: 20 } }}>{r.icon}</Box>
            <Typography sx={{ flex: 1, minWidth: 0 }} noWrap>
              {r.title}
            </Typography>
            {r.note && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {r.note}
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function FeatureCard({ icon, title, points }: { icon: ReactNode; title: string; points: string[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Box sx={{ color: 'primary.main', display: 'flex', '& svg': { fontSize: 32 } }}>{icon}</Box>
      <Typography variant="h6" component="h3" sx={{ mt: 1.5 }}>
        {title}
      </Typography>
      <Stack component="ul" spacing={1} sx={{ mt: 1.5, mb: 0, pl: 0, listStyle: 'none' }}>
        {points.map((p) => (
          <Stack component="li" key={p} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <CheckCircleOutlined sx={{ fontSize: 18, mt: '2px', color: 'primary.main' }} aria-hidden />
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
      title="One tree, three lenses"
      intro="Every note, idea, project and task lives in a single tree, nested as deep as you like. Each lens shows the same tree from a different angle."
    >
      <Box sx={grid}>
        <FeatureCard
          icon={<MenuBookOutlined />}
          title="Knowledge"
          points={[
            'Rich notes with headings, lists and images',
            'Link related notes and see backlinks',
            'A review queue for notes you want to revisit',
          ]}
        />
        <FeatureCard
          icon={<TaskAltOutlined />}
          title="Actionable"
          points={[
            'Projects and tasks with status, priority and due dates',
            'Focus: in progress, high priority, overdue and upcoming work across every project',
            'Move and reorder anything, at any depth',
          ]}
        />
        <FeatureCard
          icon={<CalendarMonthOutlined />}
          title="Scheduler"
          points={[
            'Month, week and day views',
            'Drag to plan time blocks for your tasks, or add standalone events',
            'Repeating entries',
          ]}
        />
      </Box>
    </Section>
  );
}

/** Real screenshots of the app (B2.P2), with example content made for them. */
function Screens() {
  const shots = [
    {
      src: '/screens/knowledge-light.webp',
      alt: 'A course project open in the Knowledge lens, light theme: the tree on the left, the note editor in the middle and item details on the right.',
      caption: 'Knowledge, light theme',
    },
    {
      src: '/screens/focus-dark.webp',
      alt: 'The Focus view in dark theme, listing high-priority, upcoming and recently updated tasks from different projects.',
      caption: 'Focus, dark theme',
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
              'File captures into the tree one by one or in bulk',
            ]}
          />
          <FeatureCard
            icon={<SearchOutlined />}
            title="Search"
            points={['One search across titles, tags and note text', 'Narrow the results to one lens']}
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
        <Box sx={{ color: 'primary.main', display: 'flex', '& svg': { fontSize: 40 } }}>
          <LockOutlined aria-hidden />
        </Box>
        <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 2.5, maxWidth: 720 }}>
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
        <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
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
