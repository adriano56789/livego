import React, { useState, useEffect } from 'react';
import type { User, AppView, Gift } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import DiamondIcon from './icons/DiamondIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CopyrightIcon from './icons/CopyrightIcon';
import DollarIcon from './icons/DollarIcon';
import UsersIcon from './icons/UsersIcon';
import TrashIcon from './icons/TrashIcon';
import InfoIcon from './icons/InfoIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import BellIcon from './icons/BellIcon';
import MailIcon from './icons/MailIcon';
import LockSolidIcon from './icons/LockSolidIcon';
import GiftIcon from './icons/GiftIcon';

const SettingsMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isDestructive?: boolean;
}> = ({ icon, label, onClick, isDestructive = false }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors text-left"
  >
    <div className={`shrink-0 ${isDestructive ? 'text-red-500' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className={`font-medium text-base ${isDestructive ? 'text-red-500' : 'text-white'}`}>
      {label}
    </span>
  </button>
);

interface SettingsScreenProps {
  user: User;
  onExit: () => void;
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
  onDeleteAccount: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onExit, onLogout, onNavigate, onDeleteAccount }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isGiftSectionLoading, setIsGiftSectionLoading] = useState(true);

  useEffect(() => {
    liveStreamService.getGiftCatalog()
        .then(setGifts)
        .catch(err => console.error("Failed to load gifts for settings screen", err))
        .finally(() => setIsGiftSectionLoading(false));
  }, []);
  
  const handleDeleteClick = () => {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é permanente e não pode ser desfeita.')) {
        onDeleteAccount();
    }
  };

  const menuItems = [
    { icon: <UsersIcon className="w-6 h-6" />, label: "Contas Conectadas", onClick: () => onNavigate('connected-accounts') },
    { icon: <BellIcon className="w-6 h-6" />, label: "Configurações de Notificação", onClick: () => onNavigate('notification-settings') },
    { icon: <GiftIcon className="w-6 h-6 text-pink-400" />, label: "Notificações de Presente", onClick: () => onNavigate('gift-notification-settings') },
    { icon: <MailIcon className="w-6 h-6" />, label: "Convite privado ao vivo", onClick: () => onNavigate('private-live-invite-settings') },
    { icon: <LockSolidIcon className="w-6 h-6" />, label: "Configurações de Privacidade", onClick: () => onNavigate('privacy-settings') },
    { icon: <DollarIcon className="w-6 h-6" />, label: "Informações de Ganhos", onClick: () => onNavigate('earnings-info') },
    { icon: <CopyrightIcon className="w-6 h-6" />, label: "Direitos Autorais", onClick: () => onNavigate('copyright') },
    { icon: <InfoIcon className="w-6 h-6" />, label: "Versão do App", onClick: () => onNavigate('app-version') },
    { icon: <CodeBracketIcon className="w-6 h-6" />, label: "Ferramentas do Desenvolvedor", onClick: () => onNavigate('developer-tools') },
    { icon: <DocumentTextIcon className="w-6 h-6" />, label: "Documentação de Venda", onClick: () => onNavigate('documentation') },
    { icon: <TrashIcon className="w-6 h-6" />, label: "Excluir Conta", onClick: handleDeleteClick, isDestructive: true }
  ];

  return (
    <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 relative">
        <button onClick={onExit} className="p-2 -m-2 z-10">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-xl absolute left-1/2 -translate-x-1/2">Configurações</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow overflow-y-auto px-4 scrollbar-hide">
        <div className="bg-[#1c1c1c] rounded-xl divide-y divide-gray-700/50">
          {menuItems.map((item, index) => (
            <SettingsMenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              isDestructive={item.isDestructive}
            />
          ))}
        </div>
      </main>

      <footer className="p-6 shrink-0 mt-auto">
        <button
            onClick={onLogout}
            className="w-full bg-red-900/50 text-red-400 font-semibold py-3.5 rounded-xl text-lg transition-colors hover:bg-red-800/50"
        >
          Sair
        </button>
      </footer>
    </div>
  );
};

export default SettingsScreen;