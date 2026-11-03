import { ConfirmAttachmentInput, IdParams, UploadSignatureRequest } from '@niwa/contracts';
import type { RequestHandler } from 'express';
import { parse } from '../lib/parse.ts';
import { authOf } from '../middleware/auth.ts';
import { attachmentService } from '../services/attachment.service.ts';

const wid = (locals: Express.Locals) => authOf(locals).workspaceId;

export const uploadController = {
  config: ((_req, res) => {
    res.json(attachmentService.config());
  }) satisfies RequestHandler,

  sign: (async (req, res) => {
    const { itemId } = parse(UploadSignatureRequest, req.body);
    res.json(await attachmentService.sign(wid(res.locals), itemId));
  }) satisfies RequestHandler,

  confirm: (async (req, res) => {
    const attachment = await attachmentService.confirm(
      wid(res.locals),
      parse(ConfirmAttachmentInput, req.body),
    );
    res.status(201).json({ attachment });
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    await attachmentService.remove(wid(res.locals), parse(IdParams, req.params).id);
    res.status(204).end();
  }) satisfies RequestHandler,
};
