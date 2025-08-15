import React, { useState, useEffect, useCallback } from 'react';
import type { User, DailyReward, UserRewardStatus } from '../types';
import * as rewardsService from '../services/rewardsService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckIcon from './icons/CheckIcon';
import RewardClaimModal from './RewardClaimModal';

interface DailyRewardsScreenProps {
  user: User;
  onExit: () => void;
  onRewardClaimed: (updatedUser: User) => void;
}

const RewardCard: React.FC<{
  reward: DailyReward;
  isClaimed: boolean;
  isClaimable: boolean;
  onClaim: () => void;
}> = ({ reward, isClaimed, isClaimable, onClaim }) => {
  
  const cardClasses = `relative w-full aspect-[4/5] p-3 rounded-xl flex flex-col items-center justify-between text-center transition-all duration-300 transform
    ${isClaimable ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 shadow-lg shadow-yellow-500/30 scale-105' : 'bg-[#2A2D32]'}
    ${isClaimed ? 'opacity-60' : ''}
  `;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`font-bold ${isClaimable ? 'text-white' : 'text-gray-400'}`}>Dia {reward.day}</span>
      <button onClick={onClaim} disabled={!isClaimable} className={cardClasses}>
        {isClaimable && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>}
        <div className="w-16 h-16 flex items-center justify-center">
          <img src={reward.imageUrl} alt={reward.name} className="max-w-full max-h-full object-contain" />
        </div>
        <p className={`font-semibold text-sm ${isClaimable ? 'text-black' : 'text-white'}`}>{reward.name}</p>
        {isClaimed && (
          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-black" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};


const DailyRewardsScreen: React.FC<DailyRewardsScreenProps> = ({ user, onExit, onRewardClaimed }) => {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [status, setStatus] = useState<UserRewardStatus | null>(null);
  const [canClaimToday, setCanClaimToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await rewardsService.getDailyRewards(user.id);
      setRewards(data.rewards);
      setStatus(data.status);
      setCanClaimToday(data.canClaimToday);
    } catch (error) {
      console.error("Failed to fetch daily rewards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = async () => {
    if (!canClaimToday || isClaiming) return;
    setIsClaiming(true);
    try {
      const result = await rewardsService.claimDailyReward(user.id);
      onRewardClaimed(result.updatedUser);
      setClaimedReward(result.claimedReward);
      // Refetch data to update UI state
      fetchData();
    } catch (error) {
      console.error("Failed to claim reward:", error);
      alert(error instanceof Error ? error.message : "Não foi possível coletar a recompensa.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <div className="h-screen w-full bg-gradient-to-b from-[#0F0C29] via-[#302B63] to-[#24243E] text-white flex flex-col font-sans">
        <header className="p-4 flex items-center justify-between shrink-0">
          <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">Recompensas Diárias</h1>
          <div className="w-6 h-6"></div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Check-in Semanal</h2>
            <p className="text-gray-300 mt-1">Entre todos os dias para ganhar prêmios!</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {rewards.slice(0, 3).map(reward => (
                <RewardCard 
                  key={reward.day}
                  reward={reward}
                  isClaimed={!!status && status.lastClaimedDay >= reward.day}
                  isClaimable={canClaimToday && (!status || status.lastClaimedDay + 1 === reward.day || (status.lastClaimedDay === 7 && reward.day === 1))}
                  onClaim={handleClaim}
                />
              ))}
               <div className="col-span-4 mt-2">
                 <RewardCard 
                    reward={rewards[6]} // Day 7
                    isClaimed={!!status && status.lastClaimedDay >= 7}
                    isClaimable={canClaimToday && (!status || status.lastClaimedDay + 1 === 7)}
                    onClaim={handleClaim}
                />
               </div>
               {rewards.slice(3, 6).map(reward => (
                <RewardCard 
                  key={reward.day}
                  reward={reward}
                  isClaimed={!!status && status.lastClaimedDay >= reward.day}
                  isClaimable={canClaimToday && (!status || status.lastClaimedDay + 1 === reward.day)}
                  onClaim={handleClaim}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      {claimedReward && (
        <RewardClaimModal 
            reward={claimedReward}
            onClose={() => setClaimedReward(null)}
        />
      )}
    </>
  );
};

export default DailyRewardsScreen;
