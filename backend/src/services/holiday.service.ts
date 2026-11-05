import Holidays from 'date-holidays';
import type { Holiday, HolidayPlace, HolidayPreference } from '@niwa/contracts';
import { AppError } from '../lib/errors.ts';

/**
 * Public holidays (NIWA-PLAN-B-01 B8) from the offline `date-holidays` rules (ISC; data CC BY 3.0) — no
 * third-party API is called. Results are cached per country/region/year; the rules never change at runtime.
 */

type Kind = Holiday['type'];
const KINDS: readonly Kind[] = ['public', 'bank', 'school', 'optional', 'observance'];
const cache = new Map<string, Holiday[]>();
let countries: HolidayPlace[] | null = null;

const sortByName = (a: HolidayPlace, b: HolidayPlace) => a.name.localeCompare(b.name);

export const holidayService = {
  countries(): HolidayPlace[] {
    countries ??= Object.entries(new Holidays().getCountries('en'))
      .map(([code, name]) => ({ code, name }))
      .sort(sortByName);
    return countries;
  },

  regions(country: string): HolidayPlace[] {
    const states = new Holidays().getStates(country, 'en') ?? {};
    return Object.entries(states)
      .map(([code, name]) => ({ code, name }))
      .sort(sortByName);
  },

  /** Throws a 400 when the country or region isn't one the rules know. */
  validate(pref: Pick<HolidayPreference, 'country' | 'region'>) {
    if (!pref.country) {
      if (pref.region)
        throw new AppError('VALIDATION_ERROR', 'Pick a country before a region.', { field: 'region' });
      return;
    }
    if (!this.countries().some((c) => c.code === pref.country))
      throw new AppError('VALIDATION_ERROR', 'Unknown country.', { field: 'country' });
    if (pref.region && !this.regions(pref.country).some((r) => r.code === pref.region))
      throw new AppError('VALIDATION_ERROR', 'Unknown region for that country.', { field: 'region' });
  },

  year(country: string, region: string | null, year: number): Holiday[] {
    const key = `${country}|${region ?? ''}|${year}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const english = region
      ? new Holidays(country, region, { languages: ['en'] })
      : new Holidays(country, { languages: ['en'] });
    const local = region ? new Holidays(country, region) : new Holidays(country);
    const localNames = new Map(
      (local.getHolidays(year) || []).map((h) => [`${h.date.slice(0, 10)}|${h.rule}`, h.name]),
    );
    const list = (english.getHolidays(year) || [])
      .filter((h) => KINDS.includes(h.type as Kind))
      .map((h) => ({
        date: h.date.slice(0, 10),
        name: h.name,
        localName: localNames.get(`${h.date.slice(0, 10)}|${h.rule}`) ?? h.name,
        type: h.type as Kind,
      }));
    cache.set(key, list);
    return list;
  },

  /** Holidays from `from` to `to` (inclusive, `YYYY-MM-DD`). Observances only when asked for. */
  range(pref: HolidayPreference, from: string, to: string): Holiday[] {
    if (!pref.country) return [];
    const years = new Set([Number(from.slice(0, 4)), Number(to.slice(0, 4))]);
    return [...years]
      .flatMap((y) => this.year(pref.country!, pref.region, y))
      .filter((h) => h.date >= from && h.date <= to)
      .filter((h) => pref.observances || h.type !== 'observance')
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
