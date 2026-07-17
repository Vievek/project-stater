import { PrismaRelationAdapter } from '../../infrastructure/relation-adapter';
import { Todo } from './todo.types';
import { AppDeps, AppModule } from '../registry';
import { TodoRepository } from './todo.repository';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { createTodoRouter } from './todo.routes';

/**
 * Todo module factory.
 *
 * Wires the full dependency chain for the todo feature and returns a mounted
 * router with its prefix. The factory receives all infrastructure dependencies
 * via injection — it never imports from config/ or infrastructure/ directly.
 */
export function createTodoModule(deps: AppDeps): AppModule {
  const relations  = new PrismaRelationAdapter<Todo>(deps.db.todo);
  const repository = new TodoRepository(deps.db.todo, deps.cacheService, relations);
  const service     = new TodoService(repository, deps.cacheService, deps.transactionManager);
  const controller  = new TodoController(service);
  const router      = createTodoRouter(controller, deps.tokenProvider);

  return { prefix: '/api/todos', router };
}
