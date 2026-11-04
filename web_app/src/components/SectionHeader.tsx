import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

/** Header for a section inside a screen: title, a quiet count and an optional action (B-02 V4). */
export function SectionHeader({
  title,
  count,
  action,
  id,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 36, mb: 1 }}>
      <Typography id={id} variant="subtitle2" component="h2" sx={{ flex: 1 }}>
        {title}
        {count !== undefined && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
            {count}
          </Typography>
        )}
      </Typography>
      {action}
    </Box>
  );
}
