import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { EmptyState } from '../components/EmptyState.tsx';

export const TREE_WIDTH = 280;

/** Lens-scoped item tree (CONCEPT.md §2). The real tree lands in M3. */
export function TreePane({ lens }: { lens: string }) {
  return (
    <Box
      component="aside"
      aria-label={`${lens} tree`}
      sx={{
        width: TREE_WIDTH,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 1.5, fontWeight: 700, letterSpacing: '0.08em' }}
      >
        {lens}
      </Typography>
      <EmptyState
        icon={<AccountTreeOutlined />}
        title="Your tree grows here"
        description="Knowledge, Projects, College and Personal are already planted. Browsing and editing the tree arrives in the next milestone."
      />
    </Box>
  );
}
