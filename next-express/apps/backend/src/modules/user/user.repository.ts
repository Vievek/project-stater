import { IRelationAdapter } from "../../infrastructure/relation-adapter";
import {
  BaseRepository,
  IDbClient,
  ICacheService,
} from "../../base-classes/base.repository";
import { QueryOptions } from "../../utils/query-builder";
import { User } from "./user.types";
import { userQueryConfig } from "./user.query-config";
import { logger } from "../../utils/logger";

export class UserRepository extends BaseRepository<User> {
  constructor(
    db: IDbClient<User>,
    cacheService: ICacheService,
    relations?: IRelationAdapter<User>,
  ) {
    super(
      db,
      "user",
      { needCache: true, ttlSeconds: 60 },
      cacheService,
      userQueryConfig,
      relations,
    );
  }

  // Override findById to enable caching with a custom TTL for this repository
  async findById(id: string): Promise<User | null> {
    logger.info(
      `[${this.constructor.name}.findById] Finding by id with custom TTL`,
      { id },
    );
    return this.cacheManager.withCache(
      "repo:findById",
      id,
      async () => {
        return this.relations
          ? this.relations.findUniqueWithRelations(id, ["todos"])
          : this.db.findUnique({ where: { id } });
      },
      30,
    );
  }

  async findAllLatest(options?: QueryOptions): Promise<User[]> {
    logger.info(`[${this.constructor.name}.findAllLatest] Finding all latest`, {
      options,
    });
    return this.cacheManager.withCache(
      "repo:findAllLatest",
      options ? JSON.stringify(options) : undefined,
      async () => {
        if (this.queryBuilder && options) {
          const args = this.queryBuilder.build(options);
          return this.db.findMany(args);
        }
        return this.relations
          ? this.relations.findManyWithRelations(undefined, ["todos"])
          : this.db.findMany();
      },
    );
  }

  /** Look up a user by their email address (used for login and duplicate-email checks). */
  async findByEmail(email: string): Promise<User | null> {
    logger.info(`[${this.constructor.name}.findByEmail] Finding by email`);
    return this.db.findUnique({ where: { email } });
  }
}

