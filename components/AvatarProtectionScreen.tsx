
import React, { useState, useEffect } from 'react';
import { BackIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface AvatarProtectionScreenProps {
  onClose: () => void;
  currentUser: User;
  updateUser: (user: User) => void;
  addToast: (type: ToastType, message: string) => void;
}

const AvatarProtectionScreen: React.FC<AvatarProtectionScreenProps> = ({ onClose, currentUser, updateUser, addToast }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    api.getAvatarProtectionStatus(currentUser.id)
      .then(data => {
        setIsEnabled(data.isEnabled);
      })
      .catch(() => {
        addToast(ToastType.Error, "Falha ao carregar o status da proteção.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser.id, addToast]);
  
  const handleSave = async () => {
    try {
      const response = await api.toggleAvatarProtection(currentUser.id, isEnabled);
      
      if (response.success && response.user) {
        updateUser(response.user);
        addToast(ToastType.Success, "Configuração salva com sucesso!");
        onClose();
      } else {
        throw new Error("Falha ao salvar a configuração.");
      }
    } catch (error) {
      addToast(ToastType.Error, (error as Error).message || "Erro ao salvar a configuração.");
    }
  };

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col text-white font-sans">
       <header className="flex items-center justify-between p-4 flex-shrink-0 z-10">
        <button onClick={onClose}><BackIcon className="w-6 h-6" /></button>
        <h1 className="text-xl font-bold">{t('avatarProtection.title')}</h1>
        <button onClick={handleSave} className="font-semibold text-lg text-white">{t('avatarProtection.save')}</button>
      </header>
       <main className="flex-grow flex flex-col items-center justify-between text-center p-8 bg-[#111]">
        {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
                <LoadingSpinner />
            </div>
        ) : (
            <>
                <div className="flex flex-col items-center mt-8">
                    <div className="relative w-40 h-40 mb-6">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin-slow"></div>
                        <img src={currentUser.avatarUrl} alt="Avatar" className="relative w-full h-full object-cover rounded-full border-4 border-black" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('avatarProtection.heading')}</h2>
                    <p className="text-gray-400 max-w-xs">
                        {t('avatarProtection.description')}
                    </p>
                </div>
                
                <div className="w-full bg-[#1c1c1e] p-4 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-lg">{t('avatarProtection.toggle')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </>
        )}
       </main>
    </div>
  );
};

export default AvatarProtectionScreen;
