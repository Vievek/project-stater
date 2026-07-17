/**
 * Module Registry — the single extension point for adding new modules.
 *
 * OCP: This system is open for extension (add entries here) and closed for
 * modification (container.ts and app.ts never change when you add a module).
 *
 * To add a new module:
 *   1. Create your module factory (e.g. `createUserModule`)
 *   2. Import it below
 *   3. Add it to the `moduleFactories` array
 *
 * That's it — container.ts and app.ts remain untouched.
 */
import { Router } from "express";
import { AppDb } from "../infrastructure/db";
import { ICacheService } from "../base-classes/base.repository";
import { ITransactionManager } from "../utils/transaction-manager";

/** Shared dependencies injected into every module factory. */
export interface AppDeps {
  db: AppDb;
  cacheService: ICacheService;
  transactionManager: ITransactionManager<AppDb>;
}

/** The value every module factory must return. */
export interface AppModule {
  /** Express route prefix, e.g. '/api/todos' */
  prefix: string;
  router: Router;
}

// ─── Import module factories ─────────────────────────────────────────────────
import { createTodoModule } from "./todo/todo.module";
import { createHealthModule } from "./health/health.module";
import { createUserModule } from "./user/user.module";

// ─── Register modules here ───────────────────────────────────────────────────
export const moduleFactories: Array<(deps: AppDeps) => AppModule> = [
  createHealthModule,
  createTodoModule,
    createUserModule
];
