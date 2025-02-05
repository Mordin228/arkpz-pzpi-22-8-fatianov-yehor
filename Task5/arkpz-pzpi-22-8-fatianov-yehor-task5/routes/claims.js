const express = require('express');
const sql = require('../config/db');
const router = express.Router();

/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: Отримати всі страхові заявки
 *     tags: [Claims]
 *     responses:
 *       200:
 *         description: Успешное получение заявок
 */
router.get('/', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM InsuranceClaims');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения заявок' });
    }
});

module.exports = router;
