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
      <Typography variant="h1" component="h1">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Last updated {updated}
      </Typography>
      <Typography
        component="div"
        sx={{
          maxWidth: (t) => t.niwa.width.reading,
          '& h2': { typography: 'h6', mt: 4, mb: 1 },
          '& p, & li': { color: 'text.secondary', lineHeight: 1.7 },
          '& ul': { pl: 3 },
          '& code': { fontFamily: (t) => t.niwa.monoFamily, fontSize: '0.9em' },
        }}
      >
        {children}
      </Typography>
    </Container>
  );
}
