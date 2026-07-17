import { ApiResponse } from "../../utils/ApiResponse";
import { TodoService } from "./todo.service";
import { BaseController } from "../../base-classes/base.controller";
import { Todo } from "./todo.types";
import { asyncHandler } from "../../utils/asyncHandler";
import { logger } from "../../utils/logger";

export class TodoController extends BaseController<Todo, TodoService> {
  // Inherit all methods from BaseController.
  // BaseController's create/delete use 201/204 already,
  // so no overrides are needed for basic functionality!

  // Example endpoint using the cached service method
  getSummary = asyncHandler(async (req, res) => {
    logger.info(`[${this.constructor.name}.getSummary] Fetching todo summary`);
    const summary = await this.service.getTodoSummary();
    res.json(ApiResponse.success(summary));
  });
}
