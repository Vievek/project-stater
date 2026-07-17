import { Router } from 'express';
import { UserController } from './user.controller';
import { createBaseRouter } from '../../base-classes/base.routes';
import { createUserSchema, updateUserSchema, getUserSchema, deleteUserSchema } from './user.schemas';

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User resource endpoints. Base path: /api/users
 *
 * components:
 *   schemas:
 *     UserBody:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: Buy groceries
 *     UserUpdateBody:
 *       type: object
 *       description: At least one field required.
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         completed:
 *           type: boolean
 *     UserSummary:
 *       type: object
 *       properties:
 *         total:     { type: integer }
 *         completed: { type: integer }
 *         pending:   { type: integer }
 *
 * /api/users/summary:
 *   get:
 *     summary: Get a summary of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Aggregate counts of users
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/UserSummary' }
 */
/**
 * Creates and returns the User router with all routes wired to the
 * provided controller.
 */
export function createUserRouter(controller: UserController): Router {
  // `createBaseRouter` wires all standard CRUD routes.
  // It handles pagination validation on `GET /` automatically,
  // and injects the provided schemas for specific operations.
  const router = createBaseRouter(controller, {
    get: getUserSchema,
    create: createUserSchema,
    update: updateUserSchema,
    delete: deleteUserSchema,
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
  //   finalRouter.post('/', someAuthMiddleware, validate(createUserSchema), controller.create);
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
