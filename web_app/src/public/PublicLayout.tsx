import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Suspense, type ReactNode } from 'react';
import { Outlet, Link as RouterLink } from 'react-router';
import { useAuth } from '../auth/AuthProvider.tsx';
import { PageBackground } from '../components/PageBackground.tsx';
import { Wordmark } from '../components/Wordmark.tsx';
import { site } from './site.ts';
import { useRegistrationOpen } from './useRegistrationOpen.ts';

/** Header + content + footer for pages a signed-out visitor can open (NIWA-PLAN-B-01 B1.P2). */
export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <Box
      // The default Scrapbook page behind public pages (B-03 C1); sections sit on their own paper.
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <PageBackground />
      <PublicHeader />
      <Box component="main" id="main" sx={{ flex: 1 }}>
        {children ?? (
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        )}
      </Box>
      <SiteFooter />
    </Box>
  );
}

function PublicHeader() {
  const { status } = useAuth();
  const registrationOpen = useRegistrationOpen();
  return (
    <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Stack direction="row" sx={{ minHeight: 64, gap: 1, alignItems: 'center' }}>
          <Link component={RouterLink} to="/" underline="none" sx={{ mr: 'auto' }}>
            <Wordmark />
          </Link>
          {status === 'authenticated' ? (
            <Button component={RouterLink} to="/knowledge" variant="contained">
              Open NIWA
            </Button>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit">
                Log in
              </Button>
              {registrationOpen && (
                <Button component={RouterLink} to="/register" variant="contained">
                  Create account
                </Button>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 4 }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <Typography variant="body2" color="text.secondary">
            Designed and built solo by{' '}
            <Link href={site.makerUrl} target="_blank" rel="noopener">
              {site.maker}
            </Link>
          </Typography>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {LEGAL_LINKS.map(([to, label]) => (
              <Link key={to} component={RouterLink} to={to} variant="body2" color="text.secondary">
                {label}
              </Link>
            ))}
            <Link href={site.sourceUrl} target="_blank" rel="noopener" variant="body2" color="text.secondary">
              Source code
            </Link>
            <Typography variant="body2" color="text.secondary">
              © {year} {site.maker}
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

/** Footer links to the policy pages (B-01 B3); also used by Settings › Help. */
export const LEGAL_LINKS: [to: string, label: string][] = [
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/eula', 'App licence'],
  ['/cookies', 'Cookies'],
  ['/licenses', 'Licences'],
];
