import { Router } from 'express';
import { TodoController } from './todo.controller';
import { createBaseRouter } from '../../base-classes/base.routes';
import { createTodoSchema, updateTodoSchema, getTodoSchema, deleteTodoSchema } from './todo.schemas';
import { ITokenProvider } from "../../infrastructure/token-provider";
import { createAuthMiddleware } from "../../middlewares/auth";
import { rbacMiddleware } from "../../middlewares/rbac";

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
 */
export function createTodoRouter(controller: TodoController, tokenProvider?: ITokenProvider): Router {
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
  //   finalRouter.post('/', someAuthMiddleware, validate(createTagSchema), controller.create);
  // ---------------------------------------------------------------------------

  // Mount our custom endpoint
  // Note: We mount it on a specific path BEFORE or AFTER base routes?
  // '/summary' must be routed carefully if '/:id' intercepts it,
  // but since we are attaching to the returned router, it's safer to mount BEFORE if possible.
  // However, createBaseRouter already mounted `/:id`. Express evaluates in order.
  // If we want '/summary' to not be treated as `/:id`, we should mount it first.


  const finalRouter = Router();
  finalRouter.get("/summary", controller.getSummary);

  if (tokenProvider) {
    const authMiddleware = createAuthMiddleware(tokenProvider);
    finalRouter.get("/", controller.getAll); // but need to do the validation by own 
    finalRouter.delete(
      "/",
      authMiddleware,
      rbacMiddleware("ADMIN"),
      controller.deleteAll,
    );
    finalRouter.use(authMiddleware);
  }

  finalRouter.use("/", router);

  return finalRouter;
}
