const express = require('express');
const sql = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth'); // ✅ Добавлен импорт

const router = express.Router();

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Получение данных здоровья пользователей
 *     tags: [Metrics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Успешное получение данных
 *       403:
 *         description: ⛔ Недостаточно прав
 */
router.get('/', authenticateToken, authorizeRole(['Manager', 'Admin']), async (req, res) => {
    try {
        // Менеджер видит только тех пользователей, у которых AdminAccess = 1
        const result = await sql.query`
            SELECT hm.* FROM HealthMetrics hm
            JOIN Users u ON hm.DeviceID = (SELECT DeviceID FROM IoTDevices WHERE UserID = u.UserID)
            WHERE u.AdminAccess = 1
        `;

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения данных', details: err.message });
    }
});

module.exports = router;



