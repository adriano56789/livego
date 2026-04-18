import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'livego-secret-key';

export interface AuthRequest extends Request {
    user?: { id: string, _id: string }; // Custom property to hold user info
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded: any = jwt.verify(token, JWT_SECRET);
            req.user = { id: decoded.id, _id: decoded._id };
            return next();
        } catch (error) {
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

export const getUserIdFromToken = (req: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        return decoded.id;
    } catch {
        return null;
    }
};
