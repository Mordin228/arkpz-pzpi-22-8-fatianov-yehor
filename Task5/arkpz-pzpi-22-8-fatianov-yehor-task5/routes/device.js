const express = require('express');
const sql = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/device/settings:
 *   patch:
 *     summary: Змінити параметри пристрою
 *     tags: [Device]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               DeviceID:
 *                 type: integer
 *               Settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Налаштування оновлені
 */
router.patch('/settings', authenticateToken, async (req, res) => {
    const { DeviceID, Settings } = req.body;
    try {
        await sql.query`
            UPDATE IoTDevices SET Settings = ${JSON.stringify(Settings)} WHERE DeviceID = ${DeviceID}
        `;
        res.json({ status: 'Налаштування оновлені' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка оновлення налаштувань', details: err.message });
    }
});

module.exports = router;
