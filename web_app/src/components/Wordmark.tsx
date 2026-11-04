import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/** `niwa` lowercase wordmark with the optional 庭 (specs §1). */
// Brand mark sizes (not text roles), so they stay here rather than in the type scale.
export function Wordmark({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const fontSize = { small: 18, medium: 22, large: 34 }[size];
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.75, userSelect: 'none' }}>
      <Typography
        component="span"
        sx={{ fontSize, fontWeight: 700, letterSpacing: '-0.02em', color: 'primary.main', lineHeight: 1 }}
      >
        niwa
      </Typography>
      <Typography
        component="span"
        aria-hidden
        sx={{ fontSize: fontSize * 0.7, color: 'secondary.main', lineHeight: 1 }}
      >
        庭
      </Typography>
    </Box>
  );
}
