const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false }
};

async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log("✅ Подключено к MS SQL");
    } catch (err) {
        console.error("❌ Ошибка подключения к БД:", err);
    }
}

connectDB();
module.exports = sql;
