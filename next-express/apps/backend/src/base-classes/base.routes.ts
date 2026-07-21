import { Router } from 'express';
import { BaseController } from './base.controller';
import { validate } from '../middlewares/validate';
import { ZodSchema, z } from 'zod';
import { idParamSchema, paginationSchema } from '../shared/schemas';

export interface BaseRouteSchemas {
  getAll?: ZodSchema<any> | false;
  get?: ZodSchema<any> | false;
  create?: ZodSchema<any> | false;
  update?: ZodSchema<any> | false;
  delete?: ZodSchema<any> | false;
  deleteAll?: boolean; // pass false to disable
}

const defaultIdSchema = z.object({ params: idParamSchema });
const defaultPaginationSchema = z.object({ query: paginationSchema });

/**
 * Creates a base router with standard CRUD endpoints.
 * To override or add routes, use the returned router:
 *
 * const router = createBaseRouter(controller, schemas);
 * router.post('/custom', validate(customSchema), controller.customMethod);
 *
 * To add middleware to a specific base route, you can either:
 * 1. Define it before calling createBaseRouter (router.use(...))
 * 2. Don't pass the schema for that route here, and manually define the route below.
 */
export function createBaseRouter<T, C extends BaseController<T, any>>(
  controller: C,
  schemas?: BaseRouteSchemas
): Router {
  const router = Router();

  if (schemas?.getAll !== false) {
    if (schemas?.getAll && typeof schemas.getAll !== 'boolean') {
      router.get('/', validate(schemas.getAll), controller.getAll);
    } else {
      router.get('/', validate(defaultPaginationSchema), controller.getAll);
    }
  }

  if (schemas?.get !== false) {
    if (schemas?.get && typeof schemas.get !== 'boolean') {
      router.get('/:id', validate(schemas.get), controller.getById);
    } else {
      router.get('/:id', validate(defaultIdSchema), controller.getById);
    }
  }

  if (schemas?.create !== false) {
    if (schemas?.create && typeof schemas.create !== 'boolean') {
      router.post('/', validate(schemas.create), controller.create);
    } else {
      router.post('/', controller.create);
    }
  }

  if (schemas?.update !== false) {
    if (schemas?.update && typeof schemas.update !== 'boolean') {
      router.put('/:id', validate(schemas.update), controller.update);
    } else {
      router.put('/:id', validate(defaultIdSchema), controller.update);
    }
  }

  if (schemas?.delete !== false) {
    if (schemas?.delete && typeof schemas.delete !== 'boolean') {
      router.delete('/:id', validate(schemas.delete), controller.delete);
    } else {
      router.delete('/:id', validate(defaultIdSchema), controller.delete);
    }
  }

  if (schemas?.deleteAll !== false) {
    router.delete('/', controller.deleteAll);
  }

  return router;
}
