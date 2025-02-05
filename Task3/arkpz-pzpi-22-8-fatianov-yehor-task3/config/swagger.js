const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MedProtect API',
            version: '1.0.0',
            description: 'API для медичного страхування',
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ BearerAuth: [] }], // 📌 Swagger требует авторизацию, но показывает маршруты
    },
    apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(swaggerOptions);
