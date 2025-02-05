const express = require('express');
const sql = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/iot/device:
 *   post:
 *     summary: Додавання нового IoT-пристрою
 *     tags: [IoT]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               SerialNumber:
 *                 type: string
 *               UserID:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Устройство успешно добавлено
 */
router.post('/device', authenticateToken, async (req, res) => {
    const { SerialNumber, UserID } = req.body;
    try {
        const result = await sql.query`
            INSERT INTO IoTDevices (SerialNumber, UserID) 
            VALUES (${SerialNumber}, ${UserID})
        `;
        res.json({ status: 'Устройство успешно добавлено' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка добавления устройства', details: err.message });
    }
});

/**
 * @swagger
 * /api/iot/device/{deviceId}:
 *   delete:
 *     summary: Видалення IoT-пристрою (тільки менеджер чи адмін)
 *     tags: [IoT]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Устройство успешно удалено
 *       403:
 *         description: ⛔ Недостаточно прав
 */
router.delete('/device/:deviceId', authenticateToken, authorizeRole(['Manager', 'Admin']), async (req, res) => {
    const { deviceId } = req.params;
    try {
        await sql.query`
            DELETE FROM IoTDevices WHERE DeviceID = ${deviceId}
        `;
        res.json({ status: 'Устройство успешно удалено' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления устройства', details: err.message });
    }
});

module.exports = router;
