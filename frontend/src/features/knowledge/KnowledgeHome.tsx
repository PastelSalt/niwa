import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import { EmptyState } from '../../components/EmptyState.tsx';
import { todayLocal } from '../items/itemMeta.tsx';
import { useReview } from './queries.ts';

/** Knowledge landing: what's due for review, and how to start. */
export function KnowledgeHome() {
  const { data: due = [] } = useReview(todayLocal());
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860 }}>
      {due.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <EventRepeatOutlined color="secondary" />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {due.length === 1 ? '1 note is' : `${due.length} notes are`} due for review.
          </Typography>
          <Button component={RouterLink} to="/knowledge/review" variant="outlined" size="small">
            Review
          </Button>
        </Paper>
      )}
      <EmptyState
        icon={<AutoStoriesOutlined />}
        title="Your notebook garden"
        description="Pick a topic in the tree or create one with +. Write with headings for an outline, and type [[ to link other notes."
        action={
          <Button component={RouterLink} to="/knowledge/review" size="small">
            Open review queue
          </Button>
        }
      />
    </Box>
  );
}
