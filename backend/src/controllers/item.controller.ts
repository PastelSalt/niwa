import {
  CaptureInput,
  CreateItemInput,
  CreateLinkInput,
  FileItemInput,
  FocusQuery,
  IdParams,
  ListItemsQuery,
  MoveItemInput,
  PromoteSectionInput,
  RenameTagInput,
  ReviewQuery,
  SearchQuery,
  TreeQuery,
  UpdateItemInput,
  VersionInput,
} from '@niwa/contracts';
import type { RequestHandler } from 'express';
import { parse } from '../lib/parse.ts';
import { linkService } from '../services/link.service.ts';
import { authOf } from '../middleware/auth.ts';
import { itemService } from '../services/item.service.ts';
import { searchService } from '../services/search.service.ts';

const wid = (locals: Express.Locals) => authOf(locals).workspaceId;
const idOf = (params: unknown) => parse(IdParams, params).id;

export const itemController = {
  tree: (async (req, res) => {
    const { includeArchived } = parse(TreeQuery, req.query);
    res.json({ items: await itemService.tree(wid(res.locals), !!includeArchived) });
  }) satisfies RequestHandler,

  list: (async (req, res) => {
    res.json({ items: await itemService.list(wid(res.locals), parse(ListItemsQuery, req.query)) });
  }) satisfies RequestHandler,

  get: (async (req, res) => {
    res.json({ item: await itemService.get(wid(res.locals), idOf(req.params)) });
  }) satisfies RequestHandler,

  ancestors: (async (req, res) => {
    res.json({ items: await itemService.ancestors(wid(res.locals), idOf(req.params)) });
  }) satisfies RequestHandler,

  create: (async (req, res) => {
    res
      .status(201)
      .json({ item: await itemService.create(wid(res.locals), parse(CreateItemInput, req.body)) });
  }) satisfies RequestHandler,

  update: (async (req, res) => {
    const item = await itemService.update(
      wid(res.locals),
      idOf(req.params),
      parse(UpdateItemInput, req.body),
    );
    res.json({ item });
  }) satisfies RequestHandler,

  move: (async (req, res) => {
    const item = await itemService.move(wid(res.locals), idOf(req.params), parse(MoveItemInput, req.body));
    res.json({ item });
  }) satisfies RequestHandler,

  archive: (async (req, res) => {
    const { version } = parse(VersionInput, req.body);
    res.json({ item: await itemService.setArchived(wid(res.locals), idOf(req.params), version, true) });
  }) satisfies RequestHandler,

  unarchive: (async (req, res) => {
    const { version } = parse(VersionInput, req.body);
    res.json({ item: await itemService.setArchived(wid(res.locals), idOf(req.params), version, false) });
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    res.json(await itemService.softDelete(wid(res.locals), idOf(req.params)));
  }) satisfies RequestHandler,

  restore: (async (req, res) => {
    res.json(await itemService.restore(wid(res.locals), idOf(req.params)));
  }) satisfies RequestHandler,

  purge: (async (req, res) => {
    res.json(await itemService.purge(wid(res.locals), idOf(req.params)));
  }) satisfies RequestHandler,

  trash: (async (_req, res) => {
    res.json({ items: await itemService.trash(wid(res.locals)) });
  }) satisfies RequestHandler,

  focus: (async (req, res) => {
    const { today, upcomingDays } = parse(FocusQuery, req.query);
    res.json(await itemService.focus(wid(res.locals), today, upcomingDays));
  }) satisfies RequestHandler,

  tags: (async (_req, res) => {
    res.json({ tags: await itemService.tags(wid(res.locals)) });
  }) satisfies RequestHandler,

  renameTag: (async (req, res) => {
    const { from, to } = parse(RenameTagInput, req.body);
    res.json({ updated: await itemService.renameTag(wid(res.locals), from, to) });
  }) satisfies RequestHandler,

  review: (async (req, res) => {
    const { today } = parse(ReviewQuery, req.query);
    res.json({ items: await itemService.review(wid(res.locals), today) });
  }) satisfies RequestHandler,

  promoteSection: (async (req, res) => {
    const { version, anchorId } = parse(PromoteSectionInput, req.body);
    res.json(await itemService.promoteSection(wid(res.locals), idOf(req.params), version, anchorId));
  }) satisfies RequestHandler,

  links: (async (req, res) => {
    res.json(await linkService.forItem(wid(res.locals), idOf(req.params)));
  }) satisfies RequestHandler,

  createLink: (async (req, res) => {
    res
      .status(201)
      .json({ link: await linkService.createManual(wid(res.locals), parse(CreateLinkInput, req.body)) });
  }) satisfies RequestHandler,

  removeLink: (async (req, res) => {
    await linkService.removeManual(wid(res.locals), idOf(req.params));
    res.status(204).end();
  }) satisfies RequestHandler,

  capture: (async (req, res) => {
    res.status(201).json({ item: await itemService.capture(wid(res.locals), parse(CaptureInput, req.body)) });
  }) satisfies RequestHandler,

  inbox: (async (_req, res) => {
    res.json({ items: await itemService.inbox(wid(res.locals)) });
  }) satisfies RequestHandler,

  file: (async (req, res) => {
    res.json({
      item: await itemService.file(wid(res.locals), idOf(req.params), parse(FileItemInput, req.body)),
    });
  }) satisfies RequestHandler,

  search: (async (req, res) => {
    res.json({ hits: await searchService.search(wid(res.locals), parse(SearchQuery, req.query)) });
  }) satisfies RequestHandler,
};
