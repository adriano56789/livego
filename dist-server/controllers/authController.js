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
            if (!email)
                return sendError(res, "E-mail é obrigatório.", 400);
            // Normaliza o e-mail
            const normalizedEmail = email.toLowerCase().trim();
            // Tenta encontrar o usuário
            let user = await UserModel.findOne({ email: normalizedEmail });
            // Se o usuário não existir, cria um novo
            if (!user) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password || 'senhapadrao123', salt);
                const identification = Math.floor(10000000 + Math.random() * 90000000).toString();
                user = await UserModel.create({
                    id: `u-${Date.now()}`,
                    identification,
                    name: normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    password: hashedPassword,
                    avatarUrl: `https://picsum.photos/seed/${identification}/200`,
                    coverUrl: `https://picsum.photos/seed/${identification}-c/1080/1920`,
                    isOnline: true
                });
            }
            else {
                // Se o usuário existir, atualiza o status para online
                await UserModel.updateOne({ _id: user._id }, { isOnline: true });
            }
            // Gera o token de autenticação
            const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
            // Remove a senha do objeto de retorno
            const userObject = user.toObject();
            delete userObject.password;
            return sendSuccess(res, {
                user: userObject,
                token
            }, "Login realizado com sucesso.");
        }
        catch (error) {
            console.error("Erro no login:", error);
            return sendError(res, "Erro inesperado ao fazer login.", 500);
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
