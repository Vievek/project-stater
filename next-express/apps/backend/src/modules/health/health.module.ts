import { AppModule } from '../registry';
import { createHealthRouter } from './health.routes';

export function createHealthModule(): AppModule {
  return { prefix: '/api/health', router: createHealthRouter() };
}
