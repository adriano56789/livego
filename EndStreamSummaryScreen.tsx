

import React from 'react';
import { StreamSummaryData } from './types';
import { BrazilFlagIcon } from './components/icons';
import { useTranslation } from './i18n';

interface EndStreamSummaryScreenProps {
  data: StreamSummaryData;
  onClose: () => void;
}

const StatItem: React.FC<{ value: string | number; label: string; isPrimary?: boolean }> = ({ value, label, isPrimary = false }) => (
    <div className="text-center">
        <p className={`font-bold ${isPrimary ? 'text-5xl' : 'text-2xl'}`}>{value}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
);

const EndStreamSummaryScreen: React.FC<EndStreamSummaryScreenProps> = ({ data, onClose }) => {
  const { t } = useTranslation();
  
  const formatStat = (value: number) => {
    if (!value || value === 0) return '0';
    const formatted = (Number(value) || 0).toLocaleString('pt-BR');
    return value > 0 ? `+${formatted}` : formatted;
  };

  const formatDuration = (duration: number | string) => {
    const totalSeconds = typeof duration === 'string' ? parseInt(duration) : duration;
    if (!totalSeconds || totalSeconds === 0) return '00:00:00';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-[#111111] z-[60] flex flex-col items-center justify-around text-white p-8">
      <div>
        <h1 className="text-4xl font-bold text-center">{t('endStream.summaryTitle')}</h1>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <img 
            src={data.user?.avatarUrl || ''}
            alt={data.user?.name || 'Streamer'}
            className="w-28 h-28 rounded-full object-cover border-4 border-white/50"
          />
          <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1 border-2 border-[#111111]">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
              <BrazilFlagIcon />
            </div>
          </div>
        </div>
        <p className="text-xl font-semibold">{data.user?.name || 'Streamer'}</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="space-y-8">
            <div className="flex justify-around items-start">
                <StatItem value={data.viewers !== undefined ? data.viewers.toLocaleString('pt-BR') : '0'} label={t('endStream.viewers')} />
                <StatItem value={formatDuration(data.duration)} label={t('endStream.duration')} />
            </div>
            <div>
                <StatItem value={data.coins !== undefined ? data.coins.toLocaleString('pt-BR') : '0'} label={t('endStream.coins')} isPrimary />
            </div>
            <div className="flex justify-around items-start">
                <StatItem value={formatStat(data.followers !== undefined ? data.followers : 0)} label={t('endStream.newFollowers')} />
                <StatItem value={formatStat(data.members !== undefined ? data.members : 0)} label={t('endStream.members')} />
                <StatItem value={formatStat(data.fans !== undefined ? data.fans : 0)} label={t('endStream.newFans')} />
            </div>
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="w-full max-w-sm bg-purple-600 hover:bg-purple-700 font-bold py-4 rounded-full transition-colors text-lg"
      >
        {t('endStream.backToHome')}
      </button>
    </div>
  );
};

export default EndStreamSummaryScreen;