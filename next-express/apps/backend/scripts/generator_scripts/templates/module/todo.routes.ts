import { Router } from 'express';
import { TodoController } from './todo.controller';
import { createBaseRouter } from '../../base-classes/base.routes';
import { createTodoSchema, updateTodoSchema, getTodoSchema, deleteTodoSchema } from './todo.schemas';

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
import { ITokenProvider } from '../../infrastructure/token-provider';
import { createAuthMiddleware } from '../../middlewares/auth';
import { rbacMiddleware } from '../../middlewares/rbac';

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
  
  const finalRouter = Router();
  finalRouter.get('/summary', controller.getSummary);

  if (tokenProvider) {
    const authMiddleware = createAuthMiddleware(tokenProvider);
    finalRouter.delete('/', authMiddleware, rbacMiddleware('ADMIN'), controller.deleteAll);
  } else {
    finalRouter.delete('/', controller.deleteAll);
  }

  finalRouter.use('/', router);

  return finalRouter;
}
