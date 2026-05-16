import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Office Care API Documentation',
      version: '1.0.0',
      description: 'Hệ thống quản lý phòng khám Vật lý trị liệu - Office Care',
      contact: {
        name: 'Antigravity AI Assistant',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/schemas/*.ts'], // Đường dẫn tới các file chứa JSDoc
};

export const specs = swaggerJsdoc(options);
