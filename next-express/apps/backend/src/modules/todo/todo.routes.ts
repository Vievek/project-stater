import { Router } from 'express';
import { TodoController } from './todo.controller';
import { createBaseRouter } from '../../base-classes/base.routes';
import { createTodoSchema, updateTodoSchema, getTodoSchema, deleteTodoSchema } from './todo.schemas';
import { createAuthMiddleware } from '../../middlewares/auth';
import { rbacMiddleware } from '../../middlewares/rbac';
import { ITokenProvider } from '../../infrastructure/token-provider';

/**
 * @swagger
 * tags:
 *   - name: Todos
 *     description: Todo resource endpoints. Base path: /api/todos
 *
 * components:
 *   schemas:
 *     TodoBody:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: Buy groceries
 *     TodoUpdateBody:
 *       type: object
 *       description: At least one field required.
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         completed:
 *           type: boolean
 *     TodoSummary:
 *       type: object
 *       properties:
 *         total:     { type: integer }
 *         completed: { type: integer }
 *         pending:   { type: integer }
 *
 * /api/todos/summary:
 *   get:
 *     summary: Get a summary of all todos
 *     tags: [Todos]
 *     responses:
 *       200:
 *         description: Aggregate counts of todos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/TodoSummary' }
 */
/**
 * Creates and returns the Todo router with all routes wired to the
 * provided controller.
 *
 * Auth wiring (per-route, not global):
 *   - DELETE /api/todos (deleteAll) → requires JWT + ADMIN role
 *   - All other routes              → public (no auth required yet)
 *
 * To protect additional routes, add createAuthMiddleware(tokenProvider)
 * before the handler — see Option 2 in the comment block below.
 */
export function createTodoRouter(controller: TodoController, tokenProvider?: ITokenProvider): Router {
  // `createBaseRouter` wires all standard CRUD routes.
  // It handles pagination validation on `GET /` automatically,
  // and injects the provided schemas for specific operations.
  const router = createBaseRouter(controller, {
    get: getTodoSchema,
    create: createTodoSchema,
    update: updateTodoSchema,
    delete: deleteTodoSchema,
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
  //   finalRouter.post('/', someAuthMiddleware, validate(createTodoSchema), controller.create);
  // ---------------------------------------------------------------------------

  const finalRouter = Router();

  // Custom endpoint: mount before /:id to prevent route collision
  finalRouter.get('/summary', controller.getSummary);

  // Protected routes — ADMIN only for deleteAll (example of per-route RBAC)
  // tokenProvider is optional so the module remains backward-compatible when
  // no auth is wired (e.g., during integration tests without a full DI tree).
  if (tokenProvider) {
    const authMiddleware = createAuthMiddleware(tokenProvider);
    finalRouter.delete('/', authMiddleware, rbacMiddleware('ADMIN'), controller.deleteAll);
  } else {
    finalRouter.delete('/', controller.deleteAll);
  }

  finalRouter.use('/', router);

  return finalRouter;
}
