import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { Wordmark } from '../components/Wordmark.tsx';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: (t) => t.niwa.width.narrow }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            aria-label="NIWA home"
            sx={{ display: 'inline-block' }}
          >
            <Wordmark size="large" />
          </Link>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            A garden for your ideas.
          </Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
