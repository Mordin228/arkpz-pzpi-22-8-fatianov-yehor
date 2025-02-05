require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { authenticateToken } = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());

// Подключаем Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Подключаем middleware аутентификации
app.use(authenticateToken);

// Подключаем маршруты
app.use('/api/users', require('./routes/users'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/mqtt', require('./routes/mqtt'));
app.use('/api/metrics', require('./routes/mqtt')); // Добавляем поддержку API /api/metrics/latest
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/admin', require('./routes/admin')); // ✅ Добавили админские маршруты
app.use('/api/iot', require('./routes/iot'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/device', require('./routes/device'));
app.use('/api/admin', require('./routes/adminAccess'));

app.listen(3000, () => {
    console.log('🚀 Сервер запущен: http://localhost:3000');
    console.log('📄 Swagger UI: http://localhost:3000/api-docs');
});
