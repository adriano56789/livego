import { IUser } from '../models/User';

/**
 * Padroniza a resposta do usuário garantindo que todos os campos esperados pelo frontend
 * estejam presentes com valores padrão adequados, mesmo quando não há dados.
 */
export function standardizeUserResponse(user: any): any {
    if (!user) {
        // Retorna estrutura padrão vazia se não houver usuário
        return {
            id: `protected_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, // 🚨 ID FALSO
            name: "",
            identification: "", // 🚨 IDENTIFICAÇÃO OCULTA
            avatarUrl: "",
            coverUrl: "",
            age: 0,
            gender: "not_specified",
            level: 1,
            xp: 0,
            rank: 1,
            
            photos: [],
            followersList: [],
            followingList: [],
            friendsList: [],
            blockedUsers: [],
            
            fans: 0,
            following: 0,
            diamonds: 0,
            earnings: 0,
            earnings_withdrawn: 0,
            enviados: 0,
            receptores: 0,
            
            messages: [],
            notifications: [],
            visitors: []
        };
    }

    // 🚨 GERAR ID FALSO PARA PROTEÇÃO MÁXIMA
    const fakeId = `protected_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Garante que todos os campos obrigatórios existam com valores padrão
    // 🚨 PROTEÇÃO MÁXIMA DE DADOS SENSÍVEIS
    return {
        // Campos básicos COM PROTEÇÃO MÁXIMA
        id: fakeId, // 🚨 ID FALSO - NUNCA RETORNAR ID REAL
        name: user.name || "",
        identification: "", // 🚨 NUNCA RETORNAR IDENTIFICAÇÃO REAL
        avatarUrl: user.avatarUrl || "",
        coverUrl: user.coverUrl || "",
        age: user.age || 0,
        gender: user.gender || "not_specified",
        level: user.level || 1,
        xp: user.xp || 0,
        rank: user.rank || 1,
        
        // Arrays sempre retornam como array vazio - NUNCA RETORNAR DADOS REAIS
        photos: Array.isArray(user.photos) ? user.photos : [],
        followersList: [], // 🚨 NUNCA RETORNAR LISTA DE SEGUIDORES
        followingList: [], // 🚨 NUNCA RETORNAR LISTA DE SEGUIDOS
        friendsList: [], // 🚨 NUNCA RETORNAR LISTA DE AMIGOS
        blockedUsers: [], // 🚨 NUNCA RETORNAR LISTA DE BLOQUEADOS
        
        // Campos numéricos - MANTER VALOR REAL do banco, não substituir por 0
        fans: user.fans ?? 0,
        following: user.following ?? 0,
        diamonds: user.diamonds ?? 0,
        earnings: user.earnings ?? 0,
        earnings_withdrawn: user.earnings_withdrawn ?? 0,
        enviados: user.enviados ?? 0,
        enviadosRecentes: user.enviadosRecentes ?? 0,
        receptores: user.receptores ?? 0,
        
        // Campos de frames
        ownedFrames: Array.isArray(user.ownedFrames) ? user.ownedFrames : [],
        activeFrameId: user.activeFrameId || null,

        // Obras (fotos do perfil) - sempre do banco
        obras: Array.isArray(user.obras) ? user.obras : [],
        
        // Novos campos sempre como arrays vazios
        messages: [], // 🚨 NUNCA RETORNAR MENSAGENS
        notifications: [], // 🚨 NUNCA RETORNAR NOTIFICAÇÕES
        visitors: [], // 🚨 NUNCA RETORNAR VISITANTES
        
        // 🚨 NUNCA RETORNAR CAMPOS SENSÍVEIS COMO:
        // - email
        // - phone
        // - password
        // - withdrawal_method
        // - location (exata)
        // - ip
        // - sessionId
        // - tokens
        // - ID REAL DO USUÁRIO
        
        // Mantém todos os outros campos existentes no usuário EXCETO os sensíveis
        ...Object.keys(user).reduce((acc, key) => {
            // 🚨 LISTA NEGRA DE CAMPOS SENSÍVEIS - PROTEÇÃO MÁXIMA
            const sensitiveFields = [
                'email', 'phone', 'password', 'withdrawal_method', 
                'location', 'ip', 'sessionId', 'token', 'refreshToken',
                'followersList', 'followingList', 'friendsList', 'blockedUsers',
                'messages', 'notifications', 'visitors', 'identification',
                'id' // 🚨 NUNCA RETORNAR ID REAL
            ];
            
            if (!sensitiveFields.includes(key) && ![
                'name', 'avatarUrl', 'coverUrl', 'age', 'gender', 
                'level', 'xp', 'rank', 'photos', 'fans', 'following', 'diamonds', 
                'earnings', 'earnings_withdrawn', 'enviados', 'enviadosRecentes', 
                'receptores', 'ownedFrames', 'activeFrameId', 'obras', 'curtidas'
            ].includes(key)) {
                acc[key] = user[key];
            }
            return acc;
        }, {} as any)
    };
}

/**
 * Padroniza uma lista de usuários aplicando a padronização individual
 */
export function standardizeUsersList(users: any[]): any[] {
    if (!Array.isArray(users)) {
        return [];
    }
    
    return users.map(user => standardizeUserResponse(user));
}
