import { IUser } from '../models/User';

/**
 * Padroniza a resposta do usuário garantindo que todos os campos esperados pelo frontend
 * estejam presentes com valores padrão adequados, mesmo quando não há dados.
 */
export function standardizeUserResponse(user: any): any {
    if (!user) {
        // Retorna estrutura padrão vazia se não houver usuário
        return {
            id: "",
            name: "",
            identification: "",
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

    // Garante que todos os campos obrigatórios existam com valores padrão
    return {
        // Campos básicos com valores do usuário ou defaults
        id: user.id || "",
        name: user.name || "",
        identification: user.identification || user.id || "",
        avatarUrl: user.avatarUrl || "",
        coverUrl: user.coverUrl || "",
        age: user.age || 0,
        gender: user.gender || "not_specified",
        level: user.level || 1,
        xp: user.xp || 0,
        rank: user.rank || 1,
        
        // Arrays sempre retornam como array vazio se não existirem
        photos: Array.isArray(user.photos) ? user.photos : [],
        followersList: Array.isArray(user.followersList) ? user.followersList : [],
        followingList: Array.isArray(user.followingList) ? user.followingList : [],
        friendsList: Array.isArray(user.friendsList) ? user.friendsList : [],
        blockedUsers: Array.isArray(user.blockedUsers) ? user.blockedUsers : [],
        
        // Campos numéricos com valor padrão 0
        fans: user.fans || 0,
        following: user.following || 0,
        diamonds: user.diamonds || 0,
        earnings: user.earnings || 0,
        earnings_withdrawn: user.earnings_withdrawn || 0,
        enviados: user.enviados || 0,
        enviadosRecentes: user.enviadosRecentes || 0,
        receptores: user.receptores || 0,
        
        // Campos de frames
        ownedFrames: Array.isArray(user.ownedFrames) ? user.ownedFrames : [],
        activeFrameId: user.activeFrameId || null,
        
        // Novos campos sempre como arrays vazios
        messages: Array.isArray(user.messages) ? user.messages : [],
        notifications: Array.isArray(user.notifications) ? user.notifications : [],
        visitors: Array.isArray(user.visitors) ? user.visitors : [],
        
        // Mantém todos os outros campos existentes no usuário
        ...Object.keys(user).reduce((acc, key) => {
            if (![
                'id', 'name', 'identification', 'avatarUrl', 'coverUrl', 'age', 'gender', 
                'level', 'xp', 'rank', 'photos', 'followersList', 'followingList',
                'friendsList', 'blockedUsers', 'fans', 'following', 'diamonds', 'earnings', 'earnings_withdrawn',
                'enviados', 'enviadosRecentes', 'receptores',
                'messages', 'notifications', 'visitors', 'ownedFrames', 'activeFrameId'
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
