import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Starter API',
      version: '1.0.0',
      description:
        'REST API documentation. Standard CRUD endpoints (GET /, GET /:id, POST /, PUT /:id, DELETE /:id) are available on every module via the base router.',
    },
    components: {
      schemas: {
        PaginationQuery: {
          type: 'object',
          properties: {
            page:     { type: 'integer', default: 1, description: 'Page number' },
            pageSize: { type: 'integer', default: 10, description: 'Items per page' },
          },
        },
        IdParam: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Resource UUID' },
          },
          required: ['id'],
        },
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { description: 'Response payload' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  // Scan all route files across all modules for @swagger JSDoc blocks
  apis: [
    path.join(__dirname, 'modules/**/*.routes.ts'),
    // Add future module route files here automatically via glob
  ],
};

const swaggerSpec = swaggerJSDoc(options);

// Programmatically build base CRUD paths for each module in src/modules
import fs from 'fs';
const modulesDir = path.join(__dirname, 'modules');
const moduleNames = fs.readdirSync(modulesDir).filter(f => fs.statSync(path.join(modulesDir, f)).isDirectory() && f !== 'health');

const generateCrudPaths = (moduleName: string) => {
  const prefix = `/api/${moduleName}s`; // Basic pluralization
  const tag = moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + 's';
  
  return {
    [prefix]: {
      get: {
        summary: `List all ${tag} (paginated)`,
        tags: [tag],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer', default: 10 } }
        ],
        responses: { 200: { description: 'Paginated list', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } }
      },
      post: {
        summary: `Create a new ${moduleName}`,
        tags: [tag],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } }
      },
      delete: {
        summary: `Delete all ${tag}`,
        tags: [tag],
        responses: { 204: { description: 'Deleted' } }
      }
    },
    [`${prefix}/{id}`]: {
      get: {
        summary: `Get ${moduleName} by ID`,
        tags: [tag],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Single resource', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } }, 404: { description: 'Not found' } }
      },
      put: {
        summary: `Update ${moduleName} by ID`,
        tags: [tag],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Updated resource', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } }
      },
      delete: {
        summary: `Delete ${moduleName} by ID`,
        tags: [tag],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } }
      }
    }
  };
};

// Merge dynamically generated paths
const spec = swaggerSpec as any;
if (!spec.paths) spec.paths = {};
moduleNames.forEach(mod => {
  const crudPaths = generateCrudPaths(mod);
  Object.assign(spec.paths, crudPaths);
});

export { swaggerSpec };
