
import React, { useState, useEffect } from 'react';
import { BackIcon, PixIcon, MercadoPagoIcon, CheckCircleIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { api } from '../services/api';

interface ConfigureWithdrawalMethodScreenProps {
  onClose: () => void;
  currentUser: User;
  updateUser: (user: User) => void;
  addToast: (type: ToastType, message: string) => void;
}

type PaymentMethod = 'pix' | 'mercado_pago';

const ConfigureWithdrawalMethodScreen: React.FC<ConfigureWithdrawalMethodScreenProps> = ({ onClose, currentUser, updateUser, addToast }) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [pixKey, setPixKey] = useState('');
  const [mercadoPagoEmail, setMercadoPagoEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (currentUser.withdrawal_method) {
        const { method, details } = currentUser.withdrawal_method;
        setSelectedMethod(method as PaymentMethod);
        if (method === 'pix' && details.pixKey) {
            setPixKey(details.pixKey);
        } else if (method === 'mercado_pago' && details.email) {
            setMercadoPagoEmail(details.email);
        }
    }
  }, [currentUser]);

  const handleSave = async () => {
    let method: string;
    let details: any;

    if (selectedMethod === 'pix') {
        if (!pixKey.trim()) {
            addToast(ToastType.Error, "Por favor, insira sua chave PIX.");
            return;
        }
        method = 'pix';
        details = { pixKey };
    } else {
        if (!mercadoPagoEmail.trim() || !/\S+@\S+\.\S+/.test(mercadoPagoEmail)) {
            addToast(ToastType.Error, "Por favor, insira um e-mail válido do Mercado Pago.");
            return;
        }
        method = 'mercado_pago';
        details = { email: mercadoPagoEmail };
    }

    setIsSaving(true);
    try {
        const { success, user } = await api.setWithdrawalMethod(method, details);
        if (success && user) {
            updateUser(user);
            addToast(ToastType.Success, "Método de saque salvo!");
            onClose();
        } else {
            throw new Error("Falha ao salvar método.");
        }
    } catch (error) {
        addToast(ToastType.Error, (error as Error).message);
    } finally {
        setIsSaving(false);
    }
  };

  const PaymentMethodButton: React.FC<{
    method: PaymentMethod;
    label: string;
    icon: React.ReactNode;
  }> = ({ method, label, icon }) => {
    const isSelected = selectedMethod === method;
    return (
      <button
        onClick={() => setSelectedMethod(method)}
        className={`relative flex flex-col items-center justify-center space-y-2 p-4 rounded-lg transition-all
          ${isSelected ? 'bg-[#1C1C1E] border-2 border-green-500' : 'bg-[#2C2C2E] border-2 border-transparent'}`}
      >
        {icon}
        <span className="text-white font-semibold">{label}</span>
        {isSelected && (
          <div className="absolute top-1 right-1">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="absolute inset-0 bg-[#111111] z-50 flex flex-col text-white">
      <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="absolute">
          <BackIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow text-center">
          <h1 className="text-lg font-semibold">{t('wallet.configureWithdraw.title')}</h1>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6">
        <p className="text-gray-300">{t('wallet.configureWithdraw.description')}</p>

        <div className="grid grid-cols-2 gap-4">
          <PaymentMethodButton method="pix" label="PIX" icon={<PixIcon className="w-16 h-16" />} />
          <PaymentMethodButton method="mercado_pago" label="Mercado Pago" icon={<MercadoPagoIcon className="w-16 h-16" />} />
        </div>

        {selectedMethod === 'pix' && (
          <div className="space-y-3">
            <label htmlFor="pix-key" className="text-sm text-gray-300">{t('wallet.configureWithdraw.pixKey')}</label>
            <input
              id="pix-key"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder={t('wallet.configureWithdraw.pixPlaceholder')}
              className="w-full bg-[#2C2C2E] text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {selectedMethod === 'mercado_pago' && (
            <div className="space-y-3">
                <label htmlFor="mercado-pago-email" className="text-sm text-gray-300">{t('wallet.configureWithdraw.mercadoPagoEmail')}</label>
                <input
                    id="mercado-pago-email"
                    type="email"
                    value={mercadoPagoEmail}
                    onChange={(e) => setMercadoPagoEmail(e.target.value)}
                    placeholder={t('wallet.configureWithdraw.mercadoPagoPlaceholder')}
                    className="w-full bg-[#2C2C2E] text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
        )}
      </main>

      <footer className="p-4 flex-grow-0 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-full hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isSaving ? "Salvando..." : t('common.save')}
        </button>
      </footer>
    </div>
  );
};

export default ConfigureWithdrawalMethodScreen;