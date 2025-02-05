require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false, // Используется для Windows Auth
        trustServerCertificate: true // Нужно для локального подключения
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Подключение к SQL Server успешно');
        return pool;
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к SQL Server:', err);
    });

module.exports = { sql, poolPromise };