const express = require('express');
const sql = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/alerts/critical:
 *   post:
 *     summary: Сповіщення користувача про критичний стан
 *     tags: [Alerts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               UserID:
 *                 type: integer
 *               Message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Сповіщення відправлено
 */
router.post('/critical', authenticateToken, async (req, res) => {
    const { UserID, Message } = req.body;
    try {
        await sql.query`
            INSERT INTO Notifications (UserID, NotificationDate, Message) 
            VALUES (${UserID}, GETDATE(), ${Message})
        `;
        res.json({ status: 'Сповіщення відправлено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сповіщення', details: err.message });
    }
});

/**
 * @swagger
 * /api/alerts/manager:
 *   post:
 *     summary: Сповіщення менеджера про виплату
 *     tags: [Alerts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ManagerID:
 *                 type: integer
 *               Message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Повідомлення менеджеру відправлено
 */
router.post('/manager', authenticateToken, async (req, res) => {
    const { ManagerID, Message } = req.body;
    try {
        await sql.query`
            INSERT INTO Notifications (UserID, NotificationDate, Message) 
            VALUES (${ManagerID}, GETDATE(), ${Message})
        `;
        res.json({ status: 'Повідомлення менеджеру відправлено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка надсилання повідомлення', details: err.message });
    }
});

module.exports = router;
