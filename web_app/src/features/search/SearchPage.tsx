import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ItemNature } from '@niwa/contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Page } from '../../components/Page.tsx';
import { TagChip } from '../items/chips.tsx';
import { ItemRow, ItemRowList } from '../items/ItemRow.tsx';
import { messageOf } from '../../api/client.ts';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { EmptyState } from '../../components/EmptyState.tsx';
import { TYPE_LABEL } from '../items/itemMeta.tsx';
import { useTree } from '../items/queries.ts';
import { ancestorsOf, buildTree } from '../items/treeModel.ts';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wrap matches of any term in <mark>. */
export function Highlight({ text, terms }: { text: string; terms: string[] }): ReactNode {
  const clean = terms.filter(Boolean);
  if (!clean.length) return text;
  const re = new RegExp(`(${clean.map(escapeRegex).join('|')})`, 'gi');
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <Box
        key={i}
        component="mark"
        sx={(t) => ({
          bgcolor: t.alpha((t.vars ?? t).palette.secondary.main, 0.35),
          color: 'inherit',
          borderRadius: 0.5,
          px: 0.25,
        })}
      >
        {part}
      </Box>
    ) : (
      part
    ),
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** One search across titles, tags and note bodies (specs §3). */
export function SearchPage() {
  const { api } = useAuth();
  const [params, setParams] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const nature = (params.get('nature') as ItemNature | null) ?? null;
  const includeArchived = params.get('archived') === '1';
  const [draft, setDraft] = useState(urlQ);
  const q = useDebounced(draft.trim(), 250);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    // Only adopt URL changes we didn't make ourselves (e.g. the top-bar search), so typing isn't clobbered.
    if (urlQ !== q) setDraft(urlQ);
  }

  useEffect(() => {
    if (q === urlQ) return;
    const next = new URLSearchParams(params);
    if (q) next.set('q', q);
    else next.delete('q');
    setParams(next, { replace: true });
  }, [q, urlQ, params, setParams]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const {
    data: hits,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['search', q, nature, includeArchived],
    queryFn: async () =>
      (
        await api.search({
          q,
          nature: nature ?? undefined,
          includeArchived: includeArchived || undefined,
          limit: 40,
        })
      ).hits,
    enabled: q.length > 0,
    placeholderData: (prev) => prev,
  });

  const { data: tree = [] } = useTree();
  const model = useMemo(() => buildTree(tree), [tree]);
  const terms = q.split(/\s+/);

  return (
    <Page width="list">
      <TextField
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search titles, tags and notes"
        slotProps={{
          htmlInput: { 'aria-label': 'Search query' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ mt: 1.5, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={nature ?? 'all'}
          onChange={(_, v: string | null) => v && setParam('nature', v === 'all' ? null : v)}
          aria-label="Base"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="knowledge">Notes</ToggleButton>
          <ToggleButton value="actionable">Tasks</ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={includeArchived}
              onChange={(e) => setParam('archived', e.target.checked ? '1' : null)}
            />
          }
          label={<Typography variant="body2">Include archived</Typography>}
        />
      </Stack>
      <Box sx={{ height: 2, mb: 1 }}>{isFetching && <LinearProgress sx={{ height: 2 }} />}</Box>

      {error && <Alert severity="error">{messageOf(error)}</Alert>}
      {!q && (
        <EmptyState
          icon={<SearchOutlined />}
          title="One search for everything"
          description="Titles, tags and note bodies across all bases — partial words work too."
        />
      )}
      {q && hits && hits.length === 0 && !isFetching && (
        <EmptyState
          icon={<SearchOutlined />}
          title={`Nothing matches “${q}”`}
          description="Try fewer or shorter words, or include archived items."
        />
      )}
      {q && !!hits?.length && (
        <>
          <Typography variant="caption" color="text.secondary" role="status">
            {hits.length} result{hits.length === 1 ? '' : 's'}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <ItemRowList label="Search results">
              {hits.map((h) => {
                const path = ancestorsOf(model, h.item.id)
                  .map((a) => a.title)
                  .join(' › ');
                return (
                  <ItemRow
                    key={h.item.id}
                    item={h.item}
                    title={<Highlight text={h.item.title} terms={terms} />}
                    meta={
                      <>
                        {h.item.inboxedAt ? 'Inbox' : path || 'Top level'} · {TYPE_LABEL[h.item.type]}
                        {h.item.archivedAt ? ' · Archived' : ''}
                      </>
                    }
                    extra={
                      h.snippet && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          <Highlight text={h.snippet} terms={terms} />
                        </Typography>
                      )
                    }
                    chips={h.item.tags.length > 0 && h.item.tags.map((t) => <TagChip key={t} tag={t} />)}
                  />
                );
              })}
            </ItemRowList>
          </Box>
        </>
      )}
    </Page>
  );
}
