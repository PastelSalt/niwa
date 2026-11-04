import Box, { type BoxProps } from '@mui/material/Box';
import type { ContentWidth } from '@niwa/tokens';

/**
 * A screen's content column (NIWA-PLAN-B-02 V1.P2): page padding from the gap tokens, a max width from the
 * content-width tokens, centred in the space beside the tree so wide screens don't leave an empty right half.
 */
export function Page({ width = 'list', sx, children, ...rest }: { width?: ContentWidth } & BoxProps) {
  return (
    <Box
      {...rest}
      sx={[
        (t) => ({
          px: t.niwa.gaps.pageX,
          py: t.niwa.gaps.pageY,
          mx: 'auto',
          width: '100%',
          maxWidth: t.niwa.width[width],
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
