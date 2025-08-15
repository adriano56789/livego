import type { User, DailyReward, UserRewardStatus } from '../types';
import { apiClient } from './apiClient';

export const getDailyRewards = (userId: number): Promise<{ rewards: DailyReward[], status: UserRewardStatus | null, canClaimToday: boolean }> => {
  return apiClient(`/api/users/${userId}/daily-rewards`);
};

export const claimDailyReward = (userId: number): Promise<{ updatedUser: User, claimedReward: DailyReward }> => {
  return apiClient(`/api/users/${userId}/daily-rewards/claim`, { method: 'POST' });
};
