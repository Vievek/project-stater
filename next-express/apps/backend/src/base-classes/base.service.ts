import { BaseRepository } from "./base.repository";
import { AppError } from "../utils/AppError";
import { QueryOptions } from "../utils/query-builder";
import { logger } from "../utils/logger";

export abstract class BaseService<T, Repo extends BaseRepository<T>> {
  constructor(protected readonly repository: Repo) {}

  async getAll(options?: QueryOptions): Promise<T[]> {
    logger.info(`[${this.constructor.name}.getAll] Fetching all records`, {
      options,
    });
    return this.repository.findAll(options);
  }

  async getById(id: string, notFoundMessage = "Record not found"): Promise<T> {
    logger.info(`[${this.constructor.name}.getById] Fetching by id`, { id });
    const record = await this.repository.findById(id);
    if (!record) throw new AppError(notFoundMessage, 404);
    return record;
  }

  async create(data: unknown): Promise<T> {
    logger.info(`[${this.constructor.name}.create] Creating data`, { data });
    return this.repository.create(data);
  }

  async update(
    id: string,
    data: unknown,
    notFoundMessage?: string,
  ): Promise<T> {
    logger.info(`[${this.constructor.name}.update] Updating by id`, {
      id,
      data,
    });
    return this.repository.updateOrThrow(id, data, notFoundMessage);
  }

  async delete(id: string, notFoundMessage?: string): Promise<void> {
    logger.info(`[${this.constructor.name}.delete] Deleting by id`, { id });
    return this.repository.deleteOrThrow(id, notFoundMessage);
  }

  async deleteAll(): Promise<void> {
    logger.info(`[${this.constructor.name}.deleteAll] Deleting all records`);
    return this.repository.deleteAll();
  }
}
