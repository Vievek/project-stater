import { ApiResponse } from "../../utils/ApiResponse";
import { TagService } from "./tag.service";
import { BaseController } from "../../base-classes/base.controller";
import { Tag } from "./tag.types";
import { asyncHandler } from "../../utils/asyncHandler";
import { logger } from "../../utils/logger";

export class TagController extends BaseController<Tag, TagService> {
  // Inherit all methods from BaseController.
  // BaseController's create/delete use 201/204 already,
  // so no overrides are needed for basic functionality!

  // Example endpoint using the cached service method
  getSummary = asyncHandler(async (req, res) => {
    logger.info(`[${this.constructor.name}.getSummary] Fetching tag summary`);
    const summary = await this.service.getTagSummary();
    res.json(ApiResponse.success(summary));
  });
}
