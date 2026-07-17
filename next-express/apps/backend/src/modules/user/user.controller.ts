import { ApiResponse } from "../../utils/ApiResponse";
import { UserService } from "./user.service";
import { BaseController } from "../../base-classes/base.controller";
import { User } from "./user.types";
import { asyncHandler } from "../../utils/asyncHandler";
import { logger } from "../../utils/logger";

export class UserController extends BaseController<User, UserService> {
  // Inherit all methods from BaseController.
  // BaseController's create/delete use 201/204 already,
  // so no overrides are needed for basic functionality!

  // Example endpoint using the cached service method
  getSummary = asyncHandler(async (req, res) => {
    logger.info(`[${this.constructor.name}.getSummary] Fetching user summary`);
    const summary = await this.service.getUserSummary();
    res.json(ApiResponse.success(summary));
  });
}
