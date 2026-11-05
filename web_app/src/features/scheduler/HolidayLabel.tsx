import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Link from '@mui/material/Link';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import type { Holiday } from '@niwa/contracts';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../../auth/AuthProvider.tsx';

/** "Philippines" for "PH", in the reader's language. */
export function countryName(code: string | null | undefined): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

const KIND: Record<Holiday['type'], string> = {
  public: 'Public holiday',
  bank: 'Bank holiday',
  school: 'School holiday',
  optional: 'Optional holiday',
  observance: 'Observance',
};

/**
 * A public holiday in the Calendar (B-01 B8): quiet, read-only — not an entry, so it can't be dragged, edited
 * or deleted. Clicking it says what it is and where to change the country.
 */
export function HolidayLabel({ holiday, compact = false }: { holiday: Holiday; compact?: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const country = useAuth().user?.preferences.holidays.country;
  return (
    <>
      <ButtonBase
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`${holiday.name}, ${KIND[holiday.type].toLowerCase()}`}
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'flex-start',
          gap: 0.5,
          px: 0.5,
          py: 0.125,
          mb: 0.25,
          borderRadius: 0.75,
          typography: 'caption',
          fontWeight: 600,
          lineHeight: 1.5,
          textAlign: 'left',
          color: 'text.primary',
          border: 1,
          borderStyle: 'dashed',
          borderColor: 'secondary.main',
          bgcolor: (t) => t.alpha((t.vars ?? t).palette.secondary.main, 0.14),
        }}
      >
        <CelebrationOutlined sx={{ fontSize: '1.1em', flexShrink: 0, color: 'text.secondary' }} />
        {!compact && (
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {holiday.name}
          </Box>
        )}
      </ButtonBase>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, maxWidth: (t) => t.niwa.width.card }}>
          <Typography variant="subtitle1" component="p">
            {holiday.name}
          </Typography>
          {holiday.localName !== holiday.name && (
            <Typography variant="body2" color="text.secondary">
              {holiday.localName}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            {KIND[holiday.type]}
            {country ? ` in ${countryName(country)}` : ''}
          </Typography>
          <Link
            component={RouterLink}
            to="/settings/calendar"
            variant="body2"
            sx={{ display: 'inline-block', mt: 1 }}
          >
            Change country
          </Link>
        </Box>
      </Popover>
    </>
  );
}
