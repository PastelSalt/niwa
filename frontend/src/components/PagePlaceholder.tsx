import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState.tsx';

/** Destination landing used until its milestone lands. */
export function PagePlaceholder({
  icon,
  title,
  description,
  milestone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  milestone: string;
}) {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={<Chip size="small" variant="outlined" color="primary" label={`Coming in ${milestone}`} />}
      />
    </Box>
  );
}
