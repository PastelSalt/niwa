import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { site, useDocumentTitle } from './site.ts';

/** Shared frame for policy pages: title, "last updated" and readable line length (B3). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  useDocumentTitle(`${title} — ${site.name}`);
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Last updated {updated}
      </Typography>
      <Typography
        component="div"
        sx={{
          maxWidth: 720,
          '& h2': { typography: 'h6', mt: 4, mb: 1 },
          '& p, & li': { color: 'text.secondary', lineHeight: 1.7 },
          '& ul': { pl: 3 },
          '& code': { fontFamily: 'monospace', fontSize: '0.9em' },
        }}
      >
        {children}
      </Typography>
    </Container>
  );
}
