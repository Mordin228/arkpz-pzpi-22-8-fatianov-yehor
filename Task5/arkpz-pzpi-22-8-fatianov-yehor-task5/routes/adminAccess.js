const express = require('express');
const sql = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/admin/access:
 *   post:
 *     summary: Надати доступ адміністратору
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
 *               UserID:
 *                 type: integer
 *               Access:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Доступ оновлено
 */
router.post('/access', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { UserID, Access } = req.body;
    try {
        await sql.query`
            UPDATE Users SET AdminAccess = ${Access ? 1 : 0} WHERE UserID = ${UserID}
        `;
        res.json({ status: 'Доступ оновлено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка оновлення доступу' });
    }
});


module.exports = router;
