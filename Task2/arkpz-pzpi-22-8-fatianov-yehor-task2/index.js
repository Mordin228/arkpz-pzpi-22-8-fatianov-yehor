require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const mqtt = require('mqtt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

app.use(express.json());
app.use(cors());

// Подключение к MS SQL
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false }
};

async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log("✅ Подключено к MS SQL");
    } catch (err) {
        console.error("❌ Ошибка подключения к БД:", err);
    }
}
connectDB();

// MQTT Клиент
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org');
mqttClient.on('connect', () => console.log('✅ Подключено к MQTT'));
mqttClient.on('error', err => console.error('❌ Ошибка MQTT:', err));

// Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MedProtect API',
            version: '1.0.0',
            description: 'API для медичного страхування',
        },
        servers: [{ url: 'http://localhost:3000' }],
    },
    apis: ['./index.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Успешное получение списка
 */
app.get('/api/users', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Users');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка запроса к БД' });
    }
});

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               FullName:
 *                 type: string
 *               Email:
 *                 type: string
 *               PasswordHash:
 *                 type: string
 *               DateOfBirth:
 *                 type: string
 *                 format: date
 *               Gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешная регистрация
 */
app.post('/api/register', async (req, res) => {
    let { FullName, Email, PasswordHash, DateOfBirth, Gender } = req.body;

    // Приведение Gender к правильному формату
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (!allowedGenders.includes(Gender)) {
        return res.status(400).json({ error: 'Неверное значение Gender. Разрешены: Male, Female, Other' });
    }

    try {
        // Проверка, существует ли пользователь с таким Email
        const checkUser = await sql.query`SELECT * FROM Users WHERE Email = ${Email}`;
        if (checkUser.recordset.length > 0) {
            return res.status(409).json({ error: 'Пользователь с таким Email уже существует' });
        }

        // Вставка нового пользователя
        await sql.query`
            INSERT INTO Users (FullName, Email, PasswordHash, DateOfBirth, Gender) 
            VALUES (${FullName}, ${Email}, ${PasswordHash}, ${DateOfBirth}, ${Gender})`;

        res.json({ status: 'Пользователь зарегистрирован' });
    } catch (err) {
        console.error("Ошибка SQL при регистрации:", err);
        res.status(500).json({ error: 'Ошибка регистрации', details: err.message });
    }
});




/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: Получить все страховые заявки
 *     tags: [Claims]
 *     responses:
 *       200:
 *         description: Успешное получение заявок
 */
app.get('/api/claims', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM InsuranceClaims');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения заявок' });
    }
});

/**
 * @swagger
 * /api/mqtt/publish:
 *   post:
 *     summary: Отправить данные в MQTT
 *     tags: [MQTT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Сообщение отправлено
 */
app.post('/api/mqtt/publish', (req, res) => {
    if (!mqttClient.connected) {
        return res.status(500).json({ error: 'MQTT не подключен' });
    }
    const { topic, message } = req.body;
    mqttClient.publish(topic, message);
    res.json({ status: 'Сообщение отправлено' });
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *       401:
 *         description: Неверный Email или пароль
 */
app.post('/api/login', async (req, res) => {
    const { Email, Password } = req.body;
    try {
        const result = await sql.query`SELECT UserID, Email, PasswordHash FROM Users WHERE Email = ${Email}`;

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Неверный Email или пароль' });
        }

        const user = result.recordset[0];

        if (user.PasswordHash !== Password) {
            return res.status(401).json({ error: 'Неверный Email или пароль' });
        }

        const token = jwt.sign({ UserID: user.UserID, Email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error("Ошибка авторизации:", err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});


// Запуск сервера
app.listen(3000, () => {
    console.log('🚀 Сервер запущен: http://localhost:3000');
    console.log('📄 Swagger UI: http://localhost:3000/api-docs');
});
