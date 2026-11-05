import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import { EmptyState } from '../../components/EmptyState.tsx';
import { Page } from '../../components/Page.tsx';
import { SectionHeader } from '../../components/SectionHeader.tsx';
import { exactTime, timeAgo } from '../../lib/friendlyTime.ts';
import { todayLocal } from '../items/itemMeta.tsx';
import { ItemRow, ItemRowList } from '../items/ItemRow.tsx';
import { RowSkeletons } from '../items/RowSkeletons.tsx';
import { useTree } from '../items/queries.ts';
import { ancestorsOf, buildTree } from '../items/treeModel.ts';
import { useReview } from './queries.ts';

const RECENT = 8;

/**
 * Garden home (B-02 V6, B-01 B9): what's due for review and what you were last working on — notes only
 * under the Notes filter, everything under All.
 */
export function KnowledgeHome({ filter = 'knowledge' }: { filter?: 'all' | 'knowledge' }) {
  const { data: due = [] } = useReview(todayLocal());
  const { data: items, isLoading } = useTree();
  const model = useMemo(() => buildTree(items ?? []), [items]);
  const recent = useMemo(
    () =>
      (items ?? [])
        .filter(
          (i) =>
            (filter === 'all' || i.nature === 'knowledge') &&
            // Top-level items are folders, not things you were editing.
            i.parentId !== null,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, RECENT),
    [items, filter],
  );

  return (
    <Page width="list">
      {due.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <EventRepeatOutlined color="secondary" />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {due.length === 1 ? '1 note is' : `${due.length} notes are`} due for review.
          </Typography>
          <Button component={RouterLink} to="/knowledge/review" variant="outlined" size="small">
            Review
          </Button>
        </Paper>
      )}

      {isLoading && <RowSkeletons rows={4} />}

      {!isLoading && recent.length > 0 && (
        <section aria-labelledby="recent-notes">
          <SectionHeader id="recent-notes" title="Recently edited" />
          <ItemRowList label="Recently edited">
            {recent.map((i) => (
              <ItemRow
                key={i.id}
                item={i}
                meta={
                  <>
                    {ancestorsOf(model, i.id)
                      .map((a) => a.title)
                      .join(' › ') || 'Top level'}
                    {' · '}
                    <time dateTime={i.updatedAt} title={exactTime(i.updatedAt)}>
                      {timeAgo(i.updatedAt)}
                    </time>
                  </>
                }
              />
            ))}
          </ItemRowList>
        </section>
      )}

      {!isLoading && recent.length === 0 && (
        <EmptyState
          icon={<AutoStoriesOutlined />}
          title="Your garden"
          description="Pick a folder in the tree or make a page with +. Write with headings for an outline, and type [[ to link other pages."
          action={
            <Button component={RouterLink} to="/knowledge/review" size="small">
              Open review queue
            </Button>
          }
        />
      )}
    </Page>
  );
}
