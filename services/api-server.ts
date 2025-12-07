import express, { Request, Response, NextFunction } from 'express';
import { webSocketServerInstance } from './websocket';
import { db, saveDb } from './database';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedUser, ApiResponse } from '../src/types/server';

// Adiciona tipos estendidos para o Request do Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const router = express.Router();

// Middleware para log de requisições
router.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.query, req.body);
    next();
});

// Middleware de autenticação
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                status: 401, 
                error: 'Token de autenticação não fornecido' 
            } satisfies ApiResponse);
        }

        const token = authHeader.split(' ')[1];
        
        // Busca o usuário pelo token
        const user = Array.from(db.users.values()).find(u => u.token === token);
        
        if (!user) {
            return res.status(401).json({ 
                status: 401, 
                error: 'Token inválido ou expirado' 
            } satisfies ApiResponse);
        }

        // Adiciona o usuário autenticado ao objeto de requisição
        req.user = user as AuthenticatedUser;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).json({
            status: 500,
            error: 'Erro ao processar autenticação'
        } satisfies ApiResponse);
    }
};

// Rota de saúde da API
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 200, 
        data: { 
            status: 'ok', 
            timestamp: new Date().toISOString() 
        } 
    });
});

// Rotas de usuário
router.route('/users')
    // Listar usuários (com paginação)
    .get(authenticate, (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || '';
            
            const users = Array.from(db.users.values())
                .filter(user => 
                    !search || 
                    user.name.toLowerCase().includes(search.toLowerCase())
                );
                
            const startIndex = (page - 1) * limit;
            const paginatedUsers = users.slice(startIndex, startIndex + limit);
            
            res.status(200).json({
                status: 200,
                data: {
                    items: paginatedUsers,
                    pagination: {
                        total: users.length,
                        page,
                        limit,
                        totalPages: Math.ceil(users.length / limit)
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({ 
                status: 500, 
                error: 'Erro interno ao processar a requisição' 
            });
        }
    });

// Rotas para um usuário específico
router.route('/users/:userId')
    // Obter detalhes do usuário
    .get(authenticate, (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const user = db.users.get(userId);
            
            if (!user) {
                return res.status(404).json({ 
                    status: 404, 
                    error: 'Usuário não encontrado' 
                });
            }
            
            res.status(200).json({ 
                status: 200, 
                data: user 
            });
            
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({ 
                status: 500, 
                error: 'Erro interno ao processar a requisição' 
            });
        }
    })
    // Atualizar usuário
    .put(authenticate, async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const updates = req.body;
            const currentUser = (req as any).user;
            
            // Verifica se o usuário está tentando atualizar ele mesmo
            if (currentUser.id !== userId && !currentUser.isAdmin) {
                return res.status(403).json({ 
                    status: 403, 
                    error: 'Você não tem permissão para atualizar este usuário' 
                });
            }
            
            const user = db.users.get(userId);
            if (!user) {
                return res.status(404).json({ 
                    status: 404, 
                    error: 'Usuário não encontrado' 
                });
            }
            
            // Atualiza os campos permitidos
            const updatedUser = { 
                ...user, 
                ...updates,
                updatedAt: new Date().toISOString() 
            };
            
            db.users.set(userId, updatedUser);
            await saveDb();
            
            // Notifica via WebSocket
            webSocketServerInstance.emit('userUpdated', { 
                userId, 
                updates 
            });
            
            res.status(200).json({ 
                status: 200, 
                data: updatedUser 
            });
            
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({ 
                status: 500, 
                error: 'Erro interno ao processar a requisição' 
            });
        }
    });

// Middleware para tratamento de erros
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro na API:', err);
    res.status(500).json({ 
        status: 500, 
        error: 'Erro interno do servidor' 
    });
});

export default router;
