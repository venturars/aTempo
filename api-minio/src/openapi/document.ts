export const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'aTempo api-minio',
    description:
      'Persistencia de objetos en MinIO para la SDK (futura carpeta sdk/).',
    version: '1.0.0',
  },
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Comprueba el servicio y la conexión a MinIO',
        responses: {
          '200': {
            description: 'MinIO responde',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                  required: ['status'],
                },
              },
            },
          },
          '503': {
            description: 'MinIO no responde',
          },
        },
      },
    },
  },
} as const