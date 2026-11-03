import { createTheme, type ColorSystemOptions } from '@mui/material/styles';
import { palettes, shape, typeColors, typography, type Palette } from '@niwa/tokens';

/** MUI theme built only from @niwa/tokens — no color literals anywhere else (specs §1, §11.7). */

type ItemTypeColors = (typeof typeColors)['light'];

declare module '@mui/material/styles' {
  interface Palette {
    itemType: ItemTypeColors;
  }
  interface PaletteOptions {
    itemType?: ItemTypeColors;
  }
}

function colorScheme(p: Palette, types: ItemTypeColors): ColorSystemOptions {
  return {
    palette: {
      itemType: types,
      primary: { main: p.primary, contrastText: p.primaryContrast },
      secondary: { main: p.secondary, contrastText: p.secondaryContrast },
      background: { default: p.background, paper: p.surface },
      text: { primary: p.textPrimary, secondary: p.textSecondary },
      divider: p.divider,
      error: { main: p.error },
      warning: { main: p.warning },
      success: { main: p.success },
      info: { main: p.info },
    },
  };
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: colorScheme(palettes.light, typeColors.light),
    dark: colorScheme(palettes.dark, typeColors.dark),
  },
  typography: {
    fontFamily: typography.fontFamily,
    fontSize: typography.baseSize,
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: shape.radius },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
