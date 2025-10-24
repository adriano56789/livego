/**
 * API com Supabase - Exemplo de uso
 *
 * Este arquivo mostra como conectar o app ao banco de dados Supabase.
 * Para usar, substitua o import de './api' por './api-supabase' no seu código.
 */

import { supabaseHelpers } from './supabase';
import { User, Gift, Streamer, Message, Country } from '../types';

export const api = {
  // --- Users ---
  getCurrentUser: async () => {
    // TODO: Implementar autenticação
    // Por enquanto, retorna um usuário de exemplo
    const user = await supabaseHelpers.getUserByIdentification('10755083');
    if (!user) {
      // Criar usuário padrão se não existir
      return await supabaseHelpers.createUser({
        identification: '10755083',
        name: 'Seu Perfil',
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        country: 'br',
        age: 32,
        gender: 'male'
      });
    }
    return user as User;
  },

  getAllUsers: async () => {
    const users = await supabaseHelpers.getAllUsers();
    return users as User[];
  },

  getUser: async (userId: string) => {
    const user = await supabaseHelpers.getUser(userId);
    if (!user) throw new Error('User not found');
    return user as User;
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const user = await supabaseHelpers.updateUser(userId, updates);
    return { success: true, user: user as User };
  },

  // --- Streamers ---
  getLiveStreamers: async (category: string, country?: string) => {
    const streamers = await supabaseHelpers.getStreamers(country);
    return streamers.map(s => ({
      id: s.id,
      hostId: s.host_id,
      name: s.users?.name || 'Unknown',
      avatar: s.users?.avatar_url || '',
      location: s.location,
      time: new Date(s.created_at).toLocaleString(),
      message: s.message,
      tags: s.tags,
      country: s.country,
      viewers: s.viewers,
      isPrivate: s.is_private
    })) as Streamer[];
  },

  createStream: async (options: Partial<Streamer>) => {
    const stream = await supabaseHelpers.createStream({
      host_id: options.hostId,
      location: options.location || 'Em algum lugar',
      message: options.message || '',
      tags: options.tags || [],
      country: options.country || 'br',
      viewers: 0,
      is_private: options.isPrivate || false
    });
    return stream as Streamer;
  },

  // --- Gifts ---
  getGifts: async () => {
    const gifts = await supabaseHelpers.getGifts();
    return gifts.map(g => ({
      name: g.name,
      price: g.price,
      icon: g.icon,
      category: g.category,
      triggersAutoFollow: g.triggers_auto_follow,
      videoUrl: g.video_url
    })) as Gift[];
  },

  sendGift: async (fromUserId: string, streamId: string, giftName: string, amount: number) => {
    // Obter o host da stream
    const stream = await supabaseHelpers.getStreamers();
    const currentStream = stream.find(s => s.id === streamId);

    if (!currentStream) {
      return { success: false, error: 'Stream não encontrada' };
    }

    // Obter o presente
    const gifts = await supabaseHelpers.getGifts();
    const gift = gifts.find(g => g.name === giftName);

    if (!gift) {
      return { success: false, error: 'Presente não encontrado' };
    }

    const totalCost = (gift.price || 0) * amount;

    // Verificar se o usuário tem diamantes suficientes
    const sender = await supabaseHelpers.getUser(fromUserId);
    if (!sender || sender.diamonds < totalCost) {
      return { success: false, error: 'Diamantes insuficientes' };
    }

    // Registrar transação
    await supabaseHelpers.sendGift(fromUserId, currentStream.host_id, streamId, giftName, amount);

    // Atualizar diamantes do remetente
    const updatedSender = await supabaseHelpers.updateUser(fromUserId, {
      diamonds: sender.diamonds - totalCost,
      enviados: (sender.enviados || 0) + totalCost
    });

    // Atualizar ganhos do receptor
    const receiver = await supabaseHelpers.getUser(currentStream.host_id);
    const updatedReceiver = await supabaseHelpers.updateUser(currentStream.host_id, {
      earnings: (receiver?.earnings || 0) + totalCost,
      receptores: (receiver?.receptores || 0) + totalCost
    });

    return {
      success: true,
      updatedSender: updatedSender as User,
      updatedReceiver: updatedReceiver as User
    };
  },

  getReceivedGifts: async (userId: string) => {
    return await supabaseHelpers.getReceivedGifts(userId);
  },

  // --- Relationships ---
  followUser: async (followerId: string, followedId: string) => {
    await supabaseHelpers.followUser(followerId, followedId);

    // Atualizar contadores
    const follower = await supabaseHelpers.getUser(followerId);
    const followed = await supabaseHelpers.getUser(followedId);

    const updatedFollower = await supabaseHelpers.updateUser(followerId, {
      following: (follower?.following || 0) + 1
    });

    const updatedFollowed = await supabaseHelpers.updateUser(followedId, {
      fans: (followed?.fans || 0) + 1
    });

    return {
      success: true,
      updatedFollower: updatedFollower as User,
      updatedFollowed: updatedFollowed as User
    };
  },

  getFansUsers: async (userId: string) => {
    return await supabaseHelpers.getFollowers(userId) as User[];
  },

  getFollowingUsers: async (userId: string) => {
    return await supabaseHelpers.getFollowing(userId) as User[];
  },

  // --- Messages ---
  getChatMessages: async (otherUserId: string) => {
    const currentUser = await api.getCurrentUser();
    const messages = await supabaseHelpers.getMessages(currentUser.id, otherUserId);
    return messages as Message[];
  },

  sendChatMessage: async (from: string, to: string, text: string, imageUrl?: string) => {
    const message = await supabaseHelpers.sendMessage(from, to, text, imageUrl);
    return message as Message;
  },

  markMessagesAsRead: async (messageIds: string[]) => {
    await supabaseHelpers.markMessagesAsRead(messageIds);
  },

  // --- Outros métodos que ainda usam o mock ---
  // TODO: Implementar estes métodos com Supabase conforme necessário

  deleteAccount: async (userId: string) => {
    throw new Error('Not implemented with Supabase yet');
  },

  blockUser: async (userIdToBlock: string) => {
    throw new Error('Not implemented with Supabase yet');
  },

  unblockUser: async (userIdToUnblock: string) => {
    throw new Error('Not implemented with Supabase yet');
  },

  reportUser: async (userIdToReport: string, reason: string) => {
    throw new Error('Not implemented with Supabase yet');
  },

  getBlockedUsers: async () => {
    return [] as User[];
  },

  getConversations: async (userId: string) => {
    return [];
  },

  getFriends: async (userId: string) => {
    return [] as User[];
  },

  getRankingForPeriod: async (period: 'daily' | 'weekly' | 'monthly') => {
    return [];
  },

  getCountries: async () => {
    return [
      { name: 'Global', code: 'ICON_GLOBE' },
      { name: 'Brasil', code: 'br' },
      { name: 'Colômbia', code: 'co' }
    ] as Country[];
  },

  buyDiamonds: async (userId: string, amount: number, price: number) => {
    const user = await supabaseHelpers.getUser(userId);
    if (!user) throw new Error('User not found');

    const updatedUser = await supabaseHelpers.updateUser(userId, {
      diamonds: (user.diamonds || 0) + amount
    });

    return { success: true, user: updatedUser as User };
  },

  getPurchaseHistory: async (userId: string) => {
    return [];
  },

  getNotificationSettings: async (userId: string) => {
    return {
      newMessages: true,
      streamerLive: true,
      followedPosts: true,
      pedido: true,
      interactive: true
    };
  },

  updateNotificationSettings: async (userId: string, settings: any) => {
    return { settings };
  }
};
