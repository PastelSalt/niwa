import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { fonts, themes, type FontId, type ThemeId } from '@niwa/tokens';
import { useEffect, type ReactNode } from 'react';
import { messageOf } from '../../api/client.ts';
import { DEFAULT_APPEARANCE, useAppearance, useSavePreferences } from '../../app/appearance.tsx';
import { ensureFontLoaded } from '../../app/fonts.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { Section } from './Section.tsx';

/**
 * Settings › Appearance (NIWA-PLAN-B-02 V10.P3): colour theme, font and light/dark. Every change applies at
 * once and is saved on the account, so it follows you to other browsers.
 */
export function AppearanceSection() {
  const { active } = useAppearance();
  const { mode, colorScheme } = useColorScheme();
  const save = useSavePreferences();
  const notify = useNotify();
  const run = (p: Promise<unknown>) => p.catch((err) => notify(messageOf(err), { severity: 'error' }));
  const shownMode = colorScheme === 'dark' ? 'dark' : 'light';

  // Each font option is shown in its own face: fetch them while this section is open.
  useEffect(() => {
    for (const f of Object.keys(fonts) as FontId[]) void ensureFontLoaded(f);
  }, []);

  const isDefault =
    active.theme === DEFAULT_APPEARANCE.theme &&
    active.font === DEFAULT_APPEARANCE.font &&
    (mode ?? 'system') === 'system';

  return (
    <Stack spacing={3}>
      <Section title="Colour theme" description="All themes are soft pastels, in light and dark.">
        <Box
          role="radiogroup"
          aria-label="Colour theme"
          sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(9.5rem, 1fr))' }}
        >
          {(Object.keys(themes) as ThemeId[]).map((id) => (
            <ThemeSwatch
              key={id}
              id={id}
              mode={shownMode}
              selected={active.theme === id}
              onSelect={() => void run(save({ theme: id }))}
            />
          ))}
        </Box>
      </Section>

      <Section title="Font" description="Used for all text in the app. Code in notes stays monospaced.">
        <Box role="radiogroup" aria-label="Font" sx={{ display: 'grid', gap: 1 }}>
          {(Object.keys(fonts) as FontId[]).map((id) => (
            <ChoiceCard
              key={id}
              selected={active.font === id}
              onSelect={() => void run(save({ font: id }))}
              label={fonts[id].label}
            >
              <Typography sx={{ fontFamily: fonts[id].stack, fontWeight: 600 }}>{fonts[id].label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: fonts[id].stack }}>
                {id === 'system'
                  ? 'Your device’s own font — nothing to download.'
                  : 'Plant an idea, grow it into a project.'}
              </Typography>
            </ChoiceCard>
          ))}
        </Box>
      </Section>

      <Section title="Light or dark" description="Choose light or dark, or let NIWA follow your device.">
        <ToggleButtonGroup
          exclusive
          value={mode ?? 'system'}
          onChange={(_, next: 'light' | 'dark' | 'system' | null) => next && void run(save({ mode: next }))}
          aria-label="Light or dark"
        >
          <ToggleButton value="light" aria-label="Light">
            <LightModeOutlined fontSize="small" sx={{ mr: 1 }} /> Light
          </ToggleButton>
          <ToggleButton value="dark" aria-label="Dark">
            <DarkModeOutlined fontSize="small" sx={{ mr: 1 }} /> Dark
          </ToggleButton>
          <ToggleButton value="system" aria-label="System">
            <SettingsBrightnessOutlined fontSize="small" sx={{ mr: 1 }} /> System
          </ToggleButton>
        </ToggleButtonGroup>
      </Section>

      <Box>
        <Button
          disabled={isDefault}
          onClick={() =>
            void run(save({ theme: DEFAULT_APPEARANCE.theme, font: DEFAULT_APPEARANCE.font, mode: 'system' }))
          }
        >
          Reset to defaults (Garden, Fredoka, System)
        </Button>
      </Box>
    </Stack>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  label,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        justifyContent: 'flex-start',
        textAlign: 'left',
        p: 1.5,
        borderRadius: 1,
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        // Keep the content still when the border thickens.
        m: selected ? 0 : '1px',
        bgcolor: selected ? 'primaryContainer.main' : 'background.paper',
        color: selected ? 'primaryContainer.contrastText' : 'text.primary',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      {selected && <CheckCircleRounded fontSize="small" sx={{ color: 'primary.main' }} />}
    </ButtonBase>
  );
}

/** A small picture of a theme in the current mode: page, card, button and accents (V10.P3). */
function ThemeSwatch({
  id,
  mode,
  selected,
  onSelect,
}: {
  id: ThemeId;
  mode: 'light' | 'dark';
  selected: boolean;
  onSelect: () => void;
}) {
  const p = themes[id].palettes[mode];
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      aria-label={themes[id].label}
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
      {/* Colours come from the theme being previewed, not the active one. */}
      <Box aria-hidden sx={{ bgcolor: p.background, p: 1.25, height: 84 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: p.surface,
            border: 1,
            borderColor: p.divider,
            borderRadius: 1,
            p: 1,
            height: '100%',
          }}
        >
          <Box sx={{ height: 6, width: '70%', borderRadius: 3, bgcolor: p.textPrimary, opacity: 0.85 }} />
          <Box sx={{ height: 5, width: '45%', borderRadius: 3, bgcolor: p.textSecondary, mt: 0.75 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.25 }}>
            <Box sx={{ height: 16, width: 40, borderRadius: 2, bgcolor: p.primaryContainer }} />
            <Box sx={{ height: 10, width: 10, borderRadius: '50%', bgcolor: p.primary }} />
            <Box sx={{ height: 10, width: 10, borderRadius: '50%', bgcolor: p.secondary }} />
          </Box>
        </Paper>
      </Box>
      <Paper square elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1 }}>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: selected ? 600 : 500 }}>
          {themes[id].label}
        </Typography>
        {selected && <CheckCircleRounded fontSize="small" sx={{ color: 'primary.main' }} />}
      </Paper>
    </ButtonBase>
  );
}
