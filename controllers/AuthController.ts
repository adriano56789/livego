
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { GoogleAccount, User } from '../types';

export const AuthController = {
  async loginWithGoogle(req: any, res: any) {
    try {
      const { email, name, googleId, avatarUrl } = req.body;

      let account = db.googleAccounts.find(acc => acc.googleId === googleId);
      let user: User | undefined;

      if (account) {
        // Conta existente
        // Na simulação, vinculamos pelo ID fixo ou lógica de email
        // Para simplificar a demo, assumimos o CURRENT_USER_ID se for o admin
        user = db.users.get(CURRENT_USER_ID); 
        // Em um app real: user = db.users.get(account.userId);
        
        account.lastLogin = new Date().toISOString(); 
      } else {
        // Novo Registro
        // 1. Criar Usuário
        const newUserId = Math.floor(Math.random() * 100000000).toString();
        const newUser: User = {
          id: newUserId,
          identification: newUserId,
          name: name,
          avatarUrl: avatarUrl || 'https://picsum.photos/200',
          coverUrl: 'https://picsum.photos/400/800',
          email: email,
          level: 1,
          diamonds: 0,
          earnings: 0,
          xp: 0,
          fans: 0,
          following: 0,
          receptores: 0,
          enviados: 0,
          earnings_withdrawn: 0,
          isVIP: false,
          ownedFrames: [],
          preferences: { /* ...default prefs... */ } as any
        };
        db.users.set(newUserId, newUser);
        user = newUser;

        // 2. Criar Vínculo Google
        const newAccount: GoogleAccount = {
          id: `g_${Date.now()}`,
          googleId,
          name,
          email,
          avatarUrl,
          userId: newUserId,
          lastLogin: new Date().toISOString()
        };
        db.googleAccounts.push(newAccount);
        
        // Simulação: vincular
        if (!db.userConnectedAccounts.has(newUserId)) {
            db.userConnectedAccounts.set(newUserId, { google: [] });
        }
        db.userConnectedAccounts.get(newUserId)?.google?.push(newAccount);
      }

      saveDb();
      return res.status(200).json({ success: true, user, token: 'mock-jwt-token' });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  async getConnectedAccounts(req: any, res: any) {
    try {
      const accounts = db.userConnectedAccounts.get(CURRENT_USER_ID)?.google || [];
      return res.status(200).json(accounts);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  async disconnectAccount(req: any, res: any) {
    try {
      const { email } = req.body;
      const accounts = db.userConnectedAccounts.get(CURRENT_USER_ID);
      if (accounts?.google) {
          accounts.google = accounts.google.filter(acc => acc.email !== email);
          saveDb();
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
};
