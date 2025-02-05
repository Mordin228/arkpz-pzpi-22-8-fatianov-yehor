const express = require('express');
const sql = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth'); // ✅ Исправленный импорт
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const jwt = require('jsonwebtoken'); 
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Получение списка пользователей с их устройствами
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Успешное получение списка пользователей
 */
router.get('/users', authenticateToken, authorizeRole(['Manager', 'Admin']), async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT u.UserID, u.FullName, u.Email, u.Gender, u.RegistrationDate, d.DeviceID, d.SerialNumber 
            FROM Users u
            LEFT JOIN IoTDevices d ON u.UserID = d.UserID
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка запроса к БД', details: err.message });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Удаление пользователя по ID
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пользователь удален
 */
router.delete('/users/:id', authenticateToken, authorizeRole(['Manager', 'Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM Users WHERE UserID = ${id}`;
        res.json({ status: 'Пользователь удален' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления пользователя', details: err.message });
    }
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Удаление пользователя (только для администратора)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пользователь успешно удален
 *       403:
 *         description: ⛔ Недостаточно прав
 */
router.delete('/users/:userId', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { userId } = req.params;
    try {
        await sql.query`
            DELETE FROM Users WHERE UserID = ${userId}
        `;
        res.json({ status: 'Пользователь успешно удален' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления пользователя', details: err.message });
    }
});


/**
 * @swagger
 * /api/admin/claims/approve:
 *   post:
 *     summary: Одобрение или отклонение страховых выплат
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ClaimID:
 *                 type: integer
 *               Status:
 *                 type: string
 *                 enum: ["Approved", "Denied"]
 *     responses:
 *       200:
 *         description: Страховая выплата обновлена
 */
router.post('/claims/approve', authenticateToken, authorizeRole(['Manager', 'Admin']), async (req, res) => {
    const { ClaimID, Status } = req.body;
    try {
        await sql.query`UPDATE InsuranceClaims SET Status = ${Status} WHERE ClaimID = ${ClaimID}`;
        res.json({ status: 'Страховая выплата обновлена' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обработки страховой выплаты', details: err.message });
    }
});

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Авторизация менеджера или администратора
 *     tags: [Admin]
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
        const result = await sql.query`SELECT ManagerID, Email, PasswordHash, Role FROM Managers WHERE Email = ${Email}`;

        if (result.recordset.length === 0 || result.recordset[0].PasswordHash !== Password) {
            return res.status(401).json({ error: 'Неверный Email или пароль' });
        }

        const manager = result.recordset[0];

        // Генерация JWT-токена с ролью
        const token = jwt.sign(
            { ManagerID: manager.ManagerID, Email: manager.Email, Role: manager.Role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка авторизации', details: err.message });
    }
});

module.exports = router;
