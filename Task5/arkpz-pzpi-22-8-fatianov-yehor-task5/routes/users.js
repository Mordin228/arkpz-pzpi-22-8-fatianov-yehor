const express = require('express');
const sql = require('../config/db');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth'); // ✅ Добавлен импорт
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Отримати список усіх користувачів
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Успешное получение списка
 */
router.get('/', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Users');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка запроса к БД' });
    }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Реєстрація нового користувача
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
 *               Password:
 *                 type: string
 *               DateOfBirth:
 *                 type: string
 *               Gender:
 *                 type: string
 *     responses:
 *       201:
 *         description: Користувач успішно зареєстрований
 *       400:
 *         description: Неправильний запит
 */
router.post('/register', async (req, res) => {
    const { FullName, Email, Password, DateOfBirth, Gender } = req.body;

    try {
        // Проверяем, существует ли уже такой Email
        const existingUser = await sql.query`SELECT Email FROM Users WHERE Email = ${Email}`;
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Користувач з таким Email вже існує' });
        }

        // Записываем нового пользователя в базу
        await sql.query`
    INSERT INTO Users (FullName, Email, PasswordHash, DateOfBirth, Gender, RegistrationDate)
    VALUES (${FullName}, ${Email}, ${Password}, TRY_CAST(${DateOfBirth} AS DATE), ${Gender}, GETDATE())
`;


        res.status(201).json({ message: 'Користувач успішно зареєстрований' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка реєстрації', details: err.message });
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Авторизація користувача
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
 */
router.post('/login', async (req, res) => {
    const { Email, Password } = req.body;
    try {
        const result = await sql.query`SELECT UserID, Email, PasswordHash FROM Users WHERE Email = ${Email}`;

        if (result.recordset.length === 0 || result.recordset[0].PasswordHash !== Password) {
            return res.status(401).json({ error: 'Невірний Email або пароль' });
        }

        const user = result.recordset[0];

        // Генерация JWT-токена
        const token = jwt.sign(
            { UserID: user.UserID, Email: user.Email },
            JWT_SECRET,
            { expiresIn: '1h' } // Токен действителен 1 час
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Помилка авторизації', details: err.message });
    }
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Отримати дані свого профілю
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Успешное получение данных пользователя
 *       401:
 *         description: ⛔ Требуется авторизация
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await sql.query`
            SELECT UserID, FullName, Email, DateOfBirth, Gender, RegistrationDate 
            FROM Users WHERE UserID = ${req.user.UserID}
        `;
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка отримання даних', details: err.message });
    }
});

module.exports = router;
