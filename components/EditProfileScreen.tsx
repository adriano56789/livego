
import React, { useState, useEffect } from 'react';
import type { User, AppView } from '../types';
import { getGiftsReceived, getGiftsSent } from '../services/authService';

import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PencilIcon from './icons/PencilIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import BrazilFlagIcon from './icons/BrazilFlagIcon';
import MaleIcon from './icons/MaleIcon';
import StarIcon from './icons/StarIcon';
import CopyIcon from './icons/CopyIcon';
import LocationPinIcon from './icons/LocationPinIcon';
import CoinIcon from './icons/CoinIcon';
import DiamondIcon from './icons/DiamondIcon';
import ClockIcon from './icons/ClockIcon';
import VideoIcon from './icons/VideoIcon';
import MenuIcon from './icons/MenuIcon';
import CheckIcon from './icons/CheckIcon';

interface EditProfileScreenProps {
  user: User;
  onProfileComplete: (user: User) => void;
  onNavigate: (view: AppView) => void;
}

const Stat: React.FC<{ value: string; label: string; icon?: React.ReactNode; onClick?: () => void; }> = ({ value, label, icon, onClick }) => (
  <button onClick={onClick} disabled={!onClick} className="text-center w-full p-1 rounded-lg transition-colors hover:enabled:bg-gray-200 disabled:cursor-default">
    <p className="font-bold text-lg text-gray-800">{value}</p>
    <div className="flex items-center justify-center gap-1">
      {icon}
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </button>
);

const Tab: React.FC<{ label: string; icon: React.ReactNode; active?: boolean }> = ({ label, icon, active }) => (
  <button className="flex flex-col items-center gap-2 pb-2 relative w-full">
    {icon}
    <span className={`text-sm font-semibold ${active ? 'text-purple-600' : 'text-gray-500'}`}>{label}</span>
    {active && <div className="absolute bottom-0 w-1/2 h-1 bg-purple-600 rounded-full"></div>}
  </button>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between items-center py-3">
    <span className="text-gray-500">{label}</span>
    <div className="text-gray-800 font-semibold">{children}</div>
  </div>
);


const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, onNavigate }) => {
  const [idCopied, setIdCopied] = useState(false);
  const [giftsReceived, setGiftsReceived] = useState(0);
  const [giftsSent, setGiftsSent] = useState(0);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  useEffect(() => {
    getGiftsReceived(user.id).then(data => setGiftsReceived(data.totalValue));
    getGiftsSent(user.id).then(data => setGiftsSent(data.totalValue));
  }, [user.id]);

  const formatStat = (num: number): string => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(user.id));
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };
  
  const formattedBirthday = user.birthday 
    ? new Date(user.birthday + 'T00:00:00').toLocaleDateString('pt-BR')
    : 'Não especificado';

  const genderText = user.gender === 'male' ? 'Masculino' : user.gender === 'female' ? 'Feminino' : 'Não especificado';

  return (
    <>
      <div className="h-screen w-full bg-gray-100 flex flex-col font-sans">
        <header className="relative h-48 bg-purple-500 shrink-0">
          <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-20">
            <button onClick={() => onNavigate('profile')} className="p-2 -m-2 rounded-full hover:bg-black/10 transition-colors"><ArrowLeftIcon className="w-6 h-6 text-white" /></button>
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('profile-editor')} className="p-2 -m-2 rounded-full hover:bg-black/10 transition-colors"><PencilIcon className="w-6 h-6 text-white" /></button>
              <div className="relative">
                <button onClick={() => setIsActionMenuOpen(prev => !prev)} className="p-2 -m-2 rounded-full hover:bg-black/10 transition-colors">
                  <EllipsisIcon className="w-6 h-6 text-white" />
                </button>
                {isActionMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30 ring-1 ring-black ring-opacity-5">
                    <button
                        onClick={() => {
                            onNavigate('avatar-protection');
                            setIsActionMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Proteção de avatar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-28 h-28 z-10">
            <div className={`w-full h-full rounded-full p-1.5 bg-gradient-to-br from-purple-400 to-pink-400 ${user.is_avatar_protected ? 'animate-protection-glow' : ''}`}>
                <div className="bg-white w-full h-full rounded-full p-1">
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover"/>
                </div>
            </div>
            <div className="absolute -bottom-1 -right-1">
                <BrazilFlagIcon className="w-7 h-7"/>
            </div>
          </div>
        </header>

        <main className="flex-grow pt-16 overflow-y-auto scrollbar-hide">
          <section className="text-center px-4">
            <h1 className="text-2xl font-bold text-gray-800">{user.nickname || user.name}</h1>
            <div className="flex items-center justify-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-600 font-semibold px-2 py-1 rounded-md">
                    <MaleIcon className="w-4 h-4"/> 29
                </span>
                <span className="flex items-center gap-1.5 text-sm bg-yellow-100 text-yellow-600 font-semibold px-2 py-1 rounded-md">
                    <StarIcon className="w-4 h-4"/> {user.level}
                </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
                <span>ID: {user.id}</span>
                <button onClick={handleCopyId}>
                    {idCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                </button>
                <LocationPinIcon className="w-4 h-4 text-gray-400 ml-2"/>
                <span>BR</span>
            </div>
          </section>

          <section className="my-6 grid grid-cols-4 gap-2 px-4">
             <Stat value={formatStat(user.followers)} label="Seguidos" onClick={() => onNavigate('followers')}/>
             <Stat value={formatStat(user.followers)} label="Fãs" onClick={() => onNavigate('fans')}/>
             <Stat value={formatStat(giftsReceived)} label="Recebir" icon={<CoinIcon className="w-3 h-3 text-yellow-500"/>}/>
             <Stat value={formatStat(giftsSent)} label="Enviar" icon={<DiamondIcon className="w-3 h-3"/>}/>
          </section>
          
          <nav className="grid grid-cols-4 gap-2 px-4 border-b border-gray-200">
            <Tab label="Momentos" icon={<ClockIcon className="w-6 h-6 text-gray-500"/>} />
            <Tab label="Vídeo" icon={<VideoIcon className="w-6 h-6 text-gray-500"/>} />
            <Tab label="VIP" icon={<StarIcon className="w-6 h-6 text-gray-500"/>} />
            <Tab label="Detalhes" icon={<MenuIcon className="w-6 h-6 text-purple-600"/>} active />
          </nav>
          
          <section className="px-6 py-4">
            <div className="inline-block bg-gray-200 text-gray-600 text-sm font-semibold px-3 py-1 rounded-md mb-4">“ LOL</div>
            <div className="divide-y divide-gray-200">
              <DetailRow label="Nome">
                <span>{user.nickname || user.name}</span>
              </DetailRow>
              <DetailRow label="Aniversário">
                <span>{formattedBirthday}</span>
              </DetailRow>
              <DetailRow label="Gênero">
                <span>{genderText}</span>
              </DetailRow>
              <DetailRow label="Residência atual"><span>Brasil</span></DetailRow>
              <DetailRow label="Intenção de fazer amigos">
                <span>26+, País estrangeiro, Alma gêmea</span>
              </DetailRow>
              <DetailRow label="Peso corporal">
                  <span>{user.weight ? `${user.weight}KG` : 'Não especificado'}</span>
              </DetailRow>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default EditProfileScreen;