const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

/**
 * Middleware для аутентификации по JWT
 */
function authenticateToken(req, res, next) {
    if (req.path === '/api/users/login' || req.path === '/api/users/register' || req.path === '/api/admin/login') {
        return next();
    }

    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: '⛔ Доступ запрещён. Требуется авторизация.' });
    }

    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '⛔ Неверный токен. Авторизуйтесь снова.' });
        }
        req.user = user;
        next();
    });
}

/**
 * Middleware для проверки роли
 */
function authorizeRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.Role)) {
            return res.status(403).json({ error: '⛔ Доступ запрещён. Недостаточно прав.' });
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRole };
