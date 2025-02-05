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
 *     summary: Получить список всех пользователей
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
 * /api/users/login:
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
 */
router.post('/login', async (req, res) => {
    const { Email, Password } = req.body;
    try {
        const result = await sql.query`SELECT UserID, Email, PasswordHash FROM Users WHERE Email = ${Email}`;

        if (result.recordset.length === 0 || result.recordset[0].PasswordHash !== Password) {
            return res.status(401).json({ error: 'Неверный Email или пароль' });
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
        res.status(500).json({ error: 'Ошибка авторизации', details: err.message });
    }
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Получить данные своего профиля
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
            SELECT UserID, FullName, Email, DateOfBirth, Gender, RegistrationDate, AdminAccess 
            FROM Users WHERE UserID = ${req.user.UserID}
        `;
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения данных', details: err.message });
    }
});

module.exports = router;
