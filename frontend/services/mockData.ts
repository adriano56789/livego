import { User, Streamer, Gift, RankedUser, MusicTrack } from '../types';
import { GIFTS } from '../constants';

// Dados mínimos para compatibilidade - sem dados falsos
export const mockData = {
    currentUser: {} as User,
    streamCategories: [],
    streams: [] as Streamer[],
    gifts: GIFTS,
    conversations: [],
    onlineUsers: [] as User[],
    ranking: [] as RankedUser[],
    frames: [],
    music: [] as MusicTrack[]
};