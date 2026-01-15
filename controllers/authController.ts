import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.js';
import config from '../config/settings.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/response.js';

let lastLoggedInEmail: string | null = null;

export const authController = {
    register: async (req: Request, res: Response, next: NextFunction) => {
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
        } catch (error: any) {
            next(error);
        }
    },

    login: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email) return sendError(res, "E-mail é obrigatório.", 400);
            if (!password) return sendError(res, "Senha é obrigatória.", 400);

            // Normaliza o e-mail
            const normalizedEmail = email.toLowerCase().trim();
            
            // Tenta encontrar o usuário incluindo a senha
            const user = await UserModel.findOne({ email: normalizedEmail }).select('+password').lean();
            
            // Se o usuário não existir, retorna erro
            if (!user) {
                return sendError(res, "E-mail ou senha inválidos.", 401);
            }

            // Verifica a senha
            const userPassword = user.password as string;
            if (!userPassword) {
                return sendError(res, "Erro na autenticação. Tente novamente.", 500);
            }

            const isPasswordValid = await bcrypt.compare(password, userPassword);
            if (!isPasswordValid) {
                return sendError(res, "E-mail ou senha inválidos.", 401);
            }

            // Atualiza o status para online
            await UserModel.findByIdAndUpdate(user._id, { isOnline: true });
            
            // Gera o token de autenticação
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                config.jwtSecret,
                { expiresIn: '7d' }
            );
            
            // Remove a senha do objeto de retorno
            const { password: _, ...userWithoutPassword } = user;
            
            return sendSuccess(res, { 
                user: userWithoutPassword, 
                token 
            }, "Login realizado com sucesso.");
            
        } catch (error: any) {
            console.error("Erro no login:", error);
            return sendError(res, "Erro inesperado ao fazer login.", 500);
        }
    },

    logout: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.body;
            if (userId) {
                await UserModel.findOneAndUpdate({ id: userId }, { isOnline: false });
            }
            return sendSuccess(res, null, "Sessão encerrada.");
        } catch (error: any) {
            next(error);
        }
    },

    saveLastEmail: (req: Request, res: Response) => {
        const { email } = req.body;
        if (email) {
            lastLoggedInEmail = email;
            return sendSuccess(res, null, "E-mail salvo.");
        }
        return sendError(res, "E-mail não fornecido.", 400);
    },

    getLastEmail: (req: Request, res: Response) => {
        return sendSuccess(res, { email: lastLoggedInEmail });
    },
};