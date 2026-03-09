import { callApi } from './api';

// Interfaces para os itens da loja
export interface ShopItem {
  id: string;
  name: string;
  category: 'mochila' | 'quadro' | 'carro' | 'bolha' | 'anel' | 'avatar';
  price: number;
  duration?: number;
  description: string;
  icon: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInventory {
  userId: string;
  itemId: string;
  itemType: 'mochila' | 'quadro' | 'carro' | 'bolha' | 'anel' | 'avatar';
  purchaseDate: string;
  expirationDate?: string;
  isActive: boolean;
  isEquipped: boolean;
}

export interface UserAvatar {
  userId: string;
  avatarId: string;
  imageUrl: string;
  purchaseDate: string;
  expirationDate: string;
  isActive: boolean;
  isCurrent: boolean;
}

// Interfaces para Frames
export interface Frame {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  icon: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFrame {
  userId: string;
  frameId: string;
  purchaseDate: string;
  expirationDate: string;
  isActive: boolean;
  isEquipped: boolean;
}

// ============= MOCHILAS =============
export const shopAPI = {
  // Mochilas
  mochilas: {
    getAll: () => callApi<ShopItem[]>('GET', '/api/shop/mochilas'),
    purchase: (itemId: string, userId: string) => 
      callApi<{ success: boolean; inventory: UserInventory; userDiamonds: number }>('POST', `/api/shop/mochilas/${itemId}/purchase`, { userId }),
    getUserItems: (userId: string) => callApi<UserInventory[]>('GET', `/api/shop/mochilas/user/${userId}`),
  },

  // Quadros
  quadros: {
    getAll: () => callApi<ShopItem[]>('GET', '/api/shop/quadros'),
    purchase: (itemId: string, userId: string) => 
      callApi<{ success: boolean; inventory: UserInventory; userDiamonds: number }>('POST', `/api/shop/quadros/${itemId}/purchase`, { userId }),
    getUserItems: (userId: string) => callApi<UserInventory[]>('GET', `/api/shop/quadros/user/${userId}`),
  },

  // Carros
  carros: {
    getAll: () => callApi<ShopItem[]>('GET', '/api/shop/carros'),
    purchase: (itemId: string, userId: string) => 
      callApi<{ success: boolean; inventory: UserInventory; userDiamonds: number }>('POST', `/api/shop/carros/${itemId}/purchase`, { userId }),
    getUserItems: (userId: string) => callApi<UserInventory[]>('GET', `/api/shop/carros/user/${userId}`),
  },

  // Bolhas
  bolhas: {
    getAll: () => callApi<ShopItem[]>('GET', '/api/shop/bolhas'),
    purchase: (itemId: string, userId: string) => 
      callApi<{ success: boolean; inventory: UserInventory; userDiamonds: number }>('POST', `/api/shop/bolhas/${itemId}/purchase`, { userId }),
    getUserItems: (userId: string) => callApi<UserInventory[]>('GET', `/api/shop/bolhas/user/${userId}`),
  },

  // Anéis
  aneis: {
    getAll: () => callApi<ShopItem[]>('GET', '/api/shop/aneis'),
    purchase: (itemId: string, userId: string) => 
      callApi<{ success: boolean; inventory: UserInventory; userDiamonds: number }>('POST', `/api/shop/aneis/${itemId}/purchase`, { userId }),
    getUserItems: (userId: string) => callApi<UserInventory[]>('GET', `/api/shop/aneis/user/${userId}`),
  },

  // Avatares (Especial - 7 dias)
  avatars: {
    getAll: () => callApi<ShopItem[]>('GET', '/api/shop/avatars'),
    purchase: (itemId: string, userId: string) => 
      callApi<{ success: boolean; userAvatar: UserAvatar; userDiamonds: number; expirationDate: string }>('POST', `/api/shop/avatars/${itemId}/purchase`, { userId }),
    getUserItems: (userId: string) => callApi<UserAvatar[]>('GET', `/api/shop/avatars/user/${userId}`),
    equip: (avatarId: string, userId: string) => 
      callApi<{ success: boolean; currentAvatar: UserAvatar; message: string }>('POST', `/api/shop/avatars/${avatarId}/equip`, { userId }),
    getCurrent: (userId: string) => callApi<UserAvatar>('GET', `/api/shop/avatars/current/${userId}`),
  },

  // Utilitários
  getAllCategories: async () => {
    const [mochilas, quadros, carros, bolhas, aneis, avatars] = await Promise.all([
      shopAPI.mochilas.getAll(),
      shopAPI.quadros.getAll(),
      shopAPI.carros.getAll(),
      shopAPI.bolhas.getAll(),
      shopAPI.aneis.getAll(),
      shopAPI.avatars.getAll(),
    ]);

    return {
      mochilas,
      quadros,
      carros,
      bolhas,
      aneis,
      avatars,
    };
  },

  getUserInventory: async (userId: string) => {
    const [mochilas, quadros, carros, bolhas, aneis, avatars] = await Promise.all([
      shopAPI.mochilas.getUserItems(userId),
      shopAPI.quadros.getUserItems(userId),
      shopAPI.carros.getUserItems(userId),
      shopAPI.bolhas.getUserItems(userId),
      shopAPI.aneis.getUserItems(userId),
      shopAPI.avatars.getUserItems(userId),
    ]);

    return {
      mochilas,
      quadros,
      carros,
      bolhas,
      aneis,
      avatars,
    };
  },

  // ============= FRAMES (QUADROS DE AVATAR) =============
  frames: {
    getAll: () => callApi<Frame[]>('GET', '/api/frames'),
    purchase: (frameId: string, userId: string) => 
      callApi<{ success: boolean; userFrame: UserFrame; userDiamonds: number; expirationDate: string }>('POST', `/api/frames/${frameId}/purchase`, { userId }),
    getUserFrames: (userId: string) => callApi<UserFrame[]>('GET', `/api/frames/user/${userId}`),
    equip: (frameId: string, userId: string) => 
      callApi<{ success: boolean; equippedFrame: UserFrame; message: string }>('POST', `/api/frames/${frameId}/equip`, { userId }),
    getCurrent: (userId: string) => callApi<UserFrame>('GET', `/api/frames/current/${userId}`),
    cleanupExpired: () => callApi<{ success: boolean; expiredFrames: number }>('POST', '/api/frames/cleanup-expired'),
  },
};
