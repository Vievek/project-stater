import { Router } from 'express';
import { TagController } from './tag.controller';
import { createBaseRouter } from '../../base-classes/base.routes';
import { createTagSchema, updateTagSchema, getTagSchema, deleteTagSchema } from './tag.schemas';

/**
 * @swagger
 * tags:
 *   - name: Tags
 *     description: Tag resource endpoints. Base path: /api/tags
 *
 * components:
 *   schemas:
 *     TagBody:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: Buy groceries
 *     TagUpdateBody:
 *       type: object
 *       description: At least one field required.
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         completed:
 *           type: boolean
 *     TagSummary:
 *       type: object
 *       properties:
 *         total:     { type: integer }
 *         completed: { type: integer }
 *         pending:   { type: integer }
 *
 * /api/tags/summary:
 *   get:
 *     summary: Get a summary of all tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Aggregate counts of tags
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/TagSummary' }
 */
/**
 * Creates and returns the Tag router with all routes wired to the
 * provided controller.
 */
export function createTagRouter(controller: TagController): Router {
  // `createBaseRouter` wires all standard CRUD routes.
  // It handles pagination validation on `GET /` automatically,
  // and injects the provided schemas for specific operations.
  const router = createBaseRouter(controller, {
    get: getTagSchema,
    create: createTagSchema,
    update: updateTagSchema,
    delete: deleteTagSchema,
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
  //   finalRouter.post('/', someAuthMiddleware, validate(createTagSchema), controller.create);
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
