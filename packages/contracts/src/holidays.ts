import { z } from 'zod';
import { DateOnly } from './common.ts';

/** Public holidays for the Calendar (NIWA-PLAN-B-01 B8), from the account's country/region. */

export const HolidayType = z
  .enum(['public', 'bank', 'school', 'optional', 'observance'])
  .meta({ id: 'HolidayType' });

export const Holiday = z
  .object({
    date: DateOnly.meta({ description: 'Calendar day; never shifted by time zone' }),
    name: z.string().meta({ description: 'English name' }),
    localName: z.string().meta({ description: "Name in the country's language (may equal name)" }),
    type: HolidayType,
  })
  .meta({ id: 'Holiday' });
export type Holiday = z.infer<typeof Holiday>;

export const HolidayQuery = z
  .object({ from: DateOnly, to: DateOnly })
  .refine((v) => v.to >= v.from, { message: '`to` must not be before `from`', path: ['to'] })
  .refine((v) => Date.parse(v.to) - Date.parse(v.from) <= 62 * 86_400_000, {
    message: 'Range is limited to 62 days',
    path: ['to'],
  });

export const HolidayListResponse = z
  .object({
    country: z.string().nullable(),
    holidays: z.array(Holiday),
  })
  .meta({ id: 'HolidayListResponse', description: 'Empty when the account has no country' });
export type HolidayListResponse = z.infer<typeof HolidayListResponse>;

export const HolidayPlace = z.object({ code: z.string(), name: z.string() }).meta({ id: 'HolidayPlace' });
export type HolidayPlace = z.infer<typeof HolidayPlace>;

export const HolidayPlacesResponse = z
  .object({ places: z.array(HolidayPlace) })
  .meta({ id: 'HolidayPlacesResponse' });
export type HolidayPlacesResponse = z.infer<typeof HolidayPlacesResponse>;

export const HolidayRegionsQuery = z.object({ country: z.string().regex(/^[A-Z]{2}$/) });
