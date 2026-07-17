import { Request, Response } from 'express';
import { BaseService } from './base.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

/**
 * BaseController provides standard CRUD operations.
 * Subclasses can override these methods to change default behaviour 
 * (e.g. returning 201 for create, or 204 for delete) or add new methods.
 */
export abstract class BaseController<T, S extends BaseService<T, any>> {
  constructor(protected readonly service: S) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    // Use res.locals.validated.query (set by validate middleware) — req.query is read-only in Express 5
    const query = res.locals.validated?.query ?? req.query;
    logger.info(`[${this.constructor.name}.getAll] Fetching all items`, { query });
    const items = await this.service.getAll(query as any);
    res.json(ApiResponse.success(items));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = (res.locals.validated?.params?.id ?? req.params.id) as string;
    logger.info(`[${this.constructor.name}.getById] Fetching item by id`, { id });
    const item = await this.service.getById(id);
    res.json(ApiResponse.success(item));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    logger.info(`[${this.constructor.name}.create] Creating new item`, { body: req.body });
    const newItem = await this.service.create(req.body);
    res.status(201).json(ApiResponse.success(newItem, 'Created successfully'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = (res.locals.validated?.params?.id ?? req.params.id) as string;
    logger.info(`[${this.constructor.name}.update] Updating item`, { id, body: req.body });
    const updatedItem = await this.service.update(id, req.body);
    res.json(ApiResponse.success(updatedItem, 'Updated successfully'));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = (res.locals.validated?.params?.id ?? req.params.id) as string;
    logger.info(`[${this.constructor.name}.delete] Deleting item`, { id });
    await this.service.delete(id);
    res.status(204).send();
  });

  deleteAll = asyncHandler(async (req: Request, res: Response) => {
    logger.info(`[${this.constructor.name}.deleteAll] Deleting all items`);
    await this.service.deleteAll();
    res.status(204).send();
  });
}
