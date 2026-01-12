import jwt from 'jsonwebtoken';
import config from '../config/settings.js';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token de acesso não fornecido." });
    }
    const [, token] = authHeader.split(' ');
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.userId = decoded.userId;
        return next();
    }
    catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};
