import { UserModel } from '../models/User.js';
import config from '../config/settings.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/response.js';
let lastLoggedInEmail = null;
export const authController = {
    register: async (req, res, next) => {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return sendError(res, "Todos os campos são obrigatórios.", 400);
            }
            const normalizedEmail = email.toLowerCase().trim();
            const userExists = await UserModel.findOne({ email: normalizedEmail });
            if (userExists) {
                return sendError(res, "Este e-mail já possui cadastro.", 400);
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const identification = Math.floor(10000000 + Math.random() * 90000000).toString();
            const newUser = await UserModel.create({
                id: `u-${Date.now()}`,
                identification,
                name,
                email: normalizedEmail,
                password: hashedPassword,
                avatarUrl: `https://picsum.photos/seed/${identification}/200`,
                coverUrl: `https://picsum.photos/seed/${identification}-c/1080/1920`
            });
            return sendSuccess(res, newUser, "Usuário registrado com sucesso no banco real.", 201);
        }
        catch (error) {
            next(error);
        }
    },
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return sendError(res, "E-mail e senha são obrigatórios.", 400);
            const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
            if (!user)
                return sendError(res, "Usuário não encontrado.", 401);
            const isPasswordValid = await bcrypt.compare(password, String(user.password));
            if (!isPasswordValid)
                return sendError(res, "Senha incorreta.", 401);
            await UserModel.updateOne({ _id: user._id }, { isOnline: true });
            const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
            const userObject = user.toJSON();
            return sendSuccess(res, { user: userObject, token }, "Login realizado com sucesso.");
        }
        catch (error) {
            next(error);
        }
    },
    logout: async (req, res, next) => {
        try {
            const { userId } = req.body;
            if (userId) {
                await UserModel.findOneAndUpdate({ id: userId }, { isOnline: false });
            }
            return sendSuccess(res, null, "Sessão encerrada.");
        }
        catch (error) {
            next(error);
        }
    },
    saveLastEmail: (req, res) => {
        const { email } = req.body;
        if (email) {
            lastLoggedInEmail = email;
            return sendSuccess(res, null, "E-mail salvo.");
        }
        return sendError(res, "E-mail não fornecido.", 400);
    },
    getLastEmail: (req, res) => {
        return sendSuccess(res, { email: lastLoggedInEmail });
    },
};
