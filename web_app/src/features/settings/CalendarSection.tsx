import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { HolidayPlace, PreferencesInput } from '@niwa/contracts';
import { useQuery } from '@tanstack/react-query';
import { messageOf } from '../../api/client.ts';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { Section } from './Section.tsx';

/** The visitor's likely country from the browser's language (e.g. en-PH → PH), for a one-tap suggestion. */
export function suggestedCountry(languages: readonly string[] = navigator.languages ?? [navigator.language]) {
  for (const lang of languages) {
    try {
      const region = new Intl.Locale(lang).maximize().region;
      if (region && /^[A-Z]{2}$/.test(region)) return region;
    } catch {
      /* not a valid tag */
    }
  }
  return null;
}

/**
 * Settings › Calendar (B-01 B8): the country (and region) whose public holidays the Calendar shows. Saved on
 * the account. The holiday rules come from the server's offline `date-holidays` data.
 */
export function CalendarSection() {
  const { api, user } = useAuth();
  const notify = useNotify();
  const pref = user?.preferences.holidays ?? { country: null, region: null, observances: false };
  const countries = useQuery({
    queryKey: ['holidayCountries'],
    queryFn: async () => (await api.holidays.countries()).places,
    staleTime: Infinity,
  });
  const regions = useQuery({
    queryKey: ['holidayRegions', pref.country],
    queryFn: async () => (await api.holidays.regions(pref.country!)).places,
    enabled: !!pref.country,
    staleTime: Infinity,
  });
  const save = (holidays: NonNullable<PreferencesInput['holidays']>) =>
    api.account
      .setPreferences({ holidays })
      .catch((err: unknown) => notify(messageOf(err), { severity: 'error' }));

  const list = countries.data ?? [];
  const byCode = (code: string | null) => list.find((c) => c.code === code) ?? null;
  const suggestion = byCode(suggestedCountry());

  return (
    <Section
      title="Public holidays"
      description="Pick your country and the Calendar shows its public holidays, so it matches your days off."
    >
      <Stack spacing={2} sx={{ maxWidth: (t) => t.niwa.width.narrow }}>
        <Autocomplete<HolidayPlace>
          options={list}
          loading={countries.isLoading}
          value={byCode(pref.country)}
          onChange={(_, v) => void save({ country: v?.code ?? null })}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.code === b.code}
          renderInput={(params) => <TextField {...params} label="Country" placeholder="No holidays" />}
        />
        {!pref.country && suggestion && (
          <Typography variant="body2" color="text.secondary">
            Looks like you might be in {suggestion.name}.{' '}
            <Button size="small" onClick={() => void save({ country: suggestion.code })}>
              Use {suggestion.name}
            </Button>
          </Typography>
        )}
        {!!regions.data?.length && (
          <Autocomplete<HolidayPlace>
            options={regions.data}
            value={regions.data.find((r) => r.code === pref.region) ?? null}
            onChange={(_, v) => void save({ region: v?.code ?? null })}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.code === b.code}
            renderInput={(params) => (
              <TextField
                {...params}
                label="State or region (optional)"
                helperText="Adds its local holidays"
              />
            )}
          />
        )}
        <FormControlLabel
          control={
            <Switch
              checked={pref.observances}
              disabled={!pref.country}
              onChange={(e) => void save({ observances: e.target.checked })}
            />
          }
          label="Also show observances (days that aren't days off, like Valentine's Day)"
        />
        <Typography variant="caption" color="text.secondary">
          Holiday dates come from the open-source date-holidays project. Your country is saved on your account
          and used only for this.
        </Typography>
      </Stack>
    </Section>
  );
}
