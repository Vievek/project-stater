import { Router } from 'express';
import { CategoryController } from './category.controller';
import { createBaseRouter } from '../../base-classes/base.routes';
import { createCategorySchema, updateCategorySchema, getCategorySchema, deleteCategorySchema } from './category.schemas';

/**
 * @swagger
 * tags:
 *   - name: Categorys
 *     description: Category resource endpoints. Base path: /api/categorys
 *
 * components:
 *   schemas:
 *     CategoryBody:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: Buy groceries
 *     CategoryUpdateBody:
 *       type: object
 *       description: At least one field required.
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         completed:
 *           type: boolean
 *     CategorySummary:
 *       type: object
 *       properties:
 *         total:     { type: integer }
 *         completed: { type: integer }
 *         pending:   { type: integer }
 *
 * /api/categorys/summary:
 *   get:
 *     summary: Get a summary of all categorys
 *     tags: [Categorys]
 *     responses:
 *       200:
 *         description: Aggregate counts of categorys
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/CategorySummary' }
 */
/**
 * Creates and returns the Category router with all routes wired to the
 * provided controller.
 */
export function createCategoryRouter(controller: CategoryController): Router {
  // `createBaseRouter` wires all standard CRUD routes.
  // It handles pagination validation on `GET /` automatically,
  // and injects the provided schemas for specific operations.
  const router = createBaseRouter(controller, {
    get: getCategorySchema,
    create: createCategorySchema,
    update: updateCategorySchema,
    delete: deleteCategorySchema,
  });

  // ---------------------------------------------------------------------------
  // HOW TO ADD CUSTOM MIDDLEWARE TO BASE ROUTES:
  // 
  // Option 1: Apply to ALL routes in the base router
  //   router.use(someAuthMiddleware);
  //
  // Option 2: Apply to a SPECIFIC base route (e.g., POST /)
  //   Instead of passing the schema to `createBaseRouter` (which auto-wires it),
  //   omit it from the config above and manually define it on `finalRouter`.
  //   IMPORTANT: Make sure to place it BEFORE `finalRouter.use('/', router)`:
  //   finalRouter.post('/', someAuthMiddleware, validate(createCategorySchema), controller.create);
  // ---------------------------------------------------------------------------

  // Mount our custom endpoint
  // Note: We mount it on a specific path BEFORE or AFTER base routes?
  // '/summary' must be routed carefully if '/:id' intercepts it, 
  // but since we are attaching to the returned router, it's safer to mount BEFORE if possible.
  // However, createBaseRouter already mounted `/:id`. Express evaluates in order.
  // If we want '/summary' to not be treated as `/:id`, we should mount it first.
  
  const finalRouter = Router();
  finalRouter.get('/summary', controller.getSummary);
  finalRouter.use('/', router);

  return finalRouter;
}
