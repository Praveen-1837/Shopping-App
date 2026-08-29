import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoMarket Sustainable Marketplace & Learning Engine API',
      version: '1.0.0',
      description:
        'Production-grade RESTful API endpoints for multi-vendor eco-commerce, producer traceability, AI shopping assistant, and learning engine.',
      contact: {
        name: 'EcoMarket Engineering Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk JWT session token supplied in Authorization header',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            category: { type: 'string' },
            stock: { type: 'integer' },
            images: { type: 'array', items: { type: 'string' } },
            sustainabilityTags: { type: 'array', items: { type: 'string' } },
            traceabilityStages: { type: 'array', items: { type: 'object' } },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            durationMins: { type: 'integer' },
            category: { type: 'string' },
            certificate: { type: 'boolean' },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
