import { DEFAULT_PREFERENCES, HolidayQuery, HolidayRegionsQuery } from '@niwa/contracts';
import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/errors.ts';
import { parse } from '../lib/parse.ts';
import { authOf } from '../middleware/auth.ts';
import { userRepo } from '../repositories/user.repo.ts';
import { holidayService } from '../services/holiday.service.ts';

/** Public holidays for the Calendar (NIWA-PLAN-B-01 B8). */
export const holidayController = {
  range: (async (req, res) => {
    const { from, to } = parse(HolidayQuery, req.query);
    const user = await userRepo.findById(authOf(res.locals).userId);
    if (!user) throw unauthorized();
    const pref = { ...DEFAULT_PREFERENCES.holidays, ...user.preferences?.holidays };
    res.json({ country: pref.country, holidays: holidayService.range(pref, from, to) });
  }) satisfies RequestHandler,

  countries: ((_req, res) => {
    res.json({ places: holidayService.countries() });
  }) satisfies RequestHandler,

  regions: ((req, res) => {
    const { country } = parse(HolidayRegionsQuery, req.query);
    res.json({ places: holidayService.regions(country) });
  }) satisfies RequestHandler,
};
