import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { logger } from './utils/logger';
import { requestContextMiddleware } from './middlewares/request-context';
import { errorHandler } from './middlewares/error-handler';
import { AppError } from './utils/AppError';
import { modules } from './container';
import { httpLogger } from './middlewares/http-logger';
import { swaggerSpec } from './swagger';

const app = express();

// Security and basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request UUID tracking
app.use(requestContextMiddleware);

// HTTP Logging
app.use(httpLogger);

// API Docs — interactive Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes — auto-mounted from the module registry.
// Adding a new module never requires editing this file.
modules.forEach(({ prefix, router }) => {
  app.use(prefix, router);
});

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global Error Handler
app.use(errorHandler);

export { app };

