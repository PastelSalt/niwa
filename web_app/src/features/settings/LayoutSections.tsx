import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useColorScheme, useTheme } from '@mui/material/styles';
import type { PreferencesInput } from '@niwa/contracts';
import {
  densities,
  layouts,
  patterns,
  themes,
  type DensityId,
  type LayoutId,
  type PatternId,
} from '@niwa/tokens';
import type { ReactNode } from 'react';
import { useAppearance } from '../../app/appearance.tsx';
import { resolveLayout } from '../../app/theme.ts';
import { pageStyle } from '../../components/PageBackground.tsx';
import { Section } from './Section.tsx';

type Save = (input: PreferencesInput) => void;

/**
 * Settings › Appearance › Layout (NIWA-PLAN-B-03 C5): the shape of the app — Scrapbook (the default), Classic or
 * Compact — plus a few options that override the preset. Layout is shape; the colour theme is colour.
 */
export function LayoutSection({ save }: { save: Save }) {
  const { active } = useAppearance();
  const resolved = resolveLayout(active.layout.preset, active.layout);
  // Every layout change counts as a choice, so the "new look" card on Today goes away.
  const set = (layout: NonNullable<PreferencesInput['layout']>) =>
    save({ layout: { ...layout, chosen: true } });

  return (
    <Section title="Layout" description="The shape of the app. Your colour theme works with every layout.">
      <Box
        role="radiogroup"
        aria-label="Layout"
        sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))' }}
      >
        {(Object.keys(layouts) as LayoutId[]).map((id) => (
          <LayoutCard
            key={id}
            id={id}
            selected={active.layout.preset === id}
            // A new preset starts from its own options.
            onSelect={() => set({ preset: id, density: null, sidebar: null, stickers: null })}
          />
        ))}
      </Box>

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Option label="Spacing">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={resolved.density}
            onChange={(_, next: DensityId | null) => next && set({ density: next })}
            aria-label="Spacing"
          >
            {(Object.keys(densities) as DensityId[]).map((d) => (
              <ToggleButton key={d} value={d}>
                {densities[d].label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Option>
        <Option label="Sidebar">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={resolved.sidebar}
            onChange={(_, next: 'labels' | 'icons' | null) => next && set({ sidebar: next })}
            aria-label="Sidebar"
          >
            <ToggleButton value="labels">Names and spaces</ToggleButton>
            <ToggleButton value="icons">Icons only</ToggleButton>
          </ToggleButtonGroup>
        </Option>
        <FormControlLabel
          control={
            <Switch checked={resolved.stickers} onChange={(e) => set({ stickers: e.target.checked })} />
          }
          label="Sticker titles and buttons"
        />
      </Stack>
    </Section>
  );
}

function Option({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '5.5rem' }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

/** A small picture of a layout drawn in the active theme. */
function LayoutCard({ id, selected, onSelect }: { id: LayoutId; selected: boolean; onSelect: () => void }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const t = layouts[id];
  const p = themes[theme.niwa.themeId].palettes[mode];
  const page = t.floating
    ? pageStyle(theme.niwa.themeId, mode, theme.niwa.background)
    : { backgroundColor: p.background };
  const card = (extra: object) => ({
    bgcolor: p.surface,
    borderRadius: t.floating ? '7px' : 0,
    boxShadow: t.floating ? `0 2px 6px ${p.primary}33` : 'none',
    border: t.floating ? 'none' : `1px solid ${p.divider}`,
    ...extra,
  });
  const line = (w: string, h = 4) => (
    <Box sx={{ height: h, width: w, borderRadius: 2, bgcolor: p.textSecondary, opacity: 0.6 }} />
  );
  const rows = id === 'compact' ? 5 : 3;
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      aria-label={t.label}
      onClick={onSelect}
      sx={{
        display: 'block',
        textAlign: 'left',
        borderRadius: 1.5,
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        m: selected ? 0 : '1px',
        overflow: 'hidden',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box
        aria-hidden
        style={page}
        sx={{ height: 96, display: 'flex', gap: t.floating ? 0.75 : 0, p: t.floating ? 0.75 : 0 }}
      >
        <Box
          sx={card({
            width: t.sidebar === 'labels' ? 38 : 18,
            p: 0.75,
            display: 'grid',
            gap: 0.5,
            alignContent: 'start',
          })}
        >
          <Box
            sx={{
              height: 6,
              borderRadius: 2,
              bgcolor: t.stickers ? p.primaryContainer : p.primary,
              opacity: t.stickers ? 1 : 0.5,
            }}
          />
          {line('80%')}
          {line('70%')}
        </Box>
        <Box
          sx={card({
            flex: 1,
            p: 1,
            display: 'grid',
            gap: id === 'compact' ? 0.5 : 0.85,
            alignContent: 'start',
          })}
        >
          <Box
            sx={{
              height: 8,
              width: '45%',
              borderRadius: t.stickers ? 4 : 1,
              bgcolor: t.stickers ? p.primaryContainer : p.textPrimary,
              opacity: t.stickers ? 1 : 0.8,
            }}
          />
          {Array.from({ length: rows }, (_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', border: `1px solid ${p.primary}` }} />
              {line(`${70 - i * 9}%`)}
            </Box>
          ))}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          px: 1.25,
          py: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
            {t.description}
          </Typography>
        </Box>
        {selected && <CheckCircleRounded fontSize="small" sx={{ color: 'primary.main' }} />}
      </Box>
    </ButtonBase>
  );
}

/**
 * Settings › Appearance › Background (NIWA-PLAN-B-03 C2): the patterned page behind the cards, drawn in the
 * theme's own colours. Shown with the Scrapbook layout (Classic and Compact use a plain page).
 */
export function BackgroundSection({ save }: { save: Save }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const { active } = useAppearance();
  const bg = active.background;
  const floating = theme.niwa.layout.floating;
  return (
    <Section
      title="Background"
      description={
        floating
          ? 'A soft pattern behind your cards, in your theme’s colours.'
          : 'Patterns show with the Scrapbook layout. Pick one now and it will be there when you switch.'
      }
    >
      <Box
        role="radiogroup"
        aria-label="Background pattern"
        sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: 'repeat(auto-fill, minmax(6.5rem, 1fr))' }}
      >
        {(Object.keys(patterns) as PatternId[]).map((id) => {
          const selected = bg.pattern === id;
          return (
            <ButtonBase
              key={id}
              role="radio"
              aria-checked={selected}
              aria-label={patterns[id].label}
              onClick={() => save({ background: { pattern: id } })}
              sx={{
                display: 'block',
                textAlign: 'left',
                borderRadius: 1.5,
                border: selected ? 2 : 1,
                borderColor: selected ? 'primary.main' : 'divider',
                m: selected ? 0 : '1px',
                overflow: 'hidden',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Box
                aria-hidden
                style={pageStyle(theme.niwa.themeId, mode, { ...bg, pattern: id, washes: false })}
                sx={{ height: 56 }}
              />
              <Box
                sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.75, bgcolor: 'background.paper' }}
              >
                <Typography variant="caption" sx={{ flex: 1, fontWeight: selected ? 700 : 500 }}>
                  {patterns[id].label}
                </Typography>
                {selected && <CheckCircleRounded sx={{ fontSize: 16, color: 'primary.main' }} />}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>

      <Stack spacing={1.5} sx={{ mt: 2.5 }}>
        <Option label="Strength">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={bg.strength}
            onChange={(_, next: 'soft' | 'normal' | null) => next && save({ background: { strength: next } })}
            aria-label="Pattern strength"
          >
            <ToggleButton value="soft">Soft</ToggleButton>
            <ToggleButton value="normal">Normal</ToggleButton>
          </ToggleButtonGroup>
        </Option>
        <FormControlLabel
          control={
            <Switch
              checked={bg.washes}
              onChange={(e) => save({ background: { washes: e.target.checked } })}
            />
          }
          label="Colour washes in the corners"
        />
      </Stack>
    </Section>
  );
}
