import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { floatingCardSx, stickerSx } from '../components/Surface.tsx';
import { Wordmark } from '../components/Wordmark.tsx';
import { useTree } from '../features/items/queries.ts';
import { DESTINATIONS, destinationForPath, type Destination } from './destinations.tsx';
import { DestIcon } from './NavRail.tsx';
import { folderIcon } from './TreePane.tsx';

/** Width of the floating sidebar card, by kind (B-03 C1). */
export const SIDEBAR_WIDTH = { labels: 224, icons: 84 } as const;

/**
 * The Scrapbook sidebar (NIWA-PLAN-B-03 C1): a floating paper card, like the Moeko Works and Kotoha admin
 * dashboards. `labels`: icon + name rows with a "Spaces" group for the top-level folders; `icons`: a slim
 * floating rail (tablets, or when chosen). The current place wears the sticker look when stickers are on.
 */
export function Sidebar({ labels }: { labels: boolean }) {
  const location = useLocation();
  const current = destinationForPath(location.pathname)?.key;
  const { data: items } = useTree();
  const spaces = useMemo(() => (items ?? []).filter((i) => i.parentId === null), [items]);
  const places = DESTINATIONS.filter((d) => d.inNav);
  const settings = DESTINATIONS.find((d) => d.key === 'settings')!;

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={[
        floatingCardSx,
        {
          width: labels ? SIDEBAR_WIDTH.labels : SIDEBAR_WIDTH.icons,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: labels ? 'stretch' : 'center',
          gap: 0.5,
          p: 1.25,
          overflowY: 'auto',
        },
      ]}
    >
      <Box
        sx={{ display: 'grid', placeItems: labels ? 'start' : 'center', px: labels ? 1.25 : 0, py: 1, mb: 1 }}
      >
        <Wordmark size={labels ? 'medium' : 'small'} />
      </Box>
      {places.map((d) => (
        <NavItem key={d.key} d={d} labels={labels} active={current === d.key} />
      ))}

      {labels && spaces.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 2, borderStyle: 'dashed', borderColor: 'divider' }}>
          <Typography
            variant="overline"
            color="text.secondary"
            component="p"
            sx={{ px: 1.25, mb: 0.5, lineHeight: 1.6 }}
          >
            Spaces
          </Typography>
          {spaces.map((s) => (
            <Row
              key={s.id}
              to={`/garden/${s.id}`}
              icon={folderIcon(s)}
              label={s.title}
              active={location.pathname.endsWith(`/${s.id}`)}
              small
            />
          ))}
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 1 }}>
        <NavItem d={settings} labels={labels} active={current === 'settings'} />
      </Box>
    </Box>
  );
}

function NavItem({ d, labels, active }: { d: Destination; labels: boolean; active: boolean }) {
  return (
    <Tooltip
      title={
        labels
          ? d.shortcut
            ? `g ${d.shortcut}`
            : ''
          : d.shortcut
            ? `${d.label}  ·  g ${d.shortcut}`
            : d.label
      }
      placement="right"
      describeChild
      disableHoverListener={labels && !d.shortcut}
    >
      <Box>
        <Row
          to={d.path}
          icon={<DestIcon d={d} />}
          label={d.label}
          active={active}
          tour={`nav-${d.key}`}
          iconsOnly={!labels}
        />
      </Box>
    </Tooltip>
  );
}

function Row({
  to,
  icon,
  label,
  active,
  tour,
  small = false,
  iconsOnly = false,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  tour?: string;
  small?: boolean;
  iconsOnly?: boolean;
}) {
  return (
    <ButtonBase
      component={Link}
      to={to}
      aria-current={active ? 'page' : undefined}
      aria-label={iconsOnly ? label : undefined}
      data-tour={tour}
      sx={(t: Theme) => ({
        width: '100%',
        display: 'flex',
        flexDirection: iconsOnly ? 'column' : 'row',
        justifyContent: iconsOnly ? 'center' : 'flex-start',
        gap: iconsOnly ? 0.25 : 1.25,
        px: iconsOnly ? 0.5 : 1.25,
        py: small ? 0.75 : 1,
        borderRadius: 999,
        color: 'text.primary',
        typography: small ? 'body2' : 'body1',
        fontWeight: 600,
        textAlign: 'left',
        '& svg': { color: active ? 'inherit' : 'text.secondary' },
        '&:hover': { bgcolor: 'action.hover' },
        ...(active &&
          (t.niwa.layout.stickers
            ? stickerSx(t)
            : { bgcolor: t.alpha((t.vars ?? t).palette.primary.main, 0.12) })),
      })}
    >
      {icon}
      {iconsOnly ? (
        <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      ) : (
        <Box
          component="span"
          sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {label}
        </Box>
      )}
    </ButtonBase>
  );
}
