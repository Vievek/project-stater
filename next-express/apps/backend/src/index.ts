import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
// DB and cache connections are bootstrapped transitively via container.ts
// through infrastructure/db.ts and infrastructure/cache.ts

const PORT = env.PORT || 4000;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
