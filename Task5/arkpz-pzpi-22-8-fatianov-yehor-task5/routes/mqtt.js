const express = require('express');
const sql = require('../config/db');
const mqtt = require('mqtt');

const router = express.Router();
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

let latestMetrics = {}; // Глобальная переменная для хранения последних данных

mqttClient.on('connect', () => {
    console.log('✅ Подключено к MQTT брокеру');
    mqttClient.subscribe('wokwi/device/1/data', (err) => {
        if (!err) {
            console.log('📡 Подписка на топик: wokwi/device/1/data');
        } else {
            console.error('❌ Ошибка подписки:', err);
        }
    });
});

mqttClient.on('message', async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        console.log(`📩 Получены данные:`, payload);

        const { DeviceID, HeartRate, Steps, CaloriesBurned } = payload;

        if (DeviceID === undefined || HeartRate === undefined || Steps === undefined || CaloriesBurned === undefined) {
            console.log('⛔ Ошибка: некорректные данные');
            return;
        }

        // Сохранение данных в БД
        await sql.query`
            INSERT INTO HealthMetrics (DeviceID, HeartRate, Steps, CaloriesBurned, Timestamp) 
            VALUES (${DeviceID}, ${HeartRate}, ${Steps}, ${CaloriesBurned}, GETDATE())
        `;

        // 🔹 Обновляем глобальную переменную latestMetrics
        latestMetrics = { DeviceID, HeartRate, Steps, CaloriesBurned, Timestamp: new Date().toISOString() };

        console.log('✅ Данные сохранены в БД и обновлены в latestMetrics');

        // 🚨 Проверяем ЧСС и отправляем уведомление при высоком пульсе (>120)
        if (HeartRate > 120) {
            await sql.query`
                INSERT INTO Notifications (UserID, NotificationDate, Message)
                VALUES (${DeviceID}, GETDATE(), '⚠ Високий пульс: ${HeartRate} ударів/хв! Зверніться до лікаря.')
            `;

            console.log(`🚨 Уведомление отправлено: Високий пульс - ${HeartRate} ударов в минуту!`);
        }
    } catch (err) {
        console.error('❌ Ошибка обработки MQTT:', err.message);
    }
});

/**
 * @swagger
 * /api/metrics/latest:
 *   get:
 *     summary: Отримати останні дані з IoT-пристрою (Wokwi)
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Успешное получение данных
 *       404:
 *         description: Нет данных от устройства
 */
router.get('/latest', async (req, res) => {
    if (!latestMetrics || Object.keys(latestMetrics).length === 0) {
        return res.status(404).json({ error: 'Нет данных от устройства' });
    }
    res.json(latestMetrics);
});

module.exports = router;
