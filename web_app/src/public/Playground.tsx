import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import {
  fonts,
  layouts,
  patterns,
  themes,
  type FontId,
  type LayoutId,
  type PatternId,
  type ThemeId,
} from '@niwa/tokens';
import { pageStyle } from '../components/PageBackground.tsx';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  isFromPlayground,
  PLAYGROUND_PATH,
  type PlaygroundAppearance,
  type ToPlayground,
} from '../playground/protocol.ts';
import { useRegistrationOpen } from './useRegistrationOpen.ts';

/**
 * "Try it before you sign up" (NIWA-PLAN-B-02 V11): the real app running on an example garden in an iframe,
 * plus a panel to preview the themes, fonts and light/dark. The iframe loads only when scrolled near, and
 * the choices here affect only the preview.
 */
export function Playground() {
  const registrationOpen = useRegistrationOpen();
  const { colorScheme } = useColorScheme();
  const frame = useRef<HTMLIFrameElement>(null);
  const [run, setRun] = useState(0);
  const [look, setLook] = useState<PlaygroundAppearance>(() => ({
    theme: 'garden',
    font: 'fredoka',
    mode: colorScheme === 'dark' ? 'dark' : 'light',
    layout: 'scrapbook',
    pattern: 'dots',
  }));

  const [touchedMode, setTouchedMode] = useState(false);
  // The page's light/dark is known after the first render; the preview starts in it until the visitor picks.
  const pageMode = colorScheme === 'dark' ? 'dark' : 'light';
  if (!touchedMode && look.mode !== pageMode) setLook((l) => ({ ...l, mode: pageMode }));

  // Send the current look whenever it changes, and again whenever the preview (re)loads and says it's ready.
  useEffect(() => {
    const send = () => {
      const msg: ToPlayground = { source: 'niwa-landing', type: 'appearance', ...look };
      frame.current?.contentWindow?.postMessage(msg, window.location.origin);
    };
    send();
    const onMessage = (e: MessageEvent) => isFromPlayground(e) && send();
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [look]);

  const set = (patch: Partial<PlaygroundAppearance>) => {
    if (patch.mode) setTouchedMode(true);
    setLook((l) => ({ ...l, ...patch }));
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 17rem' },
        alignItems: 'start',
      }}
    >
      <Paper
        variant="outlined"
        component="section"
        aria-label="Interactive example"
        sx={{ overflow: 'hidden', borderRadius: 2 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
            Example · runs in your browser
          </Typography>
          <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setRun((r) => r + 1)}>
            Start fresh
          </Button>
        </Box>
        <Box
          key={run}
          component="iframe"
          ref={frame}
          src={PLAYGROUND_PATH}
          title="NIWA with an example garden — try ticking a task, capturing an idea or opening the garden"
          loading="lazy"
          sx={{
            display: 'block',
            width: '100%',
            height: { xs: 560, md: 620 },
            border: 0,
            bgcolor: 'background.default',
          }}
        />
      </Paper>

      <Paper
        variant="outlined"
        component="section"
        aria-labelledby="customise-title"
        sx={{ p: 2, borderRadius: 2 }}
      >
        <Typography id="customise-title" variant="subtitle1" component="h3">
          Make it yours
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Try the themes, fonts and dark mode on the example. Your choices are saved to your account after you
          sign up.
        </Typography>

        <Typography variant="caption" color="text.secondary" component="p" id="pg-theme" sx={{ mb: 0.75 }}>
          Colour theme
        </Typography>
        <Box
          role="radiogroup"
          aria-labelledby="pg-theme"
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}
        >
          {(Object.keys(themes) as ThemeId[]).map((id) => {
            const p = themes[id].palettes[look.mode];
            const selected = look.theme === id;
            return (
              <Tooltip key={id} title={themes[id].label}>
                <ButtonBase
                  role="radio"
                  aria-checked={selected}
                  aria-label={themes[id].label}
                  onClick={() => set({ theme: id })}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: 2,
                    borderColor: selected ? 'text.primary' : 'divider',
                    // Two halves: the theme's pastel container and its accent.
                    background: `linear-gradient(135deg, ${p.primaryContainer} 50%, ${p.secondary} 50%)`,
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>

        <Typography variant="caption" color="text.secondary" component="p" id="pg-font" sx={{ mb: 0.75 }}>
          Font
        </Typography>
        <ToggleButtonGroup
          orientation="vertical"
          exclusive
          fullWidth
          size="small"
          value={look.font}
          onChange={(_, v: FontId | null) => v && set({ font: v })}
          aria-labelledby="pg-font"
          sx={{ mb: 2 }}
        >
          {(Object.keys(fonts) as FontId[]).map((id) => (
            <ToggleButton key={id} value={id} sx={{ justifyContent: 'flex-start' }}>
              {fonts[id].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Typography variant="caption" color="text.secondary" component="p" id="pg-mode" sx={{ mb: 0.75 }}>
          Light or dark
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={look.mode}
          onChange={(_, v: 'light' | 'dark' | null) => v && set({ mode: v })}
          aria-labelledby="pg-mode"
        >
          <ToggleButton value="light">Light</ToggleButton>
          <ToggleButton value="dark">Dark</ToggleButton>
        </ToggleButtonGroup>

        <Typography
          variant="caption"
          color="text.secondary"
          component="p"
          id="pg-layout"
          sx={{ mb: 0.75, mt: 2 }}
        >
          Layout
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={look.layout}
          onChange={(_, v: LayoutId | null) => v && set({ layout: v })}
          aria-labelledby="pg-layout"
        >
          {(Object.keys(layouts) as LayoutId[]).map((id) => (
            <ToggleButton key={id} value={id}>
              {layouts[id].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {look.layout === 'scrapbook' && (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              component="p"
              id="pg-pattern"
              sx={{ mb: 0.75, mt: 2 }}
            >
              Background
            </Typography>
            <Box
              role="radiogroup"
              aria-labelledby="pg-pattern"
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}
            >
              {(Object.keys(patterns) as PatternId[]).map((id) => {
                const selected = look.pattern === id;
                return (
                  <Tooltip key={id} title={patterns[id].label}>
                    <ButtonBase
                      role="radio"
                      aria-checked={selected}
                      aria-label={patterns[id].label}
                      onClick={() => set({ pattern: id })}
                      style={pageStyle(look.theme, look.mode, {
                        pattern: id,
                        strength: 'normal',
                        washes: false,
                      })}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: selected ? 3 : 1,
                        borderColor: selected ? 'primary.main' : 'divider',
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </>
        )}

        {registrationOpen && (
          <Stack sx={{ mt: 3 }}>
            <Button component={RouterLink} to="/register" variant="contained">
              Create account
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
