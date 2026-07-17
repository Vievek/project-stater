import { Router } from 'express';
import { BaseController } from './base.controller';
import { validate } from '../middlewares/validate';
import { ZodSchema, z } from 'zod';
import { idParamSchema, paginationSchema } from '../shared/schemas';

export interface BaseRouteSchemas {
  get?: ZodSchema<any>;
  create?: ZodSchema<any>;
  update?: ZodSchema<any>;
  delete?: ZodSchema<any>;
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

  // getAll typically supports pagination via query
  router.get('/', validate(defaultPaginationSchema), controller.getAll);

  if (schemas?.get) {
    router.get('/:id', validate(schemas.get), controller.getById);
  } else {
    router.get('/:id', validate(defaultIdSchema), controller.getById);
  }

  if (schemas?.create) {
    router.post('/', validate(schemas.create), controller.create);
  } else {
    router.post('/', controller.create);
  }

  if (schemas?.update) {
    router.put('/:id', validate(schemas.update), controller.update);
  } else {
    router.put('/:id', validate(defaultIdSchema), controller.update);
  }

  if (schemas?.delete) {
    router.delete('/:id', validate(schemas.delete), controller.delete);
  } else {
    router.delete('/:id', validate(defaultIdSchema), controller.delete);
  }

  router.delete('/', controller.deleteAll);

  return router;
}
