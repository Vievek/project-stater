import { ApiResponse } from "../../utils/ApiResponse";
import { CategoryService } from "./category.service";
import { BaseController } from "../../base-classes/base.controller";
import { Category } from "./category.types";
import { asyncHandler } from "../../utils/asyncHandler";
import { logger } from "../../utils/logger";

export class CategoryController extends BaseController<Category, CategoryService> {
  // Inherit all methods from BaseController.
  // BaseController's create/delete use 201/204 already,
  // so no overrides are needed for basic functionality!

  // Example endpoint using the cached service method
  getSummary = asyncHandler(async (req, res) => {
    logger.info(`[${this.constructor.name}.getSummary] Fetching category summary`);
    const summary = await this.service.getCategorySummary();
    res.json(ApiResponse.success(summary));
  });
}
