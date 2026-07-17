import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Validates request data against a Zod schema.
 * In Express 5, req.query is read-only, so validated data is stored
 * in res.locals.validated for downstream controllers to consume.
 * req.body is still mutated directly as it is writable.
 */
export const validate = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize the request
      // .parseAsync() automatically strips unknown keys if schema is defined correctly
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // req.body is writable — mutate directly
      if (validatedData.body) req.body = validatedData.body;

      // Express 5: req.query and req.params are read-only getters.
      // Store validated versions in res.locals for controllers to read.
      res.locals.validated = {
        query: validatedData.query ?? req.query,
        params: validatedData.params ?? req.params,
      };

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(ApiResponse.error('Validation Error', error.issues));
        return;
      }
      next(error);
    }
  };
};
