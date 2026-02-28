import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../icons';
import { useTranslation } from '../../i18n';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';

interface PipSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  updateUser: (user: User) => void;
  addToast: (type: ToastType, message: string) => void;
}

const PipSettingsModal: React.FC<PipSettingsModalProps> = ({ isOpen, onClose, currentUser, updateUser, addToast }) => {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(currentUser.pipEnabled || false);

  useEffect(() => {
    if (isOpen) {
      setIsEnabled(currentUser.pipEnabled || false);
    }
  }, [isOpen, currentUser.pipEnabled]);

  const handleToggle = async () => {
    const newEnabledState = !isEnabled;
    setIsEnabled(newEnabledState); // Optimistic update

    try {
      const { success, user } = await api.togglePip(currentUser.id, newEnabledState);
      if (success && user) {
        updateUser(user);
        addToast(ToastType.Success, "Configuração salva!");
      } else {
        throw new Error("Falha ao salvar a configuração.");
      }
    } catch (error) {
      setIsEnabled(!newEnabledState); // Revert on failure
      addToast(ToastType.Error, (error as Error).message);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c1e] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('settings.privacy.pipModalTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        </div>
        
        <p className="text-gray-300 text-sm mb-6">{t('settings.privacy.pipModalDescription')}</p>

        {/* Visual Demonstration */}
        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: "url('https://picsum.photos/seed/bg-main/400/225')"}}></div>
            <div className="absolute bottom-2 right-2 w-1/3 aspect-video bg-cover bg-center rounded border-2 border-white/50 shadow-lg" style={{backgroundImage: "url('https://picsum.photos/seed/bg-pip/200/112')"}}></div>
        </div>

        <div className="flex items-center justify-between bg-[#2c2c2e] p-4 rounded-lg">
          <span className="font-semibold text-white">{t('settings.privacy.pipModalToggle')}</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isEnabled} onChange={handleToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PipSettingsModal;