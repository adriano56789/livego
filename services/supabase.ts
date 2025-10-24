import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const supabaseHelpers = {
  // Users
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserByIdentification(identification: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('identification', identification)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createUser(userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Streamers
  async getStreamers(country?: string) {
    let query = supabase
      .from('streamers')
      .select('*, users!streamers_host_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (country && country !== 'ICON_GLOBE') {
      query = query.eq('country', country);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createStream(streamData: any) {
    const { data, error } = await supabase
      .from('streamers')
      .insert([streamData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStream(streamId: string, updates: any) {
    const { data, error } = await supabase
      .from('streamers')
      .update(updates)
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStream(streamId: string) {
    const { error } = await supabase
      .from('streamers')
      .delete()
      .eq('id', streamId);

    if (error) throw error;
  },

  // Gifts
  async getGifts() {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendGift(fromUserId: string, toUserId: string, streamId: string, giftName: string, amount: number) {
    const { data, error } = await supabase
      .from('gift_transactions')
      .insert([{
        from_user_id: fromUserId,
        to_user_id: toUserId,
        stream_id: streamId,
        gift_name: giftName,
        amount: amount
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReceivedGifts(userId: string) {
    const { data, error } = await supabase
      .from('gift_transactions')
      .select('gift_name, amount')
      .eq('to_user_id', userId);

    if (error) throw error;

    // Agregar por nome do presente
    const giftMap = new Map<string, number>();
    data?.forEach(tx => {
      const current = giftMap.get(tx.gift_name) || 0;
      giftMap.set(tx.gift_name, current + tx.amount);
    });

    return Array.from(giftMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
  },

  // Relationships
  async followUser(followerId: string, followedId: string) {
    const { data, error } = await supabase
      .from('relationships')
      .insert([{
        follower_id: followerId,
        followed_id: followedId
      }])
      .select()
      .single();

    if (error) {
      // Se já existe, ignorar
      if (error.code === '23505') return null;
      throw error;
    }
    return data;
  },

  async unfollowUser(followerId: string, followedId: string) {
    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', followedId);

    if (error) throw error;
  },

  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('relationships')
      .select('follower_id, users!relationships_follower_id_fkey(*)')
      .eq('followed_id', userId);

    if (error) throw error;
    return data?.map(r => r.users) || [];
  },

  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('relationships')
      .select('followed_id, users!relationships_followed_id_fkey(*)')
      .eq('follower_id', userId);

    if (error) throw error;
    return data?.map(r => r.users) || [];
  },

  // Messages
  async getMessages(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(fromUserId: string, toUserId: string, text: string, imageUrl?: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        from_user_id: fromUserId,
        to_user_id: toUserId,
        text: text,
        image_url: imageUrl
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(messageIds: string[]) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;
  }
};
