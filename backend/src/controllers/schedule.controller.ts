import {
  CreateScheduleEntryInput,
  IdParams,
  ScheduleRangeQuery,
  ScheduleScopeQuery,
  UpdateScheduleEntryInput,
} from '@niwa/contracts';
import type { RequestHandler } from 'express';
import { parse } from '../lib/parse.ts';
import { authOf } from '../middleware/auth.ts';
import { scheduleService } from '../services/schedule.service.ts';

const wid = (locals: Express.Locals) => authOf(locals).workspaceId;
const idOf = (params: unknown) => parse(IdParams, params).id;

export const scheduleController = {
  range: (async (req, res) => {
    const { from, to } = parse(ScheduleRangeQuery, req.query);
    res.json({ entries: await scheduleService.range(wid(res.locals), from, to) });
  }) satisfies RequestHandler,

  forItem: (async (req, res) => {
    res.json({ entries: await scheduleService.forItem(wid(res.locals), idOf(req.params)) });
  }) satisfies RequestHandler,

  create: (async (req, res) => {
    const entry = await scheduleService.create(wid(res.locals), parse(CreateScheduleEntryInput, req.body));
    res.status(201).json({ entry });
  }) satisfies RequestHandler,

  update: (async (req, res) => {
    const { scope } = parse(ScheduleScopeQuery, req.query);
    const entry = await scheduleService.update(
      wid(res.locals),
      idOf(req.params),
      parse(UpdateScheduleEntryInput, req.body),
      scope,
    );
    res.json({ entry });
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    const { scope } = parse(ScheduleScopeQuery, req.query);
    await scheduleService.remove(wid(res.locals), idOf(req.params), scope);
    res.status(204).end();
  }) satisfies RequestHandler,
};
